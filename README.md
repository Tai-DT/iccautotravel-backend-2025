# ICCautoTravel Backend

Backend API cho hệ thống ICCautoTravel, xây dựng trên NestJS với đầy đủ tính năng quốc tế hóa (i18n) và hỗ trợ đa ngôn ngữ.

> Cập nhật: Tháng 6, 2025

## Tính năng chính

- **API RESTful** với NestJS framework
- **GraphQL API** cho truy vấn linh hoạt
- **Hệ thống đa ngôn ngữ** (tiếng Anh, tiếng Việt, tiếng Hàn)
- **Prisma ORM** kết nối với PostgreSQL
- **JWT Authentication** và phân quyền
- **Zalo, Goong API** tích hợp
- **Bảo mật nâng cao** với các middleware và interceptor

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Tạo các tệp môi trường
cp .env.example .env.development

# Chạy migration database
npx prisma migrate dev

# Seed dữ liệu mẫu
npm run seed

# Khởi động server phát triển
npm run start:dev
```

## Cấu trúc dự án

```text
src/
├── ai/               # Tích hợp AI và xử lý ngôn ngữ tự nhiên
├── auth/             # Xác thực và phân quyền
├── bookings/         # Module quản lý đặt chỗ
├── common/           # Các thành phần dùng chung
├── i18n/             # Đa ngôn ngữ và quốc tế hóa
├── payments/         # Xử lý thanh toán
├── prisma/           # Prisma ORM và migrations
├── services/         # Module dịch vụ (xe, khách sạn, vé máy bay...)
├── users/            # Quản lý người dùng
└── ...
```

## API Đa ngôn ngữ

Hệ thống hỗ trợ API trả về dữ liệu theo ngôn ngữ yêu cầu của người dùng:

```typescript
// Cấu trúc dữ liệu đa ngôn ngữ sử dụng hậu tố _i18n
const service = {
  name_i18n: {
    en: 'Car Rental',
    vi: 'Thuê xe',
    ko: '자동차 대여'
  }
}

// Áp dụng decorator để hỗ trợ đa ngôn ngữ
@Controller('api/v1/services')
@Multilingual()
export class ServicesController {
  // Controller methods
}
```

## Tài liệu API

- Swagger UI: `/api/docs`
- GraphQL Playground: `/graphql`

## Kiểm thử

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Tài liệu về API đa ngôn ngữ

Xem hướng dẫn chi tiết tại [MULTILINGUAL_API_GUIDE.md](docs/MULTILINGUAL_API_GUIDE.md).
