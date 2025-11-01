import { NextRequest, NextResponse } from 'next/server';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
  try {
    const { type, planId, productos } = await req.json();

    let line_items: any[] = [];

    if (type === 'plan') {
      const plans: Record<string, { name: string; price: number }> = {
        basico: { name: 'Plan Básico', price: 2999 },
        completo: { name: 'Plan Completo', price: 4999 },
      };

      const plan = plans[planId as keyof typeof plans];
      if (!plan) {
        return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
      }

      line_items = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
            },
            unit_amount: plan.price,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ];
    } else if (type === 'productos') {
      line_items = productos.map((producto: any) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: producto.nombre,
          },
          unit_amount: Math.round(producto.precio * 100),
        },
        quantity: producto.cantidad,
      }));
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: type === 'plan' ? 'subscription' : 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?canceled=true`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Error al crear sesión de pago:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar el pago' },
      { status: 500 }
    );
  }
}
