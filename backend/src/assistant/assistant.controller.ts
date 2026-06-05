import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { AssistantService } from './assistant.service';
import { ChatDto } from './dto/chat.dto';

@ApiTags('assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Ask the AI assistant a question about your account data' })
  chat(@CurrentUser() user: AuthUser, @Body() dto: ChatDto) {
    return this.assistantService.chat(user.id, dto.message);
  }
}
