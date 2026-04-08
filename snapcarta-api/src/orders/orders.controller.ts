import { Controller, Get, Post, Put, Param, Body, UseGuards, Request, Query } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { OrdersService } from './orders.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { PaymentMethod, OrderStatus } from './orders.entity'

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('checkout')
  checkout(
    @Request() req: any,
    @Body() body: { shippingAddress: any; paymentMethod: PaymentMethod }
  ) {
    return this.ordersService.createFromCart(
      req.user.id,
      body.shippingAddress,
      body.paymentMethod,
    )
  }

  @Post()
  createOrder(
    @Request() req: any,
    @Body() body: { shippingAddress: any; paymentMethod: PaymentMethod }
  ) {
    return this.ordersService.createFromCart(
      req.user.id,
      body.shippingAddress,
      body.paymentMethod,
    )
  }

  @Get('my')
  getMyOrders(@Request() req: any) {
    return this.ordersService.findUserOrders(req.user.id)
  }

  @Get('my/:id')
  getMyOrder(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.findOne(id, req.user.id)
  }

  // Admin routes
  @Get()
  @Roles('admin')
  getAllOrders(@Query('page') page: number, @Query('limit') limit: number) {
    return this.ordersService.findAll(page, limit)
  }

  @Put(':id/status')
  @Roles('admin')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus; trackingNumber?: string }
  ) {
    return this.ordersService.updateStatus(id, body.status, body.trackingNumber)
  }
}