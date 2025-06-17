# 🚗 Services Module

## 📋 Overview

The Services module is the core business logic component that manages all travel-related services including vehicles, tours, hotels, flights, and visa services. It provides comprehensive service catalog management with multilingual support and SEO optimization.

## 🎯 Features

- **🚗 Vehicle Rental Services** - Car rental management with detailed specifications
- **🏝️ Tour Package Services** - Tour management with itineraries and pricing
- **🏨 Hotel Booking Services** - Hotel catalog with amenities and availability
- **✈️ Flight Booking Services** - Airline services with seat selection
- **📄 Visa Services** - Visa application and processing management
- **🚀 Fast Track Services** - Airport fast track services
- **🚐 Transfer Services** - Airport and intercity transfers
- **🛡️ Insurance Services** - Travel insurance packages
- **🌍 Multilingual Support** - Content in Vietnamese, English, Korean
- **🔍 SEO Optimization** - SEO-friendly content and metadata

## 📁 Module Structure

```
services/
├── 📄 services.module.ts           # Module configuration
├── 🎯 services.service.ts          # Core service logic
├── 🎛️ services.controller.ts       # REST API endpoints
├── 🌐 services.resolver.ts         # GraphQL resolvers
├── 📋 dto/                         # Data Transfer Objects
│   ├── create-service.dto.ts
│   ├── update-service.dto.ts
│   ├── service-filter.dto.ts
│   └── service-filter.input.ts
├── 🏗️ entities/                    # Database entities
│   └── service.entity.ts
├── 📊 enums/                       # Service type enums
├── 🚗 vehicle/                     # Vehicle-specific services
├── 🏝️ tour/                        # Tour-specific services
├── 🏨 hotel/                       # Hotel-specific services
├── ✈️ flight/                      # Flight-specific services
├── 📄 visa/                        # Visa-specific services
├── 🚀 fast-track/                  # Fast track services
├── 🚐 transfer/                    # Transfer services
└── 🛡️ insurance/                   # Insurance services
```

## 🔧 Core Components

### ServicesService

The main service class that handles all business logic for service management.

```typescript
@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  // Core CRUD operations
  async create(createServiceDto: CreateServiceDto): Promise<ServiceEntity>
  async findAll(options: PaginationOptionsDto): Promise<ServiceEntity[]>
  async findOne(id: string): Promise<ServiceEntity>
  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<ServiceEntity>
  async remove(id: string): Promise<ServiceEntity>

  // Multilingual operations
  async findOneLocalized(id: string, language: string): Promise<ServiceEntity>
  async findAllLocalized(language: string): Promise<ServiceEntity[]>
  async updateTranslations(id: string, translations: any): Promise<ServiceEntity>

  // SEO operations
  async updateSEO(id: string, seoData: any): Promise<ServiceEntity>
  async autoGenerateSEO(id: string, language: string): Promise<ServiceEntity>
  async generateSitemap(): Promise<string>

  // Business operations
  async findFeatured(language: string, limit: number): Promise<ServiceEntity[]>
  async toggleActive(id: string): Promise<ServiceEntity>
  async getServiceStats(): Promise<ServiceStats>
}
```

### Service Types

The system supports the following service types:

#### 🚗 VEHICLE
- **Purpose**: Car and vehicle rental services
- **Details**: VehicleServiceDetail with brand, model, seats, pricing
- **Features**: GPS, insurance, 24/7 support

#### 🏝️ TOUR
- **Purpose**: Guided tour packages
- **Details**: TourServiceDetail with itinerary, duration, group size
- **Features**: Professional guides, meals, accommodation

#### 🏨 HOTEL
- **Purpose**: Hotel and accommodation booking
- **Details**: HotelServiceDetail with amenities, room types, location
- **Features**: Star rating, booking management, reviews

#### ✈️ FLIGHT
- **Purpose**: Flight booking and management
- **Details**: FlightServiceDetail with airline, schedule, pricing
- **Features**: Seat selection, baggage, check-in

#### 📄 VISA
- **Purpose**: Visa application and processing
- **Details**: VisaServiceDetail with requirements, processing time
- **Features**: Document checklist, status tracking

