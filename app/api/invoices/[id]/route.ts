import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateInvoiceTotals } from '@/lib/utils'

// GET single invoice
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        project: true,
        items: true,
        payments: {
          orderBy: { paymentDate: 'desc' }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

// PUT update invoice
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // If items are being updated, recalculate totals
    let updateData: any = { ...body }

    if (body.items) {
      // Calculate subtotal from items
      const subtotal = body.items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.rate)
      }, 0)

      // Calculate totals
      const { taxAmount, total } = calculateInvoiceTotals(
        subtotal,
        body.taxRate || 0,
        body.discount || 0
      )

      // Delete existing items and create new ones
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id }
      })

      updateData = {
        ...updateData,
        subtotal,
        taxAmount,
        total,
        items: {
          create: body.items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.quantity * item.rate
          }))
        }
      }
      delete updateData.items
    } else {
      // Recalculate if tax or discount changed
      if (body.taxRate !== undefined || body.discount !== undefined) {
        const currentInvoice = await prisma.invoice.findUnique({
          where: { id }
        })

        if (currentInvoice) {
          const { taxAmount, total } = calculateInvoiceTotals(
            currentInvoice.subtotal,
            body.taxRate ?? currentInvoice.taxRate,
            body.discount ?? currentInvoice.discount
          )
          updateData.taxAmount = taxAmount
          updateData.total = total
        }
      }
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        project: true,
        items: true,
        payments: true
      }
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

// DELETE invoice
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if invoice has payments
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

    if (invoice.payments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete invoices with payments' },
        { status: 400 }
      )
    }

    await prisma.invoice.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}
