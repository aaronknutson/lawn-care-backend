# GreenScape Lawn Care - Backend API

RESTful API for the GreenScape Lawn Care management system built with Node.js, Express, and PostgreSQL.

## Tech Stack

- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Database:** PostgreSQL 15
- **ORM:** Sequelize
- **Authentication:** JWT + bcrypt
- **Payments:** Stripe
- **Email:** Nodemailer
- **Validation:** express-validator
- **Security:** Helmet, CORS, Rate Limiting
- **Logging:** Winston
- **Containerization:** Docker

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Configure your `.env` file with:
   - Database credentials
   - JWT secrets
   - Stripe API keys (test mode)
   - Email credentials
   - API keys (Google Maps, Weather)

4. Create PostgreSQL database:
```bash
createdb greenscape_lawn_care
```

5. Run migrations:
```bash
npm run migrate
```

6. Seed database with demo data:
```bash
npm run seed
```

7. Start development server:
```bash
npm run dev
```

The API will be running at `http://localhost:5000`

## API Endpoints

### Health Check
- `GET /api/health` - Check API status

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token

### Services (`/api/services`)
- `GET /api/services/packages` - Get service packages
- `GET /api/services/add-ons` - Get add-on services
- `POST /api/services/calculate-price` - Calculate quote

### Bookings (`/api/bookings`)
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Customers (`/api/customers`)
- `GET /api/customers` - Get all customers (admin)
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Archive customer

### Appointments (`/api/appointments`)
- `GET /api/appointments` - Get appointments with filters
- `POST /api/appointments` - Create appointment
- `PATCH /api/appointments/:id/complete` - Mark complete
- `POST /api/appointments/:id/photos` - Upload photos

### Payments (`/api/payments`)
- `POST /api/payments/create-intent` - Create Stripe payment
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/invoices` - Get payment history

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/revenue` - Revenue analytics

### Reviews (`/api/reviews`)
- `POST /api/reviews` - Submit review
- `GET /api/reviews` - Get reviews
- `PUT /api/reviews/:id/approve` - Approve review (admin)

### Quotes (`/api/quotes`)
- `POST /api/quotes` - Submit quote request
- `GET /api/quotes` - Get all quotes (admin)
- `PUT /api/quotes/:id/respond` - Respond to quote (admin)

### Referrals (`/api/referrals`)
- `GET /api/referrals/code` - Get referral code
- `POST /api/referrals/apply` - Apply referral code
- `GET /api/referrals/stats` - Get referral statistics

### Admin - Customer Management (`/api/admin/customers`)
- `GET /api/admin/customers` - Get all customers with filters
- `POST /api/admin/customers` - Create new customer
- `PUT /api/admin/customers/:id` - Update customer details
- `PUT /api/admin/customers/:id/archive` - Archive customer
- `GET /api/admin/customers/:id/profile` - Get detailed customer profile
- `POST /api/admin/customers/:id/notes` - Add communication note
- `GET /api/admin/customers/export/csv` - Export customers to CSV

### Admin - Service Management (`/api/admin/services`)
- `GET /api/admin/services/packages` - Get all service packages
- `POST /api/admin/services/packages` - Create service package
- `PUT /api/admin/services/packages/:id` - Update service package
- `DELETE /api/admin/services/packages/:id` - Delete service package
- `GET /api/admin/services/add-ons` - Get all add-on services
- `POST /api/admin/services/add-ons` - Create add-on service
- `PUT /api/admin/services/add-ons/:id` - Update add-on service
- `DELETE /api/admin/services/add-ons/:id` - Delete add-on service
- `GET /api/admin/services/crew` - Get all crew members
- `POST /api/admin/services/crew` - Create crew member
- `PUT /api/admin/services/crew/:id` - Update crew member
- `DELETE /api/admin/services/crew/:id` - Delete crew member

## Demo Credentials

- **Customer:** demo@customer.com / demo123
- **Admin:** admin@greenscape.com / admin123

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with demo data
- `npm run migrate:undo` - Rollback last migration

## Docker Deployment

### Using Docker Compose (Recommended)

The easiest way to run the entire stack (PostgreSQL + Backend + Frontend) is with Docker Compose from the project root:

```bash
cd /path/to/project/root
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 5000
- Frontend on port 80

### Backend Only with Docker

Build and run the backend container:

```bash
docker build -t greenscape-backend .
docker run -p 5000:5000 \
  -e DB_HOST=your_db_host \
  -e DB_USER=postgres \
  -e DB_PASSWORD=your_password \
  -e DB_NAME=greenscape_lawn_care \
  -e JWT_SECRET=your_jwt_secret \
  greenscape-backend
```

### Environment Variables for Docker

Required environment variables:
- `DB_HOST` - PostgreSQL host (use service name in docker-compose)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - Secret for JWT signing
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost)
- `WEATHER_API_KEY` - Optional weather API key

### Health Check

The backend includes a health check endpoint:
- `GET /api/health` - Returns server status and uptime

Docker health check runs every 30 seconds to ensure the service is responsive.

## Logging

The application uses Winston for production-ready logging:

- **Console logs:** Pretty-printed with colors in development
- **File logs:** JSON format in `logs/` directory
- **Log rotation:** Automatic daily rotation with 14-day retention
- **HTTP logging:** Request/response logging via Morgan

Log files:
- `logs/combined.log` - All logs (info, warn, error)
- `logs/error.log` - Error logs only

## Project Structure

```
src/
├── config/
│   ├── database.js      # Sequelize configuration
│   └── logger.js        # Winston logger configuration
├── controllers/
│   ├── auth.controller.js
│   ├── booking.controller.js
│   ├── payment.controller.js
│   ├── quote.controller.js
│   ├── admin.customer.controller.js
│   ├── admin.service.controller.js
│   └── ...
├── middleware/
│   ├── auth.middleware.js     # JWT authentication
│   ├── admin.middleware.js    # Admin role verification
│   ├── validate.middleware.js
│   └── ...
├── models/          # Sequelize models (User, Appointment, Payment, etc.)
├── routes/          # API routes organized by domain
├── services/        # Business logic layer
├── utils/           # Helper functions
├── scripts/         # Database migration and seed scripts
├── logs/            # Winston log files (gitignored)
└── server.js        # Express app entry point
```

## Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation and sanitization
- SQL injection prevention (parameterized queries)

## License

MIT
# lawn-care-backend
