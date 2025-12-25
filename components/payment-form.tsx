"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface PaymentFormProps {
  invoiceId: string
  invoiceTotal: number
  totalPaid: number
  currency: string
}

const PAYMENT_METHODS = [
  "Bank Transfer",
  "Credit Card",
  "PayPal",
  "Check",
  "Cash",
  "Other"
]

export function PaymentForm({ invoiceId, invoiceTotal, totalPaid, currency }: PaymentFormProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const amountDue = invoiceTotal - totalPaid

  const [formData, setFormData] = useState({
    amount: amountDue > 0 ? amountDue.toString() : "",
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: "",
    notes: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amount = parseFloat(formData.amount)

    // Validation
    if (isNaN(amount) || amount <= 0) {
      alert("Payment amount must be greater than 0")
      return
    }

    if (!formData.paymentMethod) {
      alert("Please select a payment method")
      return
    }

    // Warning if overpayment
    if (amount > amountDue && amountDue > 0) {
      const confirmed = confirm(
        `This payment of ${formatCurrency(amount, currency)} exceeds the remaining balance of ${formatCurrency(amountDue, currency)}. Continue?`
      )
      if (!confirmed) return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          amount,
          paymentDate: formData.paymentDate,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes || null
        })
      })

      if (!response.ok) {
        throw new Error("Failed to record payment")
      }

      // Success: reset form and collapse
      setShowForm(false)
      setFormData({
        amount: "",
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: "",
        notes: ""
      })

      // Refresh page to show new payment
      router.refresh()
    } catch (error) {
      console.error('Error recording payment:', error)
      alert("Failed to record payment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setFormData({
      amount: amountDue > 0 ? amountDue.toString() : "",
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: "",
      notes: ""
    })
  }

  if (!showForm) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Record Payment</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(true)}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            <span className="font-medium">Amount Due: </span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(amountDue, currency)}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Input
                label="Payment Amount"
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Input
                label="Payment Date"
                type="date"
                required
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method *
            </label>
            <select
              required
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select payment method</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={isSubmitting}
              placeholder="Add payment notes (optional)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
