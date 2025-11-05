import { Injectable, Logger } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { VectorStoreService } from '../retrieval/vector-store.service';
import { EmbeddingService } from '../retrieval/embedding.service';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private vectorStoreService: VectorStoreService,
    private embeddingService: EmbeddingService,
  ) {}

  async ingestFromFile(filePath: string, clearExisting = false): Promise<void> {
    try {
      this.logger.log(`Starting ingestion from: ${filePath}`);

      // Optionally clear existing data
      if (clearExisting) {
        this.logger.log('Clearing existing data...');
        await this.vectorStoreService.clearAll();
      }

      // === START: Custom File Loader ===
      this.logger.log(`Loading file with custom loader: ${filePath}`);

      let fileContent: string;
      try {
        fileContent = await fs.readFile(filePath, 'utf8');
      } catch (readError: any) {
        this.logger.error(`Failed to read file: ${filePath}`, readError);
        throw new Error(`Failed to read file: ${readError.message}`);
      }

      // Manually create the 'Document' structure that TextLoader provided.
      // The text splitter expects an array of objects with 'pageContent' and 'metadata'.
      const docs = [
        {
          pageContent: fileContent,
          metadata: {
            source: filePath, // Add source metadata
          },
        },
      ];
      this.logger.log(`✓ Loaded 1 document(s) from file`);
      // === END: Custom File Loader ===

      if (docs.length === 0 || !docs[0].pageContent) {
        // This check is good to keep
        throw new Error('No documents loaded or file is empty');
      }

      const documentContent = docs[0].pageContent;

      // Create document record
      const documentName = path.basename(filePath);
      const documentId = await this.vectorStoreService.createDocument(
        documentName,
        documentContent,
      );

      // Split documents into chunks
      // This part remains unchanged and will work perfectly with the new 'docs' array
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 50,
        separators: ['\n\n', '\n', '. ', ' ', ''],
      });

      const splitDocs = await textSplitter.splitDocuments(docs);
      this.logger.log(`✓ Split into ${splitDocs.length} chunks`);

      // Generate embeddings for all chunks
      this.logger.log('Generating embeddings...');
      const texts = splitDocs.map((doc) => doc.pageContent);
      const embeddings = await this.embeddingService.embedDocuments(texts);
      this.logger.log(`✓ Generated ${embeddings.length} embeddings`);

      // Prepare chunks for batch insert
      const chunks = splitDocs.map((doc, index) => ({
        content: doc.pageContent,
        embedding: embeddings[index],
        documentId,
        chunkIndex: index,
        metadata: {
          source: documentName,
          chunkIndex: index,
          timestamp: new Date().toISOString(),
          ...doc.metadata, // This will include the 'source' from our custom loader
        },
      }));

      // Store in PostgreSQL with pgvector
      await this.vectorStoreService.addChunks(chunks);

      // Get and log statistics
      const stats = await this.vectorStoreService.getStats();
      this.logger.log('✅ Ingestion completed successfully');
      this.logger.log(`   Total documents: ${stats.totalDocuments}`);
      this.logger.log(`   Total chunks: ${stats.totalChunks}`);
      this.logger.log(
        `   Chunks with embeddings: ${stats.chunksWithEmbeddings}`,
      );
    } catch (error) {
      this.logger.error('❌ Ingestion failed:', error);
      throw error;
    }
  }

  async ingestDefaultFAQ(clearExisting = false): Promise<void> {
    const faqPath = path.join(process.cwd(), 'data', 'company-faq.txt');
    await this.ingestFromFile(faqPath, clearExisting);
  }

  /**
   * Ingest multiple files
   */
  async ingestMultipleFiles(
    filePaths: string[],
    clearExisting = false,
  ): Promise<void> {
    try {
      this.logger.log(`Starting batch ingestion for ${filePaths.length} files`);

      if (clearExisting) {
        this.logger.log('Clearing existing data...');
        await this.vectorStoreService.clearAll();
      }

      for (const filePath of filePaths) {
        await this.ingestFromFile(filePath, false); // Don't clear on subsequent files
      }

      const stats = await this.vectorStoreService.getStats();
      this.logger.log('✅ Batch ingestion completed');
      this.logger.log(`   Total documents: ${stats.totalDocuments}`);
      this.logger.log(`   Total chunks: ${stats.totalChunks}`);
    } catch (error) {
      this.logger.error('❌ Batch ingestion failed:', error);
      throw error;
    }
  }
}
