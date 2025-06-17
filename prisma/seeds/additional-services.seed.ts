import { PrismaClient } from '@prisma/client';

export async function seedAdditionalServices(prisma: PrismaClient) {
  console.log('Seeding additional services...');

  const additionalServices = [
    {
      id: 'as_001',
      name: 'Bảo hiểm nâng cao',
      description: 'Gói bảo hiểm nâng cao bảo vệ toàn diện cho người lái và hành khách',
      price: 200000, // 200,000 VND
      isPerDay: true,
      isActive: true,
    },
    {
      id: 'as_002',
      name: 'GPS Navigation',
      description: 'Thiết bị GPS định vị và chỉ đường chính xác',
      price: 100000, // 100,000 VND
      isPerDay: false, // Phí cố định cho cả chuyến đi
      isActive: true,
    },
    {
      id: 'as_003',
      name: 'Ghế em bé',
      description: 'Ghế an toàn dành cho trẻ em dưới 3 tuổi',
      price: 50000, // 50,000 VND
      isPerDay: true,
      isActive: true,
    },
    {
      id: 'as_004',
      name: 'Wifi di động',
      description: 'Thiết bị phát wifi di động không giới hạn dữ liệu',
      price: 100000, // 100,000 VND
      isPerDay: true,
      isActive: true,
    },
    {
      id: 'as_005',
      name: 'Dịch vụ đón/trả tận nơi',
      description: 'Nhân viên sẽ giao xe và nhận xe tại địa điểm bạn chọn',
      price: 300000, // 300,000 VND
      isPerDay: false, // Phí cố định cho cả chuyến đi
      isActive: true,
    },
    {
      id: 'as_006',
      name: 'Giường ngủ phụ',
      description: 'Ghế có thể gập thành giường ngủ cho xe minivan/camper',
      price: 150000, // 150,000 VND
      isPerDay: true,
      isActive: true,
    },
    {
      id: 'as_007',
      name: 'Tủ lạnh mini',
      description: 'Tủ lạnh mini cho xe du lịch dài ngày',
      price: 120000, // 120,000 VND
      isPerDay: true,
      isActive: true,
    },
    {
      id: 'as_008',
      name: 'Bộ dụng cụ sơ cứu',
      description: 'Bộ dụng cụ sơ cứu đầy đủ y tế cơ bản',
      price: 80000, // 80,000 VND
      isPerDay: false,
      isActive: true,
    },
  ];

  // Upsert each service (create if not exists, update if exists)
  for (const service of additionalServices) {
    // Use type assertion to bypass TypeScript error
    await (prisma as any).additionalService.upsert({
      where: { id: service.id },
      update: service,
      create: {
        ...service,
        updatedAt: new Date(),
      },
    });
  }

  console.log(`Seeded ${additionalServices.length} additional services`);
}
