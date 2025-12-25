import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { Users, Plus, Mail, Building2 } from "lucide-react"

export const dynamic = 'force-dynamic'

async function getClients() {
  return await prisma.client.findMany({
    include: {
      _count: {
        select: {
          projects: true,
          invoices: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export default async function ClientsPage() {
  const clients = await getClients()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-gray-500 mt-1">Manage your client relationships</p>
        </div>
        <Link href="/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="mx-auto h-16 w-16 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No clients yet</h3>
              <p className="mb-4">Add your first client to get started</p>
              <Link href="/clients/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clients.map((client) => (
                <Link key={client.id} href={`/clients/${client.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {client.name}
                          </h3>
                          {client.company && (
                            <div className="flex items-center text-sm text-gray-600 mb-1">
                              <Building2 className="h-3 w-3 mr-1" />
                              {client.company}
                            </div>
                          )}
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            {client.email}
                          </div>
                        </div>
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
                      <div className="flex gap-4 text-sm text-gray-600 pt-4 border-t">
                        <div>
                          <span className="font-medium">{client._count.projects}</span> Projects
                        </div>
                        <div>
                          <span className="font-medium">{client._count.invoices}</span> Invoices
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
