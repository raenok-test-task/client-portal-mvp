import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChatDto {
  @ApiProperty({
    example: 'Show my last orders',
    description: 'Natural-language question about the client account',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  message!: string;
}
