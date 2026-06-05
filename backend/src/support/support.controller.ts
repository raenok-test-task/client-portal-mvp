import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

@ApiTags('support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('support-ticket')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new support ticket' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTicketDto) {
    return this.supportService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List support tickets for the authenticated client' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.supportService.findForUser(user.id);
  }
}
