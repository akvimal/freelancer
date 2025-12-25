import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"
import { InvoiceActions } from "@/components/invoice-actions"
import { PaymentForm } from "@/components/payment-form"
import { InvoiceStatus } from "@/components/invoice-status"

async function getInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      project: true,
      items: true,
      payments: {
        orderBy: { paymentDate: 'desc' }
      }
    }
  })

  if (!invoice) {
    notFound()
  }

  return invoice
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await getInvoice(id)

  const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0)
  const amountDue = invoice.total - totalPaid

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Link href="/invoices">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoice {invoice.invoiceNumber}</h1>
            <p className="text-gray-500 mt-1">
              Issued on {formatDate(invoice.issueDate)}
            </p>
          </div>
          <InvoiceActions
            invoiceId={invoice.id}
            hasPayments={invoice.payments.length > 0}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <InvoiceStatus
          invoiceId={invoice.id}
          currentStatus={invoice.status}
          dueDate={invoice.dueDate}
          isPaid={totalPaid >= invoice.total}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(invoice.total, invoice.currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Amount Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(amountDue, invoice.currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bill To</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="font-semibold">{invoice.client.name}</div>
              {invoice.client.company && (
                <div className="text-sm text-gray-600">{invoice.client.company}</div>
              )}
              <div className="text-sm text-gray-600">{invoice.client.email}</div>
              {invoice.client.phone && (
                <div className="text-sm text-gray-600">{invoice.client.phone}</div>
              )}
              {invoice.client.address && (
                <div className="text-sm text-gray-600 mt-2">
                  <div>{invoice.client.address}</div>
                  <div>
                    {[invoice.client.city, invoice.client.state, invoice.client.zipCode]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                  {invoice.client.country && <div>{invoice.client.country}</div>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Invoice Number:</span>
              <span className="font-medium">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Issue Date:</span>
              <span className="font-medium">{formatDate(invoice.issueDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Due Date:</span>
              <span className="font-medium">{formatDate(invoice.dueDate)}</span>
            </div>
            {invoice.project && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Project:</span>
                <Link
                  href={`/projects/${invoice.project.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {invoice.project.name}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                    Description
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">
                    Quantity
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">
                    Rate
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3 px-4">{item.description}</td>
                    <td className="py-3 px-4 text-right">{item.quantity}</td>
                    <td className="py-3 px-4 text-right">
                      {formatCurrency(item.rate, invoice.currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatCurrency(item.amount, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-2 max-w-xs ml-auto">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">
                {formatCurrency(invoice.subtotal, invoice.currency)}
              </span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium">
                  -{formatCurrency(invoice.discount, invoice.currency)}
                </span>
              </div>
            )}
            {invoice.taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax ({invoice.taxRate}%):</span>
                <span className="font-medium">
                  {formatCurrency(invoice.taxAmount, invoice.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span>{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <PaymentForm
        invoiceId={invoice.id}
        invoiceTotal={invoice.total}
        totalPaid={totalPaid}
        currency={invoice.currency}
      />

      {invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoice.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex justify-between items-center p-3 rounded-lg border"
                >
                  <div>
                    <div className="font-medium">
                      {formatCurrency(payment.amount, invoice.currency)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {payment.paymentMethod} - {formatDate(payment.paymentDate)}
                    </div>
                    {payment.notes && (
                      <div className="text-sm text-gray-500 mt-1">{payment.notes}</div>
                    )}
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t">
                <div className="flex justify-between font-semibold">
                  <span>Total Paid:</span>
                  <span className="text-green-600">
                    {formatCurrency(totalPaid, invoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold mt-2">
                  <span>Amount Due:</span>
                  <span className={amountDue > 0 ? 'text-red-600' : 'text-green-600'}>
                    {formatCurrency(amountDue, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(invoice.notes || invoice.terms) && (
        <div className="grid gap-6 md:grid-cols-2">
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}

          {invoice.terms && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{invoice.terms}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
