import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private embeddings: OpenAIEmbeddings;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('openai.apiKey');
    const modelName = this.configService.get<string>('openai.embeddingModel');

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      modelName,
    });

    this.logger.log(`Embedding Service initialized with model: ${modelName}`);
  }

  getEmbeddings(): OpenAIEmbeddings {
    return this.embeddings;
  }

  async embedQuery(text: string): Promise<number[]> {
    try {
      return await this.embeddings.embedQuery(text);
    } catch (error) {
      this.logger.error('Error generating embedding:', error);
      throw error;
    }
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    try {
      return await this.embeddings.embedDocuments(texts);
    } catch (error) {
      this.logger.error('Error generating document embeddings:', error);
      throw error;
    }
  }
}
