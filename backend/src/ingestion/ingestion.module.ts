import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IngestionService } from './ingestion.service';
import { RetrievalModule } from '../retrieval/retrieval.module';

@Module({
  imports: [ConfigModule, RetrievalModule],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
