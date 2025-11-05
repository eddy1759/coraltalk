import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({
    description: 'The role of the message sender.',
    example: 'user',
    enum: ['user', 'assistant'],
  })
  @IsString()
  role!: 'user' | 'assistant';

  @IsString()
  content!: string;
}

export class ChatQueryDto {
  @ApiProperty({
    description: 'The query/question from the user.',
    example: 'What is the price of the Pro plan?',
  })
  @IsString()
  query!: string;

  @ApiProperty({
    description:
      'Whether to use the general LLM for answering instead of relying on internal knowledge.',
    example: false,
  })
  @IsBoolean()
  useGeneralLLM!: boolean;

  @ApiProperty({
    description:
      'Optional conversation history to provide context for the chat.',
    type: [ChatMessageDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  conversationHistory?: ChatMessageDto[];
}
