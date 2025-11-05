import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { IngestionService } from '../ingestion/ingestion.service';
import { Logger } from '@nestjs/common';

async function ingest() {
  const logger = new Logger('IngestScript');

  try {
    logger.log('🚀 Starting document ingestion...');

    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get ingestion service
    const ingestionService = app.get(IngestionService);

    // Check for command line arguments
    const args = process.argv.slice(2);
    const clearExisting = args.includes('--clear');

    if (clearExisting) {
      logger.warn('⚠️  Will clear existing data before ingestion');
    }

    // Ingest default FAQ
    await ingestionService.ingestDefaultFAQ(clearExisting);

    logger.log('✅ Ingestion completed successfully!');
    logger.log('💡 You can now start the application with: npm run dev');

    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Ingestion failed:', error);
    process.exit(1);
  }
}

// Run ingestion
ingest();
