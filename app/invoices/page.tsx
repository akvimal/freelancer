import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import { FileText, Plus } from "lucide-react"

async function getInvoices() {
  return await prisma.invoice.findMany({
    include: {
      client: {
        select: {
          name: true,
          company: true
        }
      },
      payments: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

export default async function InvoicesPage() {
  const invoices = await getInvoices()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-gray-500 mt-1">Manage all your invoices</p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="mx-auto h-16 w-16 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
              <p className="mb-4">Get started by creating your first invoice</p>
              <Link href="/invoices/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                      Invoice #
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                      Client
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                      Issue Date
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                      Due Date
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
                    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
                    const isPaid = totalPaid >= invoice.total

                    return (
                      <tr key={invoice.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="py-3 px-4">
                          {invoice.client.company || invoice.client.name}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatDate(invoice.issueDate)}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isPaid || invoice.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : invoice.status === 'overdue'
                                ? 'bg-red-100 text-red-800'
                                : invoice.status === 'sent'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {isPaid ? 'Paid' : invoice.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
