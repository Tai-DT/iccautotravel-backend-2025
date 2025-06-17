import {
  PrismaClient,
  ServiceType,
  BookingStatus,
  PaymentStatus,
  BannerPosition,
  BannerType,
  BlogStatus,
  LocationType
} from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Multilingual data
const multilingualData = {
  banners: {
    vi: [
      {
        title: 'Khám phá Việt Nam cùng ICCautoTravel',
        subtitle: 'Trải nghiệm du lịch tuyệt vời',
        description: 'Dịch vụ du lịch chuyên nghiệp với đội ngũ tài xế giàu kinh nghiệm',
        buttonText: 'Đặt ngay'
      },
      {
        title: 'Dịch vụ xe du lịch cao cấp',
        subtitle: 'An toàn - Tiện nghi - Chuyên nghiệp',
        description: 'Đội xe hiện đại, tài xế chuyên nghiệp phục vụ 24/7',
        buttonText: 'Xem chi tiết'
      }
    ],
    en: [
      {
        title: 'Explore Vietnam with ICCautoTravel',
        subtitle: 'Amazing travel experiences',
        description: 'Professional travel services with experienced drivers',
        buttonText: 'Book Now'
      },
      {
        title: 'Premium Travel Car Services',
        subtitle: 'Safe - Comfortable - Professional',
        description: 'Modern fleet with professional drivers serving 24/7',
        buttonText: 'View Details'
      }
    ],
    ko: [
      {
        title: 'ICCautoTravel과 함께 베트남 탐험',
        subtitle: '놀라운 여행 경험',
        description: '경험 많은 운전자와 함께하는 전문 여행 서비스',
        buttonText: '지금 예약'
      }
    ]
  },
  blogs: {
    vi: [
      {
        title: 'Top 10 địa điểm du lịch không thể bỏ qua tại Việt Nam',
        slug: 'top-10-dia-diem-du-lich-viet-nam',
        content: 'Việt Nam là một đất nước tuyệt đẹp với nhiều địa điểm du lịch hấp dẫn...',
        excerpt: 'Khám phá 10 địa điểm du lịch tuyệt đẹp nhất Việt Nam',
        tags: ['du lịch', 'việt nam', 'địa điểm']
      },
      {
        title: 'Kinh nghiệm thuê xe du lịch tiết kiệm và an toàn',
        slug: 'kinh-nghiem-thue-xe-du-lich',
        content: 'Thuê xe du lịch là lựa chọn tuyệt vời để khám phá Việt Nam...',
        excerpt: 'Hướng dẫn chi tiết cách thuê xe du lịch an toàn',
        tags: ['thuê xe', 'du lịch', 'kinh nghiệm']
      }
    ],
    en: [
      {
        title: 'Top 10 Must-Visit Destinations in Vietnam',
        slug: 'top-10-must-visit-destinations-vietnam',
        content: 'Vietnam is a beautiful country with many attractive destinations...',
        excerpt: 'Discover the 10 most beautiful destinations in Vietnam',
        tags: ['travel', 'vietnam', 'destinations']
      }
    ],
    ko: [
      {
        title: '베트남 꼭 가봐야 할 관광지 TOP 10',
        slug: 'top-10-vietnam-destinations-ko',
        content: '베트남은 많은 매력적인 관광지가 있는 아름다운 나라입니다...',
        excerpt: '베트남의 가장 아름다운 관광지 10곳을 발견하세요',
        tags: ['여행', '베트남', '관광지']
      }
    ]
  }
};

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
    { name: 'Hà Nội', nameEn: 'Hanoi', nameKo: '하노이', type: LocationType.CITY },
    { name: 'Hồ Chí Minh', nameEn: 'Ho Chi Minh City', nameKo: '호치민시', type: LocationType.CITY },
    { name: 'Đà Nẵng', nameEn: 'Da Nang', nameKo: '다낭', type: LocationType.CITY },
    { name: 'Vịnh Hạ Long', nameEn: 'Ha Long Bay', nameKo: '하롱베이', type: LocationType.ATTRACTION },
    { name: 'Hội An', nameEn: 'Hoi An', nameKo: '호이안', type: LocationType.ATTRACTION }
  ];

  for (const location of locations) {
    // Vietnamese
    await prisma.location.create({
      data: {
        id: uuidv4(),
        name: location.name,
        type: location.type,
        description: `Thành phố/Địa điểm ${location.name}`,
        latitude: faker.location.latitude({ min: 8, max: 23 }),
        longitude: faker.location.longitude({ min: 102, max: 110 }),
        address: faker.location.streetAddress(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // English
    await prisma.location.create({
      data: {
        id: uuidv4(),
        name: location.nameEn,
        type: location.type,
        description: `City/Location ${location.nameEn}`,
        latitude: faker.location.latitude({ min: 8, max: 23 }),
        longitude: faker.location.longitude({ min: 102, max: 110 }),
        address: faker.location.streetAddress(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Korean
    await prisma.location.create({
      data: {
        id: uuidv4(),
        name: location.nameKo,
        type: location.type,
        description: `도시/장소 ${location.nameKo}`,
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

  const categories = {
    vi: [
      { name: 'Du lịch', slug: 'du-lich', description: 'Thông tin du lịch' },
      { name: 'Ẩm thực', slug: 'am-thuc', description: 'Ẩm thực Việt Nam' },
      { name: 'Văn hóa', slug: 'van-hoa', description: 'Văn hóa truyền thống' }
    ],
    en: [
      { name: 'Travel', slug: 'travel', description: 'Travel information' },
      { name: 'Cuisine', slug: 'cuisine', description: 'Vietnamese cuisine' },
      { name: 'Culture', slug: 'culture', description: 'Traditional culture' }
    ],
    ko: [
      { name: '여행', slug: 'travel-ko', description: '여행 정보' },
      { name: '요리', slug: 'cuisine-ko', description: '베트남 요리' },
      { name: '문화', slug: 'culture-ko', description: '전통 문화' }
    ]
  };

  for (const [lang, cats] of Object.entries(categories)) {
    for (const cat of cats) {
      await prisma.blogCategory.upsert({
        where: { slug: cat.slug },
        update: {},
        create: {
          id: uuidv4(),
          name: cat.name,
          description: cat.description,
          slug: cat.slug,
          lang: lang,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
  }
}

async function createBanners() {
  console.log('🎨 배너 생성...');

  for (const [lang, banners] of Object.entries(multilingualData.banners)) {
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
          lang: lang,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
  }
}

async function createBlogs() {
  console.log('📰 블로그 생성...');

  const users = await prisma.user.findMany();
  const categories = await prisma.blogCategory.findMany();

  for (const [lang, blogs] of Object.entries(multilingualData.blogs)) {
    const langCategories = categories.filter(c => c.lang === lang);
    
    for (const blog of blogs) {
      await prisma.blog.create({
        data: {
          id: uuidv4(),
          title: blog.title,
          slug: blog.slug,
          content: blog.content,
          excerpt: blog.excerpt,
          lang: lang,
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
}

async function createServices() {
  console.log('🚗 서비스 생성...');

  const services = [
    {
      vi: { name: 'Tour Hạ Long 2N1Đ', description: 'Khám phá vịnh Hạ Long 2 ngày 1 đêm' },
      en: { name: 'Ha Long Bay 2D1N Tour', description: 'Explore Ha Long Bay 2 days 1 night' },
      ko: { name: '하롱베이 2박3일 투어', description: '2박3일 하롱베이 탐험' },
      type: ServiceType.TOUR
    },
    {
      vi: { name: 'Thuê xe 7 chỗ', description: 'Xe 7 chỗ có tài xế' },
      en: { name: '7-Seater Car Rental', description: '7-seater car with driver' },
      ko: { name: '7인승 차량 렌탈', description: '운전자 포함 7인승 차량' },
      type: ServiceType.VEHICLE
    }
  ];

  for (const service of services) {
    for (const [lang, data] of Object.entries(service)) {
      if (lang === 'type') continue;
      
      const serviceId = uuidv4();
      await prisma.service.create({
        data: {
          id: serviceId,
          type: service.type,
          name: data.name,
          description: data.description,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: { lang: lang }
        }
      });

      // Add service details based on type
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
            description: service[lang].description,
            itinerary: {
              day1: lang === 'vi' ? 'Ngày 1: Hà Nội - Hạ Long' :
                    lang === 'en' ? 'Day 1: Hanoi - Ha Long' : '1일차: 하노이 - 하롱'
            }
          }
        });
      }

      if (service.type === ServiceType.VEHICLE) {
        await prisma.vehicleServiceDetail.create({
          data: {
            id: uuidv4(),
            serviceId: serviceId,
            vehicleType: 'SUV',
            brand: 'Toyota',
            model: 'Innova',
            seats: 7,
            fuelType: lang === 'vi' ? 'Xăng' : lang === 'en' ? 'Gasoline' : '가솔린',
            pricePerDay: 1200000,
            extras: { airCondition: true, gps: true },
            description: lang === 'vi' ? 'Xe mới, sạch sẽ' :
                        lang === 'en' ? 'New, clean car' : '새롭고 깨끗한 차량',
            pickupLocation: lang === 'vi' ? 'Hà Nội' : 'Hanoi',
            dropoffLocation: lang === 'vi' ? 'Hồ Chí Minh' : 'Ho Chi Minh City'
          }
        });
      }
    }
  }
}

async function createFAQs() {
  console.log('❓ FAQ 생성...');

  const faqs = {
    vi: [
      { question: 'Làm thế nào để đặt dịch vụ?', answer: 'Bạn có thể đặt qua website hoặc điện thoại.' },
      { question: 'Chính sách hủy như thế nào?', answer: 'Hủy trước 24h được hoàn 100%.' }
    ],
    en: [
      { question: 'How to book services?', answer: 'You can book via website or phone.' },
      { question: 'What is the cancellation policy?', answer: 'Cancel 24h+ before for 100% refund.' }
    ],
    ko: [
      { question: '서비스를 어떻게 예약하나요?', answer: '웹사이트나 전화로 예약할 수 있습니다.' },
      { question: '취소 정책은 어떻게 되나요?', answer: '24시간 전 취소 시 100% 환불됩니다.' }
    ]
  };

  for (const [lang, faqList] of Object.entries(faqs)) {
    for (let i = 0; i < faqList.length; i++) {
      const faq = faqList[i];
      await prisma.fAQ.create({
        data: {
          id: uuidv4(),
          question: faq.question,
          answer: faq.answer,
          lang: lang,
          category: 'general',
          isActive: true,
          sortOrder: i,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
  }
}

async function createCompanyInfo() {
  console.log('🏢 회사 정보 생성...');

  const companyData = {
    vi: {
      name: 'ICCautoTravel Vietnam',
      description: 'Công ty du lịch hàng đầu Việt Nam',
      address: '123 Đường Láng, Đống Đa, Hà Nội',
      phone: '+84 24 1234 5678',
      email: 'info@iccautotravel.vn',
      website: 'https://iccautotravel.vn'
    },
    en: {
      name: 'ICCautoTravel Vietnam',
      description: 'Leading travel company in Vietnam',
      address: '123 Lang Street, Dong Da, Hanoi',
      phone: '+84 24 1234 5678',
      email: 'info@iccautotravel.com',
      website: 'https://iccautotravel.com'
    },
    ko: {
      name: 'ICCautoTravel 베트남',
      description: '베트남 최고의 여행사',
      address: '123 Lang Street, Dong Da, Hanoi',
      phone: '+84 24 1234 5678',
      email: 'info@iccautotravel.kr',
      website: 'https://iccautotravel.kr'
    }
  };

  for (const [lang, info] of Object.entries(companyData)) {
    const key = `company_info_${lang}`;
    await prisma.companyInfo.upsert({
      where: { key: key },
      update: {},
      create: {
        id: uuidv4(),
        key: key,
        title: info.name,
        content: info.description,
        lang: lang,
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