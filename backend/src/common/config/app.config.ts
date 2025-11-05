export default () => ({
  port: parseInt(process.env.PORT!, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL,
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    embeddingModel:
      process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  },

  llm: {
    temperature: parseFloat(process.env.LLM_TEMPERATURE!) || 0.7,
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS!, 10) || 500,
    streamingEnabled: process.env.STREAMING_ENABLED === 'true',
  },

  retrieval: {
    topK: parseInt(process.env.RETRIEVAL_TOP_K!, 10) || 5,
    confidenceThresholdHigh:
      parseFloat(process.env.CONFIDENCE_THRESHOLD_HIGH!) || 0.7,
    confidenceThresholdLow:
      parseFloat(process.env.CONFIDENCE_THRESHOLD_LOW!) || 0.4,
    strictKBConfidenceThreshold:
      parseFloat(process.env.STRICT_KB_CONFIDENCE_THRESHOLD!) || 0.45,
  },
  vector: {
    dimensions: parseInt(process.env.VECTOR_DIMENSIONS!, 10) || 1536,
    similarityMetric: process.env.SIMILARITY_METRIC || 'cosine',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
});
