import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET settings
export async function GET() {
  try {
    let settings = await prisma.settings.findFirst()

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          businessName: 'FreelanceManager'
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// POST/PUT update settings (upsert)
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Get existing settings
    const existingSettings = await prisma.settings.findFirst()

    let settings
    if (existingSettings) {
      // Update existing settings
      settings = await prisma.settings.update({
        where: { id: existingSettings.id },
        data: body
      })
    } else {
      // Create new settings
      settings = await prisma.settings.create({
        data: body
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
