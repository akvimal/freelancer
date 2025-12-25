import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all clients
export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { projects: true, invoices: true }
        }
      }
    })
    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

// POST create new client
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const client = await prisma.client.create({
      data: body
    })
    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}
