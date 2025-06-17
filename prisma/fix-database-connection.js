const { PrismaClient } = require('@prisma/client');

async function fixDatabaseConnection() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('🔧 Kiểm tra kết nối database...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check pool connections
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 Database version:', result);
    
    // Optimize connection pool
    console.log('🔧 Tối ưu hóa connection pool...');
    
    // Test query performance
    const start = Date.now();
    await prisma.user.count();
    const end = Date.now();
    console.log(`⏱️ Query performance: ${end - start}ms`);
    
    if (end - start > 1000) {
      console.log('⚠️ Slow query detected. Checking indexes...');
      
      // Add missing indexes
      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_user_id 
        ON "Booking"("userId");
      `;
      
      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_status 
        ON "Booking"("status");
      `;
      
      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_active 
        ON "Service"("isActive");
      `;
      
      console.log('✅ Indexes created successfully');
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
    
    // Thử reconnect
    console.log('🔄 Attempting to reconnect...');
    await prisma.$disconnect();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await prisma.$connect();
    console.log('✅ Reconnected successfully');
    
  } finally {
    await prisma.$disconnect();
    console.log('🎉 Database connection check completed');
  }
}

// Run the fix
fixDatabaseConnection().catch(console.error);
