#!/bin/bash

# Database Setup and Seeding Script for ICCautoTravel

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}===========================================${NC}"
    echo -e "${BLUE} $1 ${NC}"
    echo -e "${BLUE}===========================================${NC}\n"
}

# Navigate to backend directory
cd "$(dirname "$0")"

print_header "ICCautoTravel Database Setup"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    print_info "Please copy .env.example to .env and configure your database settings"
    exit 1
fi

# Load environment variables
export $(cat .env | xargs)

print_info "Environment: ${NODE_ENV:-development}"
print_info "Database URL configured: ${DATABASE_URL:0:20}..."

# Check if Prisma CLI is available
if ! command -v npx prisma &> /dev/null; then
    print_error "Prisma CLI not found. Installing dependencies..."
    npm install
fi

# Generate Prisma Client
print_header "Generating Prisma Client"
npx prisma generate
print_status "Prisma client generated successfully"

# Run database migrations
print_header "Running Database Migrations"
print_warning "This will apply all pending migrations to your database"
read -p "Continue? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma migrate dev --name "initial_setup"
    print_status "Database migrations completed"
else
    print_warning "Skipping migrations. You can run them later with: npx prisma migrate dev"
fi

# Seed database
print_header "Database Seeding"
print_info "This will populate your database with initial data including:"
print_info "• Admin user account"
print_info "• Sample travel routes"
print_info "• Vehicle types and configurations"
print_info "• Basic system settings"

read -p "Proceed with seeding? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
        npx prisma db seed
        print_status "Database seeded successfully"
    else
        print_warning "No seed file found. Creating basic admin user..."
        # You can add a basic seed command here
        npm run seed:admin 2>/dev/null || print_info "No seed:admin script found"
    fi
else
    print_warning "Skipping database seeding"
fi

# Database status
print_header "Database Status"
npx prisma db push --accept-data-loss || print_warning "Could not push schema changes"

print_header "Setup Complete!"
print_status "Database is ready for development"
print_info "Admin credentials (if seeded):"
print_info "  Email: ${ADMIN_EMAIL:-admin@iccautotravel.com}"
print_info "  Password: Check your .env file for ADMIN_PASSWORD"

print_info "\nUseful commands:"
print_info "  View database: npx prisma studio"
print_info "  Reset database: npx prisma migrate reset"
print_info "  New migration: npx prisma migrate dev --name <migration_name>"

echo -e "\n${GREEN}🎉 Database setup completed successfully!${NC}\n"