#### 🚀 FAST_TRACK
- **Purpose**: Airport fast track services
- **Details**: FastTrackServiceDetail with airport, service level
- **Features**: Priority lanes, VIP treatment

#### 🚐 TRANSFER
- **Purpose**: Transportation services
- **Details**: TransferServiceDetail with routes, vehicle type
- **Features**: Airport pickup, intercity transfers

#### 🛡️ INSURANCE
- **Purpose**: Travel insurance packages
- **Details**: InsuranceServiceDetail with coverage, benefits
- **Features**: Medical coverage, trip protection

## 📊 Data Transfer Objects (DTOs)

### CreateServiceDto
```typescript
export class CreateServiceDto {
  @IsNotEmpty()
  name: string;

  @IsEnum(ServiceType)
  type: ServiceType;

  @IsOptional()
  description?: string;

  @IsOptional()
  imageUrl?: string;

  @IsOptional()
  price?: number;

  @IsOptional()
  currency?: string;

  @IsOptional()
  duration?: number;

  @IsOptional()
  durationUnit?: string;

  @IsOptional()
  highlights?: string[];

  @IsOptional()
  tags?: string[];

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;
}
```

### ServiceFilterDto
```typescript
export class ServiceFilterDto {
  @IsOptional()
  @IsEnum(ServiceType)
  type?: ServiceType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  search?: string;

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  tags?: string[];
}
```

## 🌍 Internationalization

### Multilingual Content Structure
```typescript
interface ServiceTranslations {
  name: {
    vi: string;
    en: string;
    ko: string;
  };
  description: {
    vi: string;
    en: string;
    ko: string;
  };
  highlights: {
    vi: string[];
    en: string[];
    ko: string[];
  };
}
```

### SEO Metadata Structure
```typescript
interface ServiceSEO {
  title: Record<string, string>;
  description: Record<string, string>;
  keywords: Record<string, string[]>;
  slug: Record<string, string>;
  metaTitle: Record<string, string>;
  metaDescription: Record<string, string>;
  ogTitle: Record<string, string>;
  ogDescription: Record<string, string>;
  ogImage: string;
  schema: Record<string, any>;
  isIndexable: boolean;
  priority: number;
  changeFreq: string;
}
```

## 🔌 API Endpoints

### REST API
```
GET    /api/services                    # Get all services
GET    /api/services/:id                # Get service by ID
POST   /api/services                    # Create new service
PUT    /api/services/:id                # Update service
DELETE /api/services/:id                # Delete service
GET    /api/services/featured           # Get featured services
GET    /api/services/type/:type         # Get services by type
GET    /api/services/sitemap            # Generate sitemap
```

### GraphQL API
```graphql
type Service {
  id: ID!
  name: String!
  type: ServiceType!
  description: String
  imageUrl: String
  price: Float
  currency: String
  duration: Int
  durationUnit: String
  highlights: [String!]
  tags: [String!]
  isActive: Boolean!
  metadata: JSON
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Query {
  services(filter: ServiceFilterInput, pagination: PaginationInput): ServiceConnection!
  service(id: ID!): Service
  serviceLocalized(id: ID!, language: String!): Service
  featuredServices(language: String, limit: Int): [Service!]!
}

type Mutation {
  createService(input: CreateServiceInput!): Service!
  updateService(id: ID!, input: UpdateServiceInput!): Service!
  deleteService(id: ID!): Service!
  updateServiceTranslations(id: ID!, translations: JSON!): Service!
  updateServiceSEO(id: ID!, seo: JSON!): Service!
}
```

## 📈 Performance Optimization

### Caching Strategy
```typescript
// Service caching with Redis
private readonly CACHE_KEY_PREFIX = 'service';
private readonly CACHE_TTL = 3600; // 1 hour

async findOne(id: string): Promise<ServiceEntity> {
  const cacheKey = `${this.CACHE_KEY_PREFIX}:${id}`;
  
  // Try cache first
  const cached = await this.redisService.getJson<ServiceEntity>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Fetch from database
  const service = await this.prisma.service.findUnique({ where: { id } });
  
  // Cache the result
  await this.redisService.setJson(cacheKey, service, this.CACHE_TTL);
  
  return ServiceEntity.fromPrisma(service);
}
```

