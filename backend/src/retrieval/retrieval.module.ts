import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VectorStoreService } from './vector-store.service';
import { EmbeddingService } from './embedding.service';

@Module({
  imports: [ConfigModule],
  providers: [VectorStoreService, EmbeddingService],
  exports: [VectorStoreService, EmbeddingService],
})
export class RetrievalModule {}
