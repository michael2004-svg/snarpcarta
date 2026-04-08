import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { CartService } from './cart.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  getCart(@Request() req: any) {
    return this.cartService.getCart(req.user.id)
  }

  @Post()
  addItem(@Request() req: any, @Body() body: { productId: string; quantity?: number }) {
    return this.cartService.addItem(req.user.id, body.productId, body.quantity)
  }

  @Put(':itemId')
  updateItem(@Request() req: any, @Param('itemId') itemId: string, @Body() body: { quantity: number }) {
    return this.cartService.updateItem(req.user.id, itemId, body.quantity)
  }

  @Delete(':itemId')
  removeItem(@Request() req: any, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(req.user.id, itemId)
  }

  @Delete()
  clearCart(@Request() req: any) {
    return this.cartService.clearCart(req.user.id)
  }
}