import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { AssistantService } from './assistant.service';
import { AssistantController } from './assistant.controller';

@Module({
  imports: [OrdersModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
