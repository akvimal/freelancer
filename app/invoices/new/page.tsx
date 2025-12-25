"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"
import { getCurrencySymbol } from "@/lib/utils"

interface Client {
  id: string
  name: string
  company: string | null
  email: string
}

interface Project {
  id: string
  name: string
  currency: string
}

interface InvoiceItem {
  description: string
  quantity: number
  rate: number
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [formData, setFormData] = useState({
    clientId: "",
    projectId: "",
    dueDate: "",
    taxRate: 0,
    discount: 0,
    currency: "USD",
    notes: "",
    terms: ""
  })
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, rate: 0 }
  ])

  useEffect(() => {
    fetch("/api/clients")
      .then(res => res.json())
      .then(data => setClients(data))
      .catch(err => console.error("Error loading clients:", err))
  }, [])

  useEffect(() => {
    if (formData.clientId) {
      fetch(`/api/projects?clientId=${formData.clientId}`)
        .then(res => res.json())
        .then(data => setProjects(data))
        .catch(err => console.error("Error loading projects:", err))
    } else {
      setProjects([])
      setFormData(prev => ({ ...prev, projectId: "" }))
    }
  }, [formData.clientId])

  const handleProjectChange = (projectId: string) => {
    setFormData(prev => ({ ...prev, projectId }))

    if (projectId) {
      const selectedProject = projects.find(p => p.id === projectId)
      if (selectedProject) {
        setFormData(prev => ({ ...prev, currency: selectedProject.currency }))
      }
    }
  }

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, rate: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
  }

  const calculateTax = () => {
    const subtotal = calculateSubtotal()
    return (subtotal - formData.discount) * (formData.taxRate / 100)
  }

  const calculateTotal = () => {
    return calculateSubtotal() - formData.discount + calculateTax()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items,
          status: "draft"
        })
      })

      if (response.ok) {
        const invoice = await response.json()
        router.push(`/invoices/${invoice.id}`)
      } else {
        alert("Failed to create invoice")
      }
    } catch (error) {
      console.error("Error creating invoice:", error)
      alert("Failed to create invoice")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
        <p className="text-gray-500 mt-1">Fill in the details to create a new invoice</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Client *</label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.company || client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Project</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.clientId}
                >
                  <option value="">None (optional)</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Input
                  label="Due Date *"
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div>
                <Input
                  label="Tax Rate (%)"
                  type="number"
                  step="0.01"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Input
                  label="Discount"
                  type="number"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="INR">INR - Indian Rupee</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                placeholder="Additional notes for the client"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Payment Terms</label>
              <textarea
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                placeholder="Payment terms and conditions"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-1">
                    <Input
                      label="Description"
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      placeholder="Item description"
                      required
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      label="Quantity"
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      label="Rate"
                      type="number"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateItem(index, "rate", parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="w-32 pt-7">
                    <div className="text-sm font-medium text-gray-700">
                      {getCurrencySymbol(formData.currency)}{(item.quantity * item.rate).toFixed(2)}
                    </div>
                  </div>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="mt-7"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 border-t pt-4 space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{getCurrencySymbol(formData.currency)}{calculateSubtotal().toFixed(2)}</span>
              </div>
              {formData.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium">-{getCurrencySymbol(formData.currency)}{formData.discount.toFixed(2)}</span>
                </div>
              )}
              {formData.taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({formData.taxRate}%):</span>
                  <span className="font-medium">{getCurrencySymbol(formData.currency)}{calculateTax().toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span>{getCurrencySymbol(formData.currency)}{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </form>
    </div>
  )
}
