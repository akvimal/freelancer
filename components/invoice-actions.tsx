"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Download, Send, Printer, Trash2 } from "lucide-react"

interface InvoiceActionsProps {
  invoiceId: string
  hasPayments: boolean
}

export function InvoiceActions({ invoiceId, hasPayments }: InvoiceActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const handleDownloadPDF = () => {
    window.open(`/api/invoices/${invoiceId}/pdf`, '_blank')
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSendToClient = async () => {
    const confirmed = confirm(
      "Send this invoice to the client's email address?"
    )

    if (!confirmed) {
      return
    }

    setIsSending(true)

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "Failed to send invoice email. Please check your email settings in Settings.")
        setIsSending(false)
        return
      }

      const data = await response.json()
      alert(data.message || "Invoice sent successfully!")
      router.refresh()
    } catch (error) {
      console.error('Error sending invoice:', error)
      alert("Failed to send invoice. Please check your email settings.")
    } finally {
      setIsSending(false)
    }
  }

  const handleDelete = async () => {
    if (hasPayments) {
      alert("Cannot delete invoices with payments. Please remove payments first.")
      return
    }

    const confirmed = confirm(
      "Are you sure you want to delete this invoice? This action cannot be undone."
    )

    if (!confirmed) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        if (response.status === 404) {
          alert("Invoice not found. It may have already been deleted.")
        } else if (response.status === 400) {
          alert(error.error || "Cannot delete invoices with payments. Please remove payments first.")
        } else {
          alert("Failed to delete invoice. Please try again later.")
        }
        setIsDeleting(false)
        return
      }

      // Redirect to invoices list on success
      router.push('/invoices')
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert("Failed to delete invoice. Please check your connection.")
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="mr-2 h-4 w-4" />
        Print
      </Button>
      <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
        <Download className="mr-2 h-4 w-4" />
        Download PDF
      </Button>
      <Button size="sm" onClick={handleSendToClient} disabled={isSending}>
        <Send className="mr-2 h-4 w-4" />
        {isSending ? "Sending..." : "Send to Client"}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={isDeleting || hasPayments}
        title={hasPayments ? "Cannot delete invoices with payments" : ""}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
    </div>
  )
}
