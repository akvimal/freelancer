import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT update invoice status
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    // Fetch current invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Calculate if paid
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
    const isPaid = totalPaid >= invoice.total

    // Define valid transitions
    const validTransitions: { [key: string]: string[] } = {
      draft: ['sent', 'cancelled'],
      sent: ['overdue', 'cancelled'],
      paid: ['cancelled'],
      overdue: ['cancelled'],
      cancelled: []
    }

    // Auto-update to paid if fully paid
    let newStatus = status
    if (isPaid && invoice.status !== 'paid') {
      newStatus = 'paid'
    } else {
      // Validate transition
      const allowedTransitions = validTransitions[invoice.status] || []
      if (!allowedTransitions.includes(status)) {
        return NextResponse.json(
          { error: `Cannot change status from ${invoice.status} to ${status}` },
          { status: 400 }
        )
      }
    }

    // Update status
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status: newStatus },
      include: {
        client: true,
        project: true,
        items: true,
        payments: true
      }
    })

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error('Error updating invoice status:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice status' },
      { status: 500 }
    )
  }
}