### Database Optimization
- Indexed fields: `type`, `name`, `isActive`
- Pagination for large datasets
- Optimized queries with relations
- Connection pooling

## 🧪 Testing

### Unit Tests
```typescript
describe('ServicesService', () => {
  let service: ServicesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ServicesService, PrismaService, RedisService],
    }).compile();
    
    service = module.get<ServicesService>(ServicesService);
  });

  it('should create a service', async () => {
    const createDto: CreateServiceDto = {
      name: 'Test Service',
      type: ServiceType.VEHICLE,
      description: 'Test description',
    };
    
    const result = await service.create(createDto);
    expect(result.name).toBe('Test Service');
  });
});
```

### Integration Tests
```typescript
describe('Services Controller (e2e)', () => {
  it('/services (GET)', () => {
    return request(app.getHttpServer())
      .get('/services')
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBeDefined();
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });
});
```

## 🔍 Monitoring & Logging

### Logging Examples
```typescript
// Service creation logging
this.logger.log(`Creating service: ${createServiceDto.name}`);

// Error logging
this.logger.error(`Failed to create service: ${createServiceDto.name}`, error.stack);

// Performance logging
const startTime = Date.now();
const result = await this.complexOperation();
this.logger.debug(`Operation completed in ${Date.now() - startTime}ms`);
```

### Metrics Tracking
- Service creation/update rates
- Popular service types
- Cache hit rates
- API response times
- Error rates by endpoint

## 🚀 Deployment Considerations

### Environment Variables
```env
# Service-specific configurations
DEFAULT_SERVICE_CACHE_TTL=3600
MAX_SERVICES_PER_PAGE=50
ENABLE_SERVICE_ANALYTICS=true
SERVICE_IMAGE_CDN_URL=https://cdn.iccautotravel.com
```

### Production Optimizations
- Enable Redis clustering
- Database read replicas
- CDN for service images
- Load balancing for API endpoints

## 📚 Usage Examples

### Creating a Vehicle Service
```typescript
const vehicleService = await servicesService.create({
  name: 'Toyota Camry 2024',
  type: ServiceType.VEHICLE,
  description: 'Premium sedan with full insurance',
  price: 1200000,
  currency: 'VND',
  duration: 1,
  durationUnit: 'day',
  highlights: ['GPS Navigation', 'Insurance Included', '24/7 Support'],
  tags: ['sedan', 'premium', 'automatic'],
  metadata: {
    translations: {
      name: {
        vi: 'Toyota Camry 2024',
        en: 'Toyota Camry 2024',
        ko: '토요타 캠리 2024'
      }
    }
  }
});
```

### Fetching Services with Filters
```typescript
const services = await servicesService.findAll({
  type: ServiceType.TOUR,
  isActive: true,
  search: 'Ha Long',
  page: 1,
  limit: 10
});
```

### Updating SEO Information
```typescript
await servicesService.updateSEO(serviceId, {
  title: {
    vi: 'Du lịch Hạ Long Bay 2 ngày 1 đêm',
    en: 'Ha Long Bay 2D1N Tour Package',
    ko: '하롱베이 2일 1박 투어'
  },
  description: {
    vi: 'Khám phá kỳ quan thiên nhiên thế giới',
    en: 'Explore the natural world wonder',
    ko: '세계 자연 유산 탐험'
  }
});
```

---

## 🤝 Contributing

1. Follow TypeScript best practices
2. Write comprehensive tests for new features
3. Update documentation for API changes
4. Ensure multilingual support for user-facing content
5. Optimize for performance and scalability

## 📞 Support

For module-specific questions:
- 📧 Email: backend-services@iccautotravel.com
- 📱 Slack: #services-module
- 📖 Internal Wiki: Services Module Documentation

---

**Services Module - Powering ICC Auto Travel's Core Business Logic** 