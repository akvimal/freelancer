# FreelanceManager

A comprehensive freelance management application built with Next.js, designed to help freelancers manage their clients, projects, and invoices efficiently.

## Features

### Invoicing Module (Priority)
- Create and manage invoices with line items
- Automatic invoice numbering
- Tax and discount calculations
- Multiple currency support (USD, EUR, GBP)
- Invoice status tracking (draft, sent, paid, overdue, cancelled)
- Payment tracking with partial payment support
- View invoice history and details

### Client Management
- Add and manage client information
- Client status tracking (lead, active, inactive)
- Store contact details, company information, and billing addresses
- Track client payment terms
- View client invoices and projects

### Dashboard
- Overview of business metrics
- Total invoices and revenue statistics
- Pending amount tracking
- Client count
- Recent invoices list

## Tech Stack

- **Frontend**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL 17 with Prisma ORM
- **Infrastructure**: AgentPro Dev Environment (PostgreSQL, Redis, N8N, RabbitMQ)
- **UI Components**: Custom components with Tailwind
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Docker Desktop (for dev infrastructure)

### Quick Start - One Command Deployment

```bash
npm run deploy:dev
```

This will automatically:
- Start the dev infrastructure (PostgreSQL, Redis, N8N, RabbitMQ)
- Create the database
- Run migrations
- Start the application

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Alternative - Manual Steps

If you prefer manual control:

```bash
# 1. Start infrastructure
npm run infra:start

# 2. Run the application
npm run dev
```

### Full Deployment Documentation

See [DEPLOY.md](docs/DEPLOY.md) for comprehensive deployment guide including:
- Available npm commands
- Database management
- Infrastructure management
- Troubleshooting
- Production deployment

## Database Schema

The application uses the following main models:

- **Client**: Store client information and contact details
- **Project**: Manage projects linked to clients
- **Invoice**: Create and track invoices
- **InvoiceItem**: Line items for invoices
- **Payment**: Track payments against invoices
- **TimeEntry**: Track billable hours (for future features)
- **Expense**: Track project expenses (for future features)

## Project Structure

```
freelance-manager/
├── app/
│   ├── api/              # API routes
│   │   ├── clients/      # Client CRUD operations
│   │   ├── invoices/     # Invoice CRUD operations
│   │   └── payments/     # Payment operations
│   ├── clients/          # Client management pages
│   ├── invoices/         # Invoice management pages
│   ├── page.tsx          # Dashboard
│   └── layout.tsx        # Root layout
├── components/
│   ├── ui/               # Reusable UI components
│   └── navigation.tsx    # Navigation component
├── lib/
│   ├── prisma.ts         # Prisma client singleton
│   └── utils.ts          # Utility functions
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
└── public/               # Static files
```

## Usage

### Adding a Client

1. Navigate to the Clients page
2. Click "New Client"
3. Fill in the client information
4. Click "Create Client"

### Creating an Invoice

1. Navigate to the Invoices page
2. Click "New Invoice"
3. Select a client from the dropdown
4. Add line items with descriptions, quantities, and rates
5. Set tax rate and discount if applicable
6. Add notes and payment terms
7. Click "Create Invoice"

### Managing Invoices

- View all invoices in the Invoices page
- Click on an invoice to view details
- Track payment status
- See pending amounts on the dashboard

## Future Enhancements

The following features are planned for future releases:

- PDF invoice generation and download
- Email invoice delivery
- Project management features
- Time tracking integration
- Expense tracking
- Recurring invoices
- Payment gateway integration (Stripe, PayPal)
- Advanced reporting and analytics
- Multi-user authentication
- Invoice templates customization
- Client portal

## Database Management

### View Database

```bash
npx prisma studio
```

This opens a visual database editor at http://localhost:5555

### Run Migrations

If you make changes to the schema:

```bash
npx prisma migrate dev
npx prisma generate
```

## Build for Production

```bash
npm run build
npm start
```
