# Prisma Schema Management

## Schema Files

- **schema.prisma**: The main schema file used by Prisma. This file contains all models, enums, and relationships for the database.

- **schema-extension.prisma**: This file has been removed. All its content was merged into the main `schema.prisma` file.

## Working with the Schema

1. Make all schema changes directly to the `schema.prisma` file.
2. After making changes, run `npx prisma generate` to update the Prisma client.
3. To apply schema changes to the database, run `npx prisma migrate dev --name [migration-name]`.

## Important Notes

- The error "The argument `references` must refer only to existing fields in the related model" typically occurs when there's a mismatch in field references between models.
- All models with relationships need to have corresponding fields in the referenced models.
- When adding new relationships, make sure both sides of the relationship are properly defined.
- The ServiceType enum now includes VEHICLE_RENTAL as an option.

## Common Commands

```bash
# Generate Prisma client
npx prisma generate

# Create a migration
npx prisma migrate dev --name [migration-name]

# Apply migrations to production
npx prisma migrate deploy

# Format the schema file
npx prisma format

# Visualize the database
npx prisma studio
```
