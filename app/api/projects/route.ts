import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all projects
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    const projects = await prisma.project.findMany({
      where: clientId ? { clientId } : undefined,
      include: {
        client: true,
        invoices: true,
        _count: {
          select: {
            invoices: true,
            timeEntries: true,
            expenses: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST create new project
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description || null,
        clientId: body.clientId,
        status: body.status || 'active',
        budget: body.budget ? parseFloat(body.budget) : null,
        currency: body.currency || 'USD',
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null
      },
      include: {
        client: true
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
