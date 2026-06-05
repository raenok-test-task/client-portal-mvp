import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({ example: 'Filter replacement question', minLength: 3, maxLength: 150 })
  @IsString()
  @MinLength(3, { message: 'Subject must be at least 3 characters' })
  @MaxLength(150)
  subject!: string;

  @ApiProperty({ example: 'How often should I replace the HEPA-12 filter?', minLength: 10 })
  @IsString()
  @MinLength(10, { message: 'Message must be at least 10 characters' })
  @MaxLength(5000)
  message!: string;
}
