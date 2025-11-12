# PostgreSQL Database Setup

## Installation

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### macOS (using Homebrew):
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Windows:
Download and install from: https://www.postgresql.org/download/windows/

## Database Creation

1. **Access PostgreSQL**:
```bash
sudo -u postgres psql
```

2. **Create Database**:
```sql
CREATE DATABASE greenscape_lawn_care;
```

3. **Create User** (optional, for production):
```sql
CREATE USER greenscape_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE greenscape_lawn_care TO greenscape_admin;
```

4. **Exit PostgreSQL**:
```sql
\q
```

## Update .env File

Update your `.env` file with the database connection string:

**For local development (using postgres user):**
```
DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5432/greenscape_lawn_care
```

**For custom user:**
```
DATABASE_URL=postgresql://greenscape_admin:your_secure_password@localhost:5432/greenscape_lawn_care
```

## Run Migrations and Seeds

Once the database is configured:

```bash
# Run migrations to create tables
npm run migrate

# Seed database with demo users
npm run seed
```

## Demo Users Created

After seeding, you'll have:
- **Customer**: demo@customer.com / demo123
- **Admin**: admin@greenscape.com / admin123

## Verify Database

To verify the database setup:

```bash
# Access database
psql -d greenscape_lawn_care -U postgres

# List tables
\dt

# View users
SELECT * FROM users;

# Exit
\q
```

## Troubleshooting

### Connection refused
- Ensure PostgreSQL is running: `sudo service postgresql status`
- Start PostgreSQL: `sudo service postgresql start`

### Authentication failed
- Check your password in .env matches PostgreSQL user password
- For local development, you may need to update `pg_hba.conf` to use `md5` authentication

### Permission denied
- Ensure the user has proper privileges on the database
