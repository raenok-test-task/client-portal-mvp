import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { OrdersService } from './orders.service';
import { QueryOrdersDto } from './dto/query-orders.dto';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List the authenticated client orders with optional search/filter' })
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryOrdersDto) {
    return this.ordersService.findForUser(user.id, query);
  }
}
