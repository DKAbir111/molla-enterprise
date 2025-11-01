import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderItemsDto } from './dto/update-order-items.dto';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Get()
  list(@Req() req: any) {
    return this.orders.findAll(req.user.organizationId);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.orders.create(req.user.organizationId, dto);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.orders.update(req.user.organizationId, id, dto);
  }

  @Put(':id/items')
  updateItems(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateOrderItemsDto) {
    return this.orders.updateItems(req.user.organizationId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.orders.remove(req.user.organizationId, id);
  }
}
