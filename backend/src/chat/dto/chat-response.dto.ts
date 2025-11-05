import { ApiProperty } from '@nestjs/swagger';

class CitationObject {
  @ApiProperty({ example: 'Internal Docs' })
  source!: string;

  @ApiProperty({ example: 0.75 })
  confidence!: number;
}

export class ChatTestResponseDto {
  @ApiProperty({
    description: 'The complete, aggregated message from all "token" events.',
    example: 'CloudStore Pro offers 50GB of storage.',
  })
  message!: string;

  @ApiProperty({
    description: 'The citation object from the "citation" event.',
    example: { source: 'Internal Docs', confidence: 0.75 },
    type: CitationObject,
  })
  citation!: unknown;

  @ApiProperty({
    description: 'The total number of SSE events processed.',
    example: 42,
  })
  events!: number;
}
