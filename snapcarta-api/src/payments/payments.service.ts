import { Injectable, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Stripe from 'stripe'
import axios from 'axios'
import { OrdersService } from '../orders/orders.service'
import { OrderStatus, PaymentMethod } from '../orders/orders.entity'

@Injectable()
export class PaymentsService {
  private stripe: Stripe

  constructor(
    private config: ConfigService,
    private ordersService: OrdersService,
  ) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY')!)
  }

  // ── Stripe ──────────────────────────────────────────────
  async createStripeIntent(orderId: string, amountUSD: number) {
    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(amountUSD * 100), // cents
      currency: 'usd',
      metadata: { orderId },
    })
    return { clientSecret: intent.client_secret }
  }

  async handleStripeWebhook(payload: Buffer, signature: string) {
    let event: Stripe.Event
    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.config.get('STRIPE_WEBHOOK_SECRET')!,
      )
    } catch {
      throw new BadRequestException('Invalid webhook signature')
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent
      const orderId = intent.metadata.orderId
      await this.ordersService.updateStatus(orderId, OrderStatus.PAID)
    }
    return { received: true }
  }

  // ── PayPal ───────────────────────────────────────────────
  private async getPayPalToken(): Promise<string> {
    const { data } = await axios.post(
      `https://api-m.${this.config.get('PAYPAL_MODE') === 'live' ? '' : 'sandbox.'}paypal.com/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        auth: {
          username: this.config.get('PAYPAL_CLIENT_ID')!,
          password: this.config.get('PAYPAL_CLIENT_SECRET')!,
        },
      },
    )
    return data.access_token
  }

  async createPayPalOrder(orderId: string, amountUSD: number) {
    const token = await this.getPayPalToken()
    const base = `https://api-m.${this.config.get('PAYPAL_MODE') === 'live' ? '' : 'sandbox.'}paypal.com`

    const { data } = await axios.post(
      `${base}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderId,
          amount: { currency_code: 'USD', value: amountUSD.toFixed(2) },
        }],
        application_context: {
          return_url: `${this.config.get('FRONTEND_URL')}/orders`,
          cancel_url: `${this.config.get('FRONTEND_URL')}/checkout`,
        },
      },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    return { paypalOrderId: data.id, approveUrl: data.links.find((l: any) => l.rel === 'approve')?.href }
  }

  async capturePayPalOrder(paypalOrderId: string, internalOrderId: string) {
    const token = await this.getPayPalToken()
    const base = `https://api-m.${this.config.get('PAYPAL_MODE') === 'live' ? '' : 'sandbox.'}paypal.com`

    await axios.post(
      `${base}/v2/checkout/orders/${paypalOrderId}/capture`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    )
    await this.ordersService.updateStatus(internalOrderId, OrderStatus.PAID)
    return { success: true }
  }

  // ── M-Pesa (Daraja STK Push) ─────────────────────────────
  private async getMpesaToken(): Promise<string> {
    const auth = Buffer.from(
      `${this.config.get('MPESA_CONSUMER_KEY')}:${this.config.get('MPESA_CONSUMER_SECRET')}`
    ).toString('base64')

    const { data } = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${auth}` } },
    )
    return data.access_token
  }

  async mpesaStkPush(phone: string, amountKES: number, orderId: string) {
    const token = await this.getMpesaToken()
    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
    const password = Buffer.from(
      `${this.config.get('MPESA_SHORTCODE')}${this.config.get('MPESA_PASSKEY')}${timestamp}`
    ).toString('base64')

    const { data } = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: this.config.get('MPESA_SHORTCODE'),
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.ceil(amountKES),
        PartyA: phone.replace('+', '').replace(/^0/, '254'),
        PartyB: this.config.get('MPESA_SHORTCODE'),
        PhoneNumber: phone.replace('+', '').replace(/^0/, '254'),
        CallBackURL: this.config.get('MPESA_CALLBACK_URL'),
        AccountReference: `SC-${orderId.slice(-6).toUpperCase()}`,
        TransactionDesc: 'Snapcarta Order Payment',
      },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    return { checkoutRequestId: data.CheckoutRequestID, merchantRequestId: data.MerchantRequestID }
  }

  async mpesaCallback(body: any) {
    const result = body.Body?.stkCallback
    if (result?.ResultCode === 0) {
      // Payment successful — extract order reference from metadata if needed
      console.log('M-Pesa payment successful:', result.CallbackMetadata)
    }
    return { received: true }
  }
}
