import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import { FileText, DollarSign, Users, Clock } from "lucide-react"

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const [invoices, clients] = await Promise.all([
    prisma.invoice.findMany({
      include: {
        client: { select: { name: true, company: true } },
        payments: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.client.findMany()
  ])

  const stats = {
    totalInvoices: await prisma.invoice.count(),
    totalRevenue: invoices.reduce((sum, inv) => {
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0)
      return sum + paid
    }, 0),
    pendingAmount: invoices
      .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => {
        const paid = inv.payments.reduce((s, p) => s + p.amount, 0)
        return sum + (inv.total - paid)
      }, 0),
    totalClients: clients.length
  }

  return { invoices, stats }
}

export default async function Dashboard() {
  const { invoices, stats } = await getDashboardData()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Overview of your freelance business
          </p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalInvoices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.pendingAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalClients}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900">Recent Invoices</CardTitle>
            <Link href="/invoices">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 mb-4 text-gray-400" />
              <p className="text-gray-600 mb-2">No invoices yet</p>
              <Link href="/invoices/new">
                <Button className="mt-4" size="sm">Create your first invoice</Button>
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
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
                    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
                    const isPaid = totalPaid >= invoice.total

                    return (
                      <tr key={invoice.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {invoice.invoiceNumber}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          {invoice.client.company || invoice.client.name}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatDate(invoice.issueDate)}
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
