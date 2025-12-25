import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST create new payment
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        invoiceId: body.invoiceId,
        amount: body.amount,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
        paymentMethod: body.paymentMethod,
        notes: body.notes || null
      }
    })

    // Calculate total payments for this invoice
    const allPayments = await prisma.payment.findMany({
      where: { invoiceId: body.invoiceId }
    })

    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0)

    // Get invoice to check if fully paid
    const invoice = await prisma.invoice.findUnique({
      where: { id: body.invoiceId }
    })

    if (invoice) {
      // Update invoice status if fully paid
      if (totalPaid >= invoice.total) {
        await prisma.invoice.update({
          where: { id: body.invoiceId },
          data: { status: 'paid' }
        })
      }
    }

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}
