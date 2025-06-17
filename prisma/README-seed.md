# Prisma Seed Process

## Overview

This document explains the seed process for the iccautotravel-backend database using Prisma.

## Available Seed Files

- **seed-unified.ts**: The main seed file that combines functionality from all previous seed files. Use this for all new seeding.
- **seed.ts**: (Legacy) Original seed file with comprehensive data creation.
- **seed-i18n.ts**: (Legacy) Seed file focused on internationalization data.
- **seed-supabase.ts**: (Legacy) Seed file tailored for Supabase deployment.

## Running the Seed

To run the unified seed file:

```bash
npx prisma db seed
```

The seed script is configured in package.json to use the seed-unified.ts file by default.

## Seed Process

The unified seed file performs the following actions:

1. Cleans up existing data to avoid duplicates
2. Creates users with different roles (admin, staff, driver, customers)
3. Creates locations
4. Creates sample files (images, audio)
5. Creates blog categories and blog posts
6. Creates banners for the website
7. Creates services (tour, hotel, vehicle rental)
8. Creates vehicle details for rental services
9. Creates driver profiles and links them to vehicles
10. Creates sample bookings

## Customizing the Seed

To add more sample data, modify the `seedDatabase()` function in seed-unified.ts.

## Troubleshooting

If you encounter errors during seeding:

1. Check that your database schema is up to date: `npx prisma migrate dev`
2. Verify that all required relations exist in the schema
3. Look for any errors in the console output
4. Make sure your DATABASE_URL is correctly configured in .env
