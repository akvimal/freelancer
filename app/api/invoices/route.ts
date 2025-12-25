import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateInvoiceNumber, calculateInvoiceTotals } from '@/lib/utils'

// GET all invoices
export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
        items: true,
        payments: true
      }
    })
    return NextResponse.json(invoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

// POST create new invoice
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Generate invoice number if not provided
    const invoiceNumber = body.invoiceNumber || generateInvoiceNumber()

    // Calculate subtotal from items
    const subtotal = body.items?.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.rate)
    }, 0) || 0

    // Calculate totals
    const { taxAmount, total } = calculateInvoiceTotals(
      subtotal,
      body.taxRate || 0,
      body.discount || 0
    )

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: body.clientId,
        projectId: body.projectId || null,
        issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
        dueDate: new Date(body.dueDate),
        status: body.status || 'draft',
        subtotal,
        taxRate: body.taxRate || 0,
        taxAmount,
        discount: body.discount || 0,
        total,
        currency: body.currency || 'USD',
        notes: body.notes || null,
        terms: body.terms || null,
        items: {
          create: body.items?.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.quantity * item.rate
          })) || []
        }
      },
      include: {
        client: true,
        project: true,
        items: true
      }
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
