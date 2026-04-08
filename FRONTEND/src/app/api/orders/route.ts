import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    let query = supabase
      .from('orders')
      .select('*, order_items(*, products(*))')
      .order('createdAt', { ascending: false })

    if (userId) {
      query = query.eq('userId', userId)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Failed to fetch orders:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ orders: orders || [] })
  } catch (err) {
    console.error('Orders GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const {
      userId,
      items,
      subtotal,
      shippingCost = 4.99,
      total,
      paymentMethod,
      shippingAddress,
    } = body

    if (!items || items.length === 0 || !total || !shippingAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const orderNumber = `SC-${Date.now().toString(36).toUpperCase()}`

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        orderNumber,
        userId,
        subtotal,
        shippingCost,
        total,
        paymentMethod,
        shippingAddress,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError) {
      console.error('Failed to create order:', orderError)
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    const orderItems = items.map((item: any) => ({
      orderId: order.id,
      productId: item.productId || item.id,
      quantity: item.quantity,
      priceAtPurchase: item.price,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Failed to create order items:', itemsError)
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, order })
  } catch (err) {
    console.error('Orders POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}