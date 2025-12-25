import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowLeft, FileText, Pencil, Trash2 } from "lucide-react"
import { DeleteProjectButton } from "@/components/delete-project-button"

async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      invoices: {
        include: {
          payments: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!project) {
    notFound()
  }

  return project
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await getProject(id)

  const totalInvoiced = project.invoices.reduce((sum, inv) => sum + inv.total, 0)
  const totalPaid = project.invoices.reduce((sum, inv) => {
    const payments = inv.payments || []
    return sum + payments.reduce((psum, p) => psum + p.amount, 0)
  }, 0)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-gray-500 mt-1">
              Client: <Link href={`/clients/${project.client.id}`} className="text-blue-600 hover:underline">
                {project.client.name}
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                project.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : project.status === 'active'
                  ? 'bg-blue-100 text-blue-800'
                  : project.status === 'on-hold'
                  ? 'bg-yellow-100 text-yellow-800'
                  : project.status === 'proposal'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {project.status}
            </span>
            <DeleteProjectButton projectId={project.id} projectName={project.name} />
          </div>
        </div>
      </div>

      {project.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-4">
        {project.budget && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(project.budget, project.currency)}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalInvoiced, project.currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid, project.currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalInvoiced - totalPaid, project.currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {project.startDate && (
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium">{formatDate(project.startDate)}</span>
              </div>
              {project.endDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">End Date:</span>
                  <span className="font-medium">{formatDate(project.endDate)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="font-semibold">{project.client.name}</div>
            {project.client.company && (
              <div className="text-sm text-gray-600">{project.client.company}</div>
            )}
            <div className="text-sm text-gray-600">{project.client.email}</div>
            {project.client.phone && (
              <div className="text-sm text-gray-600">{project.client.phone}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Invoices</CardTitle>
            <Link href={`/invoices/new?projectId=${project.id}`}>
              <Button size="sm">
                <FileText className="mr-2 h-4 w-4" />
                New Invoice
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {project.invoices.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No invoices for this project yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                      Invoice Number
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                      Issue Date
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">
                      Amount
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {project.invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b">
                      <td className="py-3 px-4">{invoice.invoiceNumber}</td>
                      <td className="py-3 px-4">{formatDate(invoice.issueDate)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : invoice.status === 'overdue'
                              ? 'bg-red-100 text-red-800'
                              : invoice.status === 'sent'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/invoices/${invoice.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
