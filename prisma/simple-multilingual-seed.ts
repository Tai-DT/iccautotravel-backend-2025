import { PrismaClient, ServiceType, BookingStatus, PaymentStatus, BannerPosition, BannerType, BlogStatus, LocationType } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 시작: 다국어 데이터 시딩...');

  // Create roles and permissions
  await createRolesAndPermissions();
  
  // Create users
  await createUsers();
  
  // Create locations
  await createLocations();
  
  // Create blog categories
  await createBlogCategories();
  
  // Create banners
  await createBanners();
  
  // Create blogs
  await createBlogs();
  
  // Create services
  await createServices();
  
  // Create FAQs
  await createFAQs();
  
  // Create company info
  await createCompanyInfo();
  
  // Create bookings
  await createBookings();

  console.log('✅ 완료: 다국어 데이터 시딩!');
}

async function createRolesAndPermissions() {
  console.log('👥 권한 및 역할 생성...');

  const permissions = [
    { name: 'admin:full_access', description: 'Full admin access' },
    { name: 'user:manage', description: 'Manage users' },
    { name: 'service:manage', description: 'Manage services' },
    { name: 'booking:manage', description: 'Manage bookings' }
  ];

  const createdPermissions = [];
  for (const perm of permissions) {
    const created = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: { id: uuidv4(), ...perm }
    });
    createdPermissions.push(created);
  }

  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Admin',
      description: 'System administrator',
      Permission: { connect: createdPermissions.map(p => ({ id: p.id })) }
    }
  });

  const customerRole = await prisma.role.upsert({
    where: { name: 'Customer' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Customer',
      description: 'Regular customer'
    }
  });

  return { adminRole, customerRole };
}

async function createUsers() {
  console.log('👤 사용자 생성...');

  const hashedPassword = await bcrypt.hash('password123', 10);
  const roles = await prisma.role.findMany();
  const adminRole = roles.find(r => r.name === 'Admin');
  const customerRole = roles.find(r => r.name === 'Customer');

  await prisma.user.upsert({
    where: { email: 'admin@iccautotravel.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'admin@iccautotravel.com',
      password: hashedPassword,
      fullName: 'Admin ICCautoTravel',
      roleId: adminRole.id,
      phone: '+84901234567',
      language: 'vi',
      isActive: true,
      updatedAt: new Date()
    }
  });

  // Create sample customers
  const languages = ['vi', 'en', 'ko'];
  for (let i = 0; i < 15; i++) {
    await prisma.user.upsert({
      where: { email: `customer${i + 1}@example.com` },
      update: {},
      create: {
        id: uuidv4(),
        email: `customer${i + 1}@example.com`,
        password: hashedPassword,
        fullName: faker.person.fullName(),
        roleId: customerRole.id,
        phone: faker.phone.number(),
        language: faker.helpers.arrayElement(languages),
        isActive: true,
        updatedAt: new Date()
      }
    });
  }
}

