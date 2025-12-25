import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'
import { formatCurrency, formatDate } from '@/lib/utils'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getCurrencySymbol } from '@/lib/utils'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch invoice and settings
    const [invoice, settings] = await Promise.all([
      prisma.invoice.findUnique({
        where: { id },
        include: {
          client: true,
          project: true,
          items: true,
          payments: true
        }
      }),
      prisma.settings.findFirst()
    ])

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Check if email settings are configured
    if (!settings?.emailHost || !settings?.emailUser || !settings?.emailPassword) {
      return NextResponse.json(
        { error: 'Email settings not configured. Please configure in Settings.' },
        { status: 400 }
      )
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: settings.emailHost,
      port: settings.emailPort || 587,
      secure: settings.emailPort === 465, // true for 465, false for other ports
      auth: {
        user: settings.emailUser,
        pass: settings.emailPassword
      }
    })

    // Calculate totals
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
    const amountDue = invoice.total - totalPaid

    // Generate PDF attachment
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Colors
    const primaryColor = [41, 128, 185] // Blue
    const darkGray = [51, 51, 51]
    const lightGray = [128, 128, 128]
    const bgGray = [245, 245, 245]

    // Header Background
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, 0, pageWidth, 30, 'F')

    // Company Name / Logo Area
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', 20, 25)

    // Business name
    if (settings?.businessName && settings.businessName !== 'FreelanceManager') {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(settings.businessName, 20, 25)
    }

    // Invoice Details Section
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    let yPos = 45

    doc.setFont('helvetica', 'bold')
    doc.text('Invoice Number:', 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(invoice.invoiceNumber, 60, yPos)

    yPos += 5
    doc.setFont('helvetica', 'bold')
    doc.text('Issue Date:', 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(new Date(invoice.issueDate).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    }), 60, yPos)

    yPos += 5
    doc.setFont('helvetica', 'bold')
    doc.text('Due Date:', 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(new Date(invoice.dueDate).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    }), 60, yPos)

    if (invoice.project) {
      yPos += 5
      doc.setFont('helvetica', 'bold')
      doc.text('Project:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(invoice.project.name, 60, yPos)
    }

    // Bill To Section
    yPos = 45
    doc.setFillColor(bgGray[0], bgGray[1], bgGray[2])
    doc.roundedRect(pageWidth - 80, yPos - 10, 70, 35, 3, 3, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('BILL TO', pageWidth - 75, yPos - 3)

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(invoice.client.name, pageWidth - 75, yPos + 4)

    yPos += 7
    doc.setFont('helvetica', 'normal')
    if (invoice.client.company) {
      doc.text(invoice.client.company, pageWidth - 75, yPos)
      yPos += 6
    }

    doc.setFontSize(9)
    doc.text(invoice.client.email, pageWidth - 75, yPos)

    // Line Items Table
    const formatPDFAmount = (amount: number) => {
      return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    const tableData = invoice.items.map(item => [
      item.description,
      item.quantity.toString(),
      formatPDFAmount(item.rate),
      formatPDFAmount(item.amount)
    ])

    autoTable(doc, {
      startY: 90,
      head: [['Description', 'Qty', 'Rate (' + invoice.currency + ')', 'Amount (' + invoice.currency + ')']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 3
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: darkGray
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 }
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10

    // Totals Section
    const totalsX = pageWidth - 75
    const totalsWidth = 70
    let currentY = finalY

    doc.setFillColor(bgGray[0], bgGray[1], bgGray[2])
    const totalsHeight = 30 + (invoice.discount > 0 ? 7 : 0) + (invoice.taxRate > 0 ? 7 : 0)
    doc.roundedRect(totalsX - 5, currentY - 5, totalsWidth, totalsHeight, 2, 2, 'F')

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    doc.text('Subtotal:', totalsX, currentY)
    doc.text(invoice.currency + ' ' + formatPDFAmount(invoice.subtotal), totalsX + totalsWidth - 10, currentY, { align: 'right' })
    currentY += 5

    if (invoice.discount > 0) {
      doc.text('Discount:', totalsX, currentY)
      doc.text('-' + invoice.currency + ' ' + formatPDFAmount(invoice.discount), totalsX + totalsWidth - 10, currentY, { align: 'right' })
      currentY += 5
    }

    if (invoice.taxRate > 0) {
      doc.text('Tax (' + invoice.taxRate.toString() + '%):',totalsX, currentY)
      doc.text(invoice.currency + ' ' + formatPDFAmount(invoice.taxAmount), totalsX + totalsWidth - 10, currentY, { align: 'right' })
      currentY += 5
    }

    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setLineWidth(0.5)
    doc.line(totalsX, currentY, totalsX + totalsWidth - 10, currentY)
    currentY += 6

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('TOTAL:', totalsX, currentY)
    doc.text(invoice.currency + ' ' + formatPDFAmount(invoice.total), totalsX + totalsWidth - 10, currentY, { align: 'right' })

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Create email HTML - using inline styles for better email client compatibility
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">

    <!-- Header -->
    <div style="background: #2980b9; color: white; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Invoice ${invoice.invoiceNumber}</h1>
      ${settings.businessName && settings.businessName !== 'FreelanceManager' ? `<p style="margin: 5px 0 0 0;">${settings.businessName}</p>` : (settings.emailFromName ? `<p style="margin: 5px 0 0 0;">${settings.emailFromName}</p>` : '')}
    </div>

    <!-- Content -->
    <div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd;">
      <!-- Invoice Details -->
      <div style="background: white; padding: 15px; margin: 15px 0; border-radius: 5px;">
        <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
        <p style="margin: 5px 0;"><strong>Issue Date:</strong> ${formatDate(invoice.issueDate)}</p>
        <p style="margin: 5px 0;"><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
        ${invoice.project ? `<p style="margin: 5px 0;"><strong>Project:</strong> ${invoice.project.name}</p>` : ''}
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <thead>
          <tr>
            <th style="padding: 10px; text-align: left; background: #f4f4f4; border-bottom: 2px solid #ddd;">Description</th>
            <th style="padding: 10px; text-align: left; background: #f4f4f4; border-bottom: 2px solid #ddd;">Qty</th>
            <th style="padding: 10px; text-align: left; background: #f4f4f4; border-bottom: 2px solid #ddd;">Rate</th>
            <th style="padding: 10px; text-align: left; background: #f4f4f4; border-bottom: 2px solid #ddd;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.description}</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${formatCurrency(item.rate, invoice.currency)}</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${formatCurrency(item.amount, invoice.currency)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="text-align: right; padding: 10px 0;">
        <p style="margin: 5px 0;"><strong>Subtotal:</strong> ${formatCurrency(invoice.subtotal, invoice.currency)}</p>
        ${invoice.discount > 0 ? `<p style="margin: 5px 0;"><strong>Discount:</strong> -${formatCurrency(invoice.discount, invoice.currency)}</p>` : ''}
        ${invoice.taxRate > 0 ? `<p style="margin: 5px 0;"><strong>Tax (${invoice.taxRate}%):</strong> ${formatCurrency(invoice.taxAmount, invoice.currency)}</p>` : ''}
        <p style="margin: 10px 0; font-size: 18px; color: #2980b9;"><strong>Total:</strong> ${formatCurrency(invoice.total, invoice.currency)}</p>
      </div>

      <!-- Amount Due / Paid -->
      ${amountDue > 0 ? `
        <div style="background: #2980b9; color: white; padding: 15px; text-align: center; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;">Amount Due</p>
          <h2 style="margin: 5px 0; font-size: 32px;">${formatCurrency(amountDue, invoice.currency)}</h2>
        </div>
      ` : `
        <div style="background: #27ae60; color: white; padding: 15px; text-align: center; margin: 20px 0;">
          <h2 style="margin: 0; font-size: 28px;">✓ PAID</h2>
          <p style="margin: 5px 0;">Thank you for your payment!</p>
        </div>
      `}

      <!-- Payment Details -->
      ${settings.bankAccountHolder && settings.bankName ? `
        <h3 style="color: #2980b9; margin-top: 20px;">Payment Details</h3>
        <div style="background: white; padding: 15px; margin: 15px 0; border-radius: 5px;">
          <p style="margin: 5px 0;"><strong>Account Holder:</strong> ${settings.bankAccountHolder}</p>
          <p style="margin: 5px 0;"><strong>Bank Name:</strong> ${settings.bankName}</p>
          ${settings.bankAccountNumber ? `<p style="margin: 5px 0;"><strong>Account Number:</strong> ${settings.bankAccountNumber}</p>` : ''}
          ${settings.gstNumber ? `<p style="margin: 5px 0;"><strong>GST Number:</strong> ${settings.gstNumber}</p>` : ''}
          ${settings.panNumber ? `<p style="margin: 5px 0;"><strong>PAN Number:</strong> ${settings.panNumber}</p>` : ''}
        </div>
      ` : ''}

      <!-- Notes -->
      ${invoice.notes ? `
        <h3 style="color: #2980b9; margin-top: 20px;">Notes</h3>
        <div style="background: white; padding: 15px; border-radius: 5px;">
          ${invoice.notes.replace(/\n/g, '<br>')}
        </div>
      ` : ''}

      <!-- Payment Terms -->
      ${invoice.terms ? `
        <h3 style="color: #2980b9; margin-top: 20px;">Payment Terms</h3>
        <div style="background: white; padding: 15px; border-radius: 5px;">
          ${invoice.terms.replace(/\n/g, '<br>')}
        </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
      ${settings.businessEmail ? `<p>Email: ${settings.businessEmail}</p>` : ''}
      ${settings.businessPhone ? `<p>Phone: ${settings.businessPhone}</p>` : ''}
      <p style="margin-top: 10px;">Thank you for your business!</p>
    </div>

  </div>
</body>
</html>
    `

    // Send email with PDF attachment
    const info = await transporter.sendMail({
      from: `"${settings.emailFromName || settings.businessName}" <${settings.emailFromAddress || settings.emailUser}>`,
      to: invoice.client.email,
      subject: `Invoice ${invoice.invoiceNumber}`,
      html: emailHtml,
      attachments: [
        {
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    })

    console.log('Email sent:', info.messageId)

    return NextResponse.json({
      success: true,
      message: `Invoice sent to ${invoice.client.email}`
    })
  } catch (error) {
    console.error('Error sending invoice email:', error)
    return NextResponse.json(
      { error: 'Failed to send invoice email. Please check your email settings.' },
      { status: 500 }
    )
  }
}
