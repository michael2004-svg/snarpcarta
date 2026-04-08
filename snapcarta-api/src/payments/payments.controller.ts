import { Controller, Post, Body, Param, Headers, RawBodyRequest, Req, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { PaymentsService } from './payments.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // Stripe
  @Post('stripe/intent/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createStripeIntent(
    @Param('orderId') orderId: string,
    @Body() body: { amount: number }
  ) {
    return this.paymentsService.createStripeIntent(orderId, body.amount)
  }

  @Post('stripe/webhook')
  handleStripeWebhook(
    @Req() req: any,
    @Headers('stripe-signature') sig: string,
  ) {
    return this.paymentsService.handleStripeWebhook(req.rawBody, sig)
  }

  // PayPal
  @Post('paypal/create/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createPayPalOrder(
    @Param('orderId') orderId: string,
    @Body() body: { amount: number }
  ) {
    return this.paymentsService.createPayPalOrder(orderId, body.amount)
  }

  @Post('paypal/capture')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  capturePayPal(@Body() body: { paypalOrderId: string; orderId: string }) {
    return this.paymentsService.capturePayPalOrder(body.paypalOrderId, body.orderId)
  }

  // M-Pesa
  @Post('mpesa/stk-push')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  mpesaPush(@Body() body: { phone: string; amountKES: number; orderId: string }) {
    return this.paymentsService.mpesaStkPush(body.phone, body.amountKES, body.orderId)
  }

  @Post('mpesa/callback')
  mpesaCallback(@Body() body: any) {
    return this.paymentsService.mpesaCallback(body)
  }
}