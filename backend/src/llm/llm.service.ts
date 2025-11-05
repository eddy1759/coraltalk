import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI, ChatOpenAICallOptions } from '@langchain/openai';
import { Observable } from 'rxjs';
import { SSEEvent, CitationData } from '../common/types/sse.types';

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private streamingModel: ChatOpenAI;
  private nonStreamingModel: ChatOpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('openai.apiKey');
    const modelName = this.configService.get<string>('openai.model');
    const temperature = this.configService.get<number>('llm.temperature');
    const maxTokens = this.configService.get<number>('llm.maxTokens');

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const commonSettings = {
      openAIApiKey: apiKey,
      modelName,
      temperature,
      maxTokens,
    };

    this.streamingModel = new ChatOpenAI({
      ...commonSettings,
      streaming: true,
    });

    this.nonStreamingModel = new ChatOpenAI({
      ...commonSettings,
      streaming: false,
    });

    this.logger.log(`LLM Service initialized with model: ${modelName}`);
  }

  streamCompletion(
    prompt: string,
    citationSource: CitationData['source'],
    confidence?: number,
    temperature?: number,
  ): Observable<SSEEvent> {
    return new Observable<SSEEvent>((subscriber) => {
      const streamMessages = async () => {
        try {
          this.logger.debug(
            `Starting stream for prompt: ${prompt.substring(0, 100)}...`,
          );

          let modelToUse = this.streamingModel;
          const callOptions: Partial<ChatOpenAICallOptions> = {};

          if (temperature !== undefined) {
            this.logger.debug(
              `Creating one-time model with temperature: ${temperature}`,
            );

            modelToUse = new ChatOpenAI({
              openAIApiKey: this.configService.get<string>('openai.apiKey'),
              modelName: this.configService.get<string>('openai.model'),
              maxTokens: this.configService.get<number>('llm.maxTokens'),
              temperature: temperature,
              streaming: true,
            });
          }

          const stream = await modelToUse.stream(prompt, callOptions);

          for await (const chunk of stream) {
            const content = chunk.content as string;
            if (content) {
              subscriber.next({
                event: 'token',
                data: content,
              });
            }
          }

          const citationData: CitationData = {
            source: citationSource,
            confidence,
          };

          subscriber.next({
            event: 'citation',
            data: JSON.stringify(citationData),
          });

          subscriber.next({
            event: 'end',
            data: 'Stream complete',
          });

          subscriber.complete();
          this.logger.debug('Stream completed successfully');
        } catch (error: any) {
          this.logger.error('Error during streaming:', error);
          subscriber.next({
            event: 'error',
            data: error.message || 'An error occurred during streaming',
          });
          subscriber.complete();
        }
      };

      streamMessages();
    });
  }

  getNonStreamingModel(): ChatOpenAI {
    return this.nonStreamingModel;
  }
}
