import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getCurrencySymbol } from '@/lib/utils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Create PDF
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Colors
    const primaryColor: [number, number, number] = [41, 128, 185] // Blue
    const darkGray: [number, number, number] = [51, 51, 51]
    const lightGray: [number, number, number] = [128, 128, 128]
    const bgGray: [number, number, number] = [245, 245, 245]

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

    // GST/PAN Numbers
    if (settings?.gstNumber || settings?.panNumber) {
      doc.setFontSize(8)
      let taxY = 28
      if (settings.gstNumber) {
        doc.text('GST: ' + settings.gstNumber, 20, taxY)
        taxY += 3
      }
      if (settings.panNumber) {
        doc.text('PAN: ' + settings.panNumber, 20, taxY)
      }
    }

    // Status Badge - Removed for professional client-facing invoices
    // Internal status tracking is handled in the web interface
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
    const isPaid = totalPaid >= invoice.total

    // Invoice Details Section
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    let yPos = 45

    // Two column layout for invoice details
    // Left column
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

    if (invoice.client.phone) {
      yPos += 5
      doc.text(invoice.client.phone, pageWidth - 75, yPos)
    }

    if (invoice.client.address) {
      yPos += 5
      const addressLines = doc.splitTextToSize(invoice.client.address, 65)
      doc.text(addressLines, pageWidth - 75, yPos)
      yPos += 5 * addressLines.length

      const cityStateZip = [invoice.client.city, invoice.client.state, invoice.client.zipCode]
        .filter(Boolean)
        .join(', ')
      if (cityStateZip) {
        doc.text(cityStateZip, pageWidth - 75, yPos)
      }
    }

    // Line Items Table
    // Format amounts for PDF display - avoid currency symbols that jsPDF can't encode
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
        textColor: darkGray,
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 },
      tableWidth: 'auto'
    })

    // Get the final Y position after the table
    const finalY = (doc as any).lastAutoTable.finalY + 10

    // Totals Section with box
    const totalsX = pageWidth - 75
    const totalsWidth = 70
    let currentY = finalY

    // Draw totals box
    doc.setFillColor(bgGray[0], bgGray[1], bgGray[2])
    const totalsHeight = 30 + (invoice.discount > 0 ? 7 : 0) + (invoice.taxRate > 0 ? 7 : 0)
    doc.roundedRect(totalsX - 5, currentY - 5, totalsWidth, totalsHeight, 2, 2, 'F')

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    // Subtotal
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

    // Line separator
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setLineWidth(0.5)
    doc.line(totalsX, currentY, totalsX + totalsWidth - 10, currentY)
    currentY += 6

    // Total
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('TOTAL:', totalsX, currentY)
    doc.text(invoice.currency + ' ' + formatPDFAmount(invoice.total), totalsX + totalsWidth - 10, currentY, { align: 'right' })

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])

    // Payment History
    if (invoice.payments.length > 0) {
      currentY += 25

      // Section header
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.text('Payment History', 20, currentY)

      // Header line
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.setLineWidth(0.5)
      doc.line(20, currentY + 2, 190, currentY + 2)

      const paymentData = invoice.payments.map(payment => [
        new Date(payment.paymentDate).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
        }),
        payment.paymentMethod,
        invoice.currency + ' ' + formatPDFAmount(payment.amount),
        payment.notes || '-'
      ])

      autoTable(doc, {
        startY: currentY + 7,
        head: [['Payment Date', 'Method', 'Amount', 'Notes']],
        body: paymentData,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
          cellPadding: 4
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 4,
          textColor: darkGray
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 30 },
          2: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
          3: { cellWidth: 'auto' }
        },
        margin: { left: 20, right: 20 }
      })

      const paymentFinalY = (doc as any).lastAutoTable.finalY + 10

      // Payment summary box
      const paymentSummaryX = pageWidth - 75
      doc.setFillColor(bgGray[0], bgGray[1], bgGray[2])
      doc.roundedRect(paymentSummaryX - 5, paymentFinalY - 5, 65, 20, 2, 2, 'F')

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
      doc.text('Total Paid:', paymentSummaryX, paymentFinalY)
      doc.setTextColor(39, 174, 96)
      doc.text(invoice.currency + ' ' + formatPDFAmount(totalPaid), paymentSummaryX + 55, paymentFinalY, { align: 'right' })

      const amountDue = invoice.total - totalPaid
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
      doc.text('Amount Due:', paymentSummaryX, paymentFinalY + 7)
      doc.setTextColor(amountDue > 0 ? 231 : 39, amountDue > 0 ? 76 : 174, amountDue > 0 ? 60 : 96)
      doc.text(invoice.currency + ' ' + formatPDFAmount(amountDue), paymentSummaryX + 55, paymentFinalY + 7, { align: 'right' })

      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
      currentY = paymentFinalY + 20
    }

    // Bank Details Section
    currentY = invoice.payments.length > 0 ? currentY + 15 : finalY + totalsHeight + 15

    // Check if we need a new page
    if (currentY > pageHeight - 80) {
      doc.addPage()
      currentY = 30
    }

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('Bank Details for Payment', 20, currentY)

    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setLineWidth(0.5)
    doc.line(20, currentY + 2, 95, currentY + 2)

    currentY += 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])

    // Bank details box - make it taller to fit GST/PAN
    const bankBoxHeight = 28 + (settings?.gstNumber ? 5 : 0) + (settings?.panNumber ? 5 : 0)
    doc.setFillColor(bgGray[0], bgGray[1], bgGray[2])
    doc.roundedRect(20, currentY - 2, 85, bankBoxHeight, 2, 2, 'F')

    let bankY = currentY + 3
    doc.setFont('helvetica', 'bold')
    doc.text('Account Holder:', 23, bankY)
    doc.setFont('helvetica', 'normal')
    doc.text(settings?.bankAccountHolder || 'Not Set', 23, bankY + 3)

    bankY += 8
    doc.setFont('helvetica', 'bold')
    doc.text('Bank Name:', 23, bankY)
    doc.setFont('helvetica', 'normal')
    doc.text(settings?.bankName || 'Not Set', 23, bankY + 3)

    bankY += 8
    doc.setFont('helvetica', 'bold')
    doc.text('Account Number:', 23, bankY)
    doc.setFont('helvetica', 'normal')
    doc.text(settings?.bankAccountNumber || 'XXXX-XXXX-XXXX', 23, bankY + 3)

    // Add GST Number if available
    if (settings?.gstNumber) {
      bankY += 8
      doc.setFont('helvetica', 'bold')
      doc.text('GST Number:', 23, bankY)
      doc.setFont('helvetica', 'normal')
      doc.text(settings.gstNumber, 23, bankY + 3)
    }

    // Add PAN Number if available
    if (settings?.panNumber) {
      bankY += 8
      doc.setFont('helvetica', 'bold')
      doc.text('PAN Number:', 23, bankY)
      doc.setFont('helvetica', 'normal')
      doc.text(settings.panNumber, 23, bankY + 3)
    }

    currentY += 10

    // Notes and Terms
    if (invoice.notes || invoice.terms) {
      // Check if we need a new page
      if (currentY > pageHeight - 60) {
        doc.addPage()
        currentY = 30
      }

      if (invoice.notes) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.text('Notes', 20, currentY)

        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.setLineWidth(0.5)
        doc.line(20, currentY + 2, 190, currentY + 2)

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        const splitNotes = doc.splitTextToSize(invoice.notes, 170)
        doc.text(splitNotes, 20, currentY + 8)

        currentY += 8 + (splitNotes.length * 5) + 10
      }

      if (invoice.terms) {
        // Check if we need a new page
        if (currentY > pageHeight - 40) {
          doc.addPage()
          currentY = 30
        }

        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.text('Payment Terms', 20, currentY)

        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.setLineWidth(0.5)
        doc.line(20, currentY + 2, 190, currentY + 2)

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        const splitTerms = doc.splitTextToSize(invoice.terms, 170)
        doc.text(splitTerms, 20, currentY + 8)
      }
    }

    // Footer
    const footerY = pageHeight - 20
    doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2])
    doc.setLineWidth(0.3)
    doc.line(20, footerY, pageWidth - 20, footerY)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2])
    doc.text('Thank you for your business!', pageWidth / 2, footerY + 6, { align: 'center' })
    doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, footerY + 10, { align: 'center' })

    // Generate PDF as buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