async function createLocations() {
  console.log('📍 위치 생성...');

  const locations = [
    { name: 'Hà Nội', type: LocationType.CITY },
    { name: 'Hanoi', type: LocationType.CITY },
    { name: '하노이', type: LocationType.CITY },
    { name: 'Hồ Chí Minh', type: LocationType.CITY },
    { name: 'Ho Chi Minh City', type: LocationType.CITY },
    { name: '호치민시', type: LocationType.CITY },
    { name: 'Vịnh Hạ Long', type: LocationType.ATTRACTION },
    { name: 'Ha Long Bay', type: LocationType.ATTRACTION },
    { name: '하롱베이', type: LocationType.ATTRACTION }
  ];

  for (const location of locations) {
    await prisma.location.create({
      data: {
        id: uuidv4(),
        name: location.name,
        type: location.type,
        description: `Location: ${location.name}`,
        latitude: faker.location.latitude({ min: 8, max: 23 }),
        longitude: faker.location.longitude({ min: 102, max: 110 }),
        address: faker.location.streetAddress(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }
}

async function createBlogCategories() {
  console.log('📝 블로그 카테고리 생성...');

  const categories = [
    { name: 'Du lịch', slug: 'du-lich', description: 'Thông tin du lịch', lang: 'vi' },
    { name: 'Travel', slug: 'travel', description: 'Travel information', lang: 'en' },
    { name: '여행', slug: 'travel-ko', description: '여행 정보', lang: 'ko' },
    { name: 'Ẩm thực', slug: 'am-thuc', description: 'Ẩm thực Việt Nam', lang: 'vi' },
    { name: 'Cuisine', slug: 'cuisine', description: 'Vietnamese cuisine', lang: 'en' },
    { name: '요리', slug: 'cuisine-ko', description: '베트남 요리', lang: 'ko' }
  ];

  for (const cat of categories) {
    await prisma.blogCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        id: uuidv4(),
        name: cat.name,
        description: cat.description,
        slug: cat.slug,
        lang: cat.lang,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }
}

async function createBanners() {
  console.log('🎨 배너 생성...');

  const banners = [
    {
      title: 'Khám phá Việt Nam cùng ICCautoTravel',
      subtitle: 'Trải nghiệm du lịch tuyệt vời',
      description: 'Dịch vụ du lịch chuyên nghiệp',
      buttonText: 'Đặt ngay',
      lang: 'vi'
    },
    {
      title: 'Explore Vietnam with ICCautoTravel',
      subtitle: 'Amazing travel experiences',
      description: 'Professional travel services',
      buttonText: 'Book Now',
      lang: 'en'
    },
    {
      title: 'ICCautoTravel과 함께 베트남 탐험',
      subtitle: '놀라운 여행 경험',
      description: '전문 여행 서비스',
      buttonText: '지금 예약',
      lang: 'ko'
    }
  ];

  for (let i = 0; i < banners.length; i++) {
    const banner = banners[i];
    await prisma.banner.create({
      data: {
        id: uuidv4(),
        title: banner.title,
        subtitle: banner.subtitle,
        description: banner.description,
        imageUrl: `https://picsum.photos/1200/600?random=${i + 1}`,
        linkUrl: '/services',
        buttonText: banner.buttonText,
        position: BannerPosition.HOMEPAGE,
        type: BannerType.HERO,
        isActive: true,
        sortOrder: i,
        lang: banner.lang,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }
}

async function createBlogs() {
  console.log('📰 블로그 생성...');

  const users = await prisma.user.findMany();
  const categories = await prisma.blogCategory.findMany();

  const blogs = [
    {
      title: 'Top 10 địa điểm du lịch Việt Nam',
      slug: 'top-10-dia-diem-du-lich-viet-nam',
      content: 'Việt Nam có nhiều địa điểm du lịch tuyệt đẹp...',
      excerpt: 'Khám phá 10 địa điểm đẹp nhất Việt Nam',
      tags: ['du lịch', 'việt nam'],
      lang: 'vi'
    },
    {
      title: 'Top 10 Vietnam Travel Destinations',
      slug: 'top-10-vietnam-travel-destinations',
      content: 'Vietnam has many beautiful travel destinations...',
      excerpt: 'Discover the 10 most beautiful places in Vietnam',
      tags: ['travel', 'vietnam'],
      lang: 'en'
    },
    {
      title: '베트남 여행지 TOP 10',
      slug: 'top-10-vietnam-destinations-ko',
      content: '베트남에는 아름다운 여행지가 많습니다...',
      excerpt: '베트남의 가장 아름다운 10곳을 발견하세요',
      tags: ['여행', '베트남'],
      lang: 'ko'
    }
  ];

  for (const blog of blogs) {
    const langCategories = categories.filter(c => c.lang === blog.lang);
    await prisma.blog.create({
      data: {
        id: uuidv4(),
        title: blog.title,
        slug: blog.slug,
        content: blog.content,
        excerpt: blog.excerpt,
        lang: blog.lang,
        status: BlogStatus.PUBLISHED,
        authorId: faker.helpers.arrayElement(users).id,
        categoryId: faker.helpers.arrayElement(langCategories)?.id,
        tags: blog.tags,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }
}

async function createServices() {
  console.log('🚗 서비스 생성...');

  const services = [
    { name: 'Tour Hạ Long 2N1Đ', description: 'Khám phá vịnh Hạ Long', type: ServiceType.TOUR },
    { name: 'Ha Long Bay 2D1N Tour', description: 'Explore Ha Long Bay', type: ServiceType.TOUR },
    { name: '하롱베이 2박3일 투어', description: '하롱베이 탐험', type: ServiceType.TOUR },
    { name: 'Thuê xe 7 chỗ', description: 'Xe 7 chỗ có tài xế', type: ServiceType.VEHICLE },
    { name: '7-Seater Car Rental', description: '7-seater with driver', type: ServiceType.VEHICLE },
    { name: '7인승 차량 렌탈', description: '운전자 포함 7인승', type: ServiceType.VEHICLE }
  ];

  for (const service of services) {
    const serviceId = uuidv4();
    await prisma.service.create({
      data: {
        id: serviceId,
        type: service.type,
        name: service.name,
        description: service.description,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Add tour details for tour services
    if (service.type === ServiceType.TOUR) {
      await prisma.tourServiceDetail.create({
        data: {
          id: uuidv4(),
          serviceId: serviceId,
          tourCode: `TOUR${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
          adultPrice: faker.number.int({ min: 1000000, max: 3000000 }),
          seatsAvailable: 20,
          minPax: 4,
          maxPax: 20,
          durationInDays: 2,
          description: service.description
        }
      });
    }

    // Add vehicle details for vehicle services
    if (service.type === ServiceType.VEHICLE) {
      await prisma.vehicleServiceDetail.create({
        data: {
          id: uuidv4(),
          serviceId: serviceId,
          vehicleType: 'SUV',
          brand: 'Toyota',
          model: 'Innova',
          seats: 7,
          fuelType: 'Gasoline',
          pricePerDay: 1200000,
          description: service.description,
          pickupLocation: 'Hanoi',
          dropoffLocation: 'Ho Chi Minh City'
        }
      });
    }
  }
}

async function createFAQs() {
  console.log('❓ FAQ 생성...');

  const faqs = [
    { question: 'Làm thế nào để đặt dịch vụ?', answer: 'Bạn có thể đặt qua website hoặc điện thoại.', lang: 'vi' },
    { question: 'How to book services?', answer: 'You can book via website or phone.', lang: 'en' },
    { question: '서비스를 어떻게 예약하나요?', answer: '웹사이트나 전화로 예약할 수 있습니다.', lang: 'ko' },
    { question: 'Chính sách hủy như thế nào?', answer: 'Hủy trước 24h được hoàn 100%.', lang: 'vi' },
    { question: 'What is the cancellation policy?', answer: 'Cancel 24h+ before for 100% refund.', lang: 'en' },
    { question: '취소 정책은 어떻게 되나요?', answer: '24시간 전 취소 시 100% 환불됩니다.', lang: 'ko' }
  ];

  for (let i = 0; i < faqs.length; i++) {
    const faq = faqs[i];
    await prisma.fAQ.create({
      data: {
        id: uuidv4(),
        question: faq.question,
        answer: faq.answer,
        lang: faq.lang,
        category: 'general',
        isActive: true,
        sortOrder: i,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }
}

async function createCompanyInfo() {
  console.log('🏢 회사 정보 생성...');

  const companyData = [
    {
      key: 'company_info_vi',
      title: 'ICCautoTravel Vietnam',
      content: 'Công ty du lịch hàng đầu Việt Nam với dịch vụ chuyên nghiệp',
      lang: 'vi'
    },
    {
      key: 'company_info_en',
      title: 'ICCautoTravel Vietnam',
      content: 'Leading travel company in Vietnam with professional services',
      lang: 'en'
    },
    {
      key: 'company_info_ko',
      title: 'ICCautoTravel 베트남',
      content: '전문 서비스를 제공하는 베트남 최고의 여행사',
      lang: 'ko'
    }
  ];

  for (const info of companyData) {
    await prisma.companyInfo.upsert({
      where: { key: info.key },
      update: {},
      create: {
        id: uuidv4(),
        key: info.key,
        title: info.title,
        content: info.content,
        lang: info.lang,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }
}

async function createBookings() {
  console.log('📅 예약 생성...');

  const users = await prisma.user.findMany({ where: { email: { contains: 'customer' } } });
  const services = await prisma.service.findMany();

  for (let i = 0; i < 30; i++) {
    const bookingId = uuidv4();
    const user = faker.helpers.arrayElement(users);
    const service = faker.helpers.arrayElement(services);
    
    await prisma.booking.create({
      data: {
        id: bookingId,
        userId: user.id,
        status: faker.helpers.arrayElement([
          BookingStatus.PENDING,
          BookingStatus.CONFIRMED,
          BookingStatus.COMPLETED,
          BookingStatus.CANCELLED
        ]),
        paymentStatus: faker.helpers.arrayElement([
          PaymentStatus.UNPAID,
          PaymentStatus.PAID,
          PaymentStatus.REFUNDED
        ]),
        totalPrice: faker.number.int({ min: 500000, max: 10000000 }),
        bookingCode: `BK${Date.now()}${i}`,
        startDate: faker.date.future(),
        endDate: faker.date.future(),
        notes: faker.lorem.sentence(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    await prisma.bookingServices.create({
      data: {
        bookingId: bookingId,
        serviceId: service.id
      }
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 