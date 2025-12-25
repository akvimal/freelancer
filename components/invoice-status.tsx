"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface InvoiceStatusProps {
  invoiceId: string
  currentStatus: string
  dueDate: Date
  isPaid: boolean
}

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-800 text-white'
}

const STATUS_LABELS = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled'
}

export function InvoiceStatus({ invoiceId, currentStatus, dueDate, isPaid }: InvoiceStatusProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // Auto-detect overdue status
  useEffect(() => {
    const checkOverdue = async () => {
      // Only check if status is 'sent' and not paid
      if (currentStatus !== 'sent' || isPaid) return

      // Check if past due date
      const today = new Date()
      const due = new Date(dueDate)
      due.setHours(0, 0, 0, 0)
      today.setHours(0, 0, 0, 0)

      if (due < today) {
        // Silently update to overdue
        try {
          await fetch(`/api/invoices/${invoiceId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'overdue' })
          })
          router.refresh()
        } catch (error) {
          console.error('Failed to auto-update to overdue:', error)
        }
      }
    }

    checkOverdue()
  }, [currentStatus, dueDate, isPaid, invoiceId, router])

  // Get available status transitions
  const getAvailableStatuses = () => {
    // If paid, show paid status and only allow cancel
    const effectiveStatus = isPaid ? 'paid' : currentStatus

    switch (effectiveStatus) {
      case 'draft':
        return [
          { value: 'sent', label: 'Mark as Sent' },
          { value: 'cancelled', label: 'Cancel Invoice' }
        ]
      case 'sent':
        return [
          { value: 'overdue', label: 'Mark as Overdue' },
          { value: 'cancelled', label: 'Cancel Invoice' }
        ]
      case 'overdue':
        return [
          { value: 'cancelled', label: 'Cancel Invoice' }
        ]
      case 'paid':
        return [
          { value: 'cancelled', label: 'Cancel Invoice' }
        ]
      case 'cancelled':
        return []
      default:
        return []
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    // Confirm cancellation
    if (newStatus === 'cancelled') {
      const confirmed = confirm('Are you sure you want to cancel this invoice? This action cannot be undone.')
      if (!confirmed) return
    }

    setIsUpdating(true)
    setShowDropdown(false)

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to update status')
        setIsUpdating(false)
        return
      }

      // Refresh page to show updated status
      router.refresh()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update invoice status. Please try again.')
      setIsUpdating(false)
    }
  }

  const effectiveStatus = isPaid ? 'paid' : currentStatus
  const availableStatuses = getAvailableStatuses()
  const canChangeStatus = availableStatuses.length > 0 && !isUpdating

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-600">Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <button
            onClick={() => canChangeStatus && setShowDropdown(!showDropdown)}
            disabled={!canChangeStatus}
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              STATUS_COLORS[effectiveStatus as keyof typeof STATUS_COLORS]
            } ${canChangeStatus ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
          >
            {STATUS_LABELS[effectiveStatus as keyof typeof STATUS_LABELS] || effectiveStatus}
            {canChangeStatus && (
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>

          {showDropdown && canChangeStatus && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute top-full left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                <div className="py-1">
                  {availableStatuses.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => handleStatusChange(status.value)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
