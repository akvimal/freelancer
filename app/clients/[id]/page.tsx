import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Mail, Phone, Building2, MapPin, FileText, FolderKanban, ArrowLeft } from "lucide-react"

async function getClient(id: string) {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      projects: {
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      invoices: {
        orderBy: { createdAt: 'desc' },
        include: {
          payments: true
        },
        take: 10
      }
    }
  })

  if (!client) {
    notFound()
  }

  return client
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await getClient(id)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/clients">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
            {client.company && (
              <p className="text-gray-500 mt-1 flex items-center">
                <Building2 className="h-4 w-4 mr-1" />
                {client.company}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Link href={`/clients/${client.id}/edit`}>
              <Button variant="outline">Edit Client</Button>
            </Link>
            <Link href={`/invoices/new?clientId=${client.id}`}>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                New Invoice
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                  {client.phone}
                </a>
              </div>
            )}
            {(client.address || client.city || client.state) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <div className="text-sm">
                  {client.address && <div>{client.address}</div>}
                  <div>
                    {[client.city, client.state, client.zipCode].filter(Boolean).join(', ')}
                  </div>
                  {client.country && <div>{client.country}</div>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  client.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : client.status === 'lead'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {client.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Terms:</span>
              <span className="font-medium">{client.paymentTerms} days</span>
            </div>
            {client.taxId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax ID:</span>
                <span className="font-medium">{client.taxId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Client Since:</span>
              <span className="font-medium">{formatDate(client.createdAt)}</span>
            </div>
          </CardContent>
        </Card>

        {client.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{client.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <FolderKanban className="h-5 w-5 mr-2" />
                Projects
              </CardTitle>
              <Link href={`/projects/new?clientId=${client.id}`}>
                <Button variant="ghost" size="sm">New Project</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {client.projects.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No projects yet</p>
            ) : (
              <div className="space-y-3">
                {client.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-gray-600">{project.status}</div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Recent Invoices
              </CardTitle>
              <Link href="/invoices">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {client.invoices.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No invoices yet</p>
            ) : (
              <div className="space-y-3">
                {client.invoices.map((invoice) => {
                  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
                  const isPaid = totalPaid >= invoice.total

                  return (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{invoice.invoiceNumber}</div>
                          <div className="text-sm text-gray-600">
                            {formatDate(invoice.issueDate)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(invoice.total, invoice.currency)}
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              isPaid || invoice.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : invoice.status === 'overdue'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {isPaid ? 'Paid' : invoice.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
