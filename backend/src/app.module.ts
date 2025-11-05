import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './common/config/app.config';
import { ChatModule } from './chat/chat.module';
import { RetrievalModule } from './retrieval/retrieval.module';
import { LLMModule } from './llm/llm.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    ChatModule,
    RetrievalModule,
    LLMModule,
    IngestionModule,
  ],
})
export class AppModule {}
