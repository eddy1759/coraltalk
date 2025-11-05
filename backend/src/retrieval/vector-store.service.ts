import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingService } from './embedding.service';
import { RetrievalResult } from '../common/types/sse.types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private readonly logger = new Logger(VectorStoreService.name);
  private isInitialized = false;

  constructor(
    private configService: ConfigService,
    private embeddingService: EmbeddingService,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.initialize();
  }

  private async initialize() {
    try {
      this.logger.log('Initializing PostgreSQL connection...');

      await this.prisma.$queryRaw`SELECT 1`;

      // Check if pgvector extension exists
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM pg_extension WHERE extname = 'vector';
      `;

      if (result.length === 0) {
        this.logger.warn(
          'pgvector extension not found. Attempting to create...',
        );
        await this.prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector;`;
        this.logger.log('✓ pgvector extension created');
      }

      this.isInitialized = true;
      this.logger.log('✓ Vector Store initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Vector Store:', error);
      throw error;
    }
  }

  /**
   * Search for relevant documents using cosine similarity
   * Returns documents with similarity scores (0-1, higher is more similar)
   */
  async search(query: string, topK?: number): Promise<RetrievalResult[]> {
    if (!this.isInitialized) {
      throw new Error('Vector Store not initialized');
    }

    const k = topK || this.configService.get<number>('retrieval.topK');

    try {
      this.logger.debug(`Searching for query: "${query}" (top ${k})`);

      // Generate embedding for the query
      const queryEmbedding = await this.embeddingService.embedQuery(query);
      const embeddingString = `[${queryEmbedding.join(',')}]`;

      // Perform vector similarity search using cosine distance
      // Note: We use 1 - cosine_distance to get similarity (0-1 scale)
      const results = await this.prisma.$queryRaw<any[]>`
        SELECT 
          id,
          content,
          metadata,
          1 - (embedding <=> ${embeddingString}::vector) as score
        FROM document_chunks
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${embeddingString}::vector
        LIMIT ${k};
      `;

      const retrievalResults: RetrievalResult[] = results.map((row) => ({
        chunkId: row.id,
        content: row.content,
        score: parseFloat(row.score),
        metadata: row.metadata || {},
      }));

      this.logger.debug(
        `Found ${retrievalResults.length} results. Top score: ${
          retrievalResults[0]?.score.toFixed(3) || 'N/A'
        }`,
      );

      return retrievalResults;
    } catch (error) {
      this.logger.error('Error during vector search:', error);
      throw error;
    }
  }

  /**
   * Add a single document chunk with embedding
   */
  async addChunk(
    content: string,
    embedding: number[],
    documentId: string,
    chunkIndex: number,
    metadata?: Record<string, any>,
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Vector Store not initialized');
    }

    try {
      const embeddingString = `[${embedding.join(',')}]`;

      await this.prisma.$executeRaw`
        INSERT INTO document_chunks (id, content, embedding, "chunkIndex", metadata, "documentId", "createdAt")
        VALUES (
          gen_random_uuid()::text,
          ${content},
          ${embeddingString}::vector,
          ${chunkIndex},
          ${JSON.stringify(metadata || {})}::jsonb,
          ${documentId},
          NOW()
        );
      `;
    } catch (error) {
      this.logger.error('Error adding chunk:', error);
      throw error;
    }
  }

  /**
   * Add multiple document chunks in batch
   */
  async addChunks(
    chunks: Array<{
      content: string;
      embedding: number[];
      documentId: string;
      chunkIndex: number;
      metadata?: Record<string, any>;
    }>,
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Vector Store not initialized');
    }

    this.logger.log(`Adding ${chunks.length} chunks to vector store...`);

    try {
      // Use transaction for batch insert
      await this.prisma.$transaction(
        chunks.map((chunk) => {
          const embeddingString = `[${chunk.embedding.join(',')}]`;

          return this.prisma.$executeRaw`
            INSERT INTO document_chunks (id, content, embedding, "chunkIndex", metadata, "documentId", "createdAt")
            VALUES (
              gen_random_uuid()::text,
              ${chunk.content},
              ${embeddingString}::vector,
              ${chunk.chunkIndex},
              ${JSON.stringify(chunk.metadata || {})}::jsonb,
              ${chunk.documentId},
              NOW()
            );
          `;
        }),
      );

      this.logger.log(`✓ Successfully added ${chunks.length} chunks`);
    } catch (error) {
      this.logger.error('Error adding chunks in batch:', error);
      throw error;
    }
  }

  /**
   * Create a document record
   */
  async createDocument(name: string, content: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Vector Store not initialized');
    }

    try {
      const document = await this.prisma.document.create({
        data: {
          name,
          content,
        },
      });

      this.logger.log(`✓ Created document: ${name} (ID: ${document.id})`);
      return document.id;
    } catch (error) {
      this.logger.error('Error creating document:', error);
      throw error;
    }
  }

  /**
   * Delete all chunks and documents (useful for re-ingestion)
   */
  async clearAll(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Vector Store not initialized');
    }

    try {
      await this.prisma.documentChunk.deleteMany();
      await this.prisma.document.deleteMany();
      this.logger.log('✓ Cleared all documents and chunks');
    } catch (error) {
      this.logger.error('Error clearing data:', error);
      throw error;
    }
  }

  /**
   * Get statistics about stored vectors
   */
  async getStats(): Promise<{
    totalDocuments: number;
    totalChunks: number;
    chunksWithEmbeddings: number;
  }> {
    const totalDocuments = await this.prisma.document.count();
    const totalChunks = await this.prisma.documentChunk.count();
    const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count
    FROM document_chunks
    WHERE embedding IS NOT NULL
  `;

    const chunksWithEmbeddings = Number(result[0].count);

    return {
      totalDocuments,
      totalChunks,
      chunksWithEmbeddings,
    };
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}
