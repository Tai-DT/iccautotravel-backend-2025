# Hệ thống Quản lý Vé Xe Khách - ICC Auto Travel

## Tổng quan

Hệ thống quản lý vé xe khách được thiết kế đặc biệt cho **nhân viên bên ngoài** với các quyền hạn được giới hạn chỉ trong phạm vi quản lý vé xe khách (bus, vehicle, transfer).

## Phân quyền và Bảo mật

### Role: VEHICLE_TICKET_MANAGER

Vai trò này được thiết kế cho nhân viên bên ngoài với các đặc điểm:
- **Quyền hạn chế**: Chỉ có thể truy cập các tính năng liên quan đến vé xe
- **Không thể truy cập**: Dữ liệu tài chính tổng thể, quản lý user, cài đặt hệ thống
- **Kiểm soát thời gian**: Một số thao tác bị giới hạn theo giờ làm việc
- **Audit log**: Tất cả hoạt động được ghi lại và theo dõi

### Danh sách Quyền chi tiết

#### 🔍 Quyền Xem
```typescript
VEHICLE_TICKETS: {
  READ_ALL_TICKETS: 'vehicle_tickets:read:all',
  READ_ASSIGNED_TICKETS: 'vehicle_tickets:read:assigned',  
  READ_TICKET_DETAILS: 'vehicle_tickets:read:details',
  VIEW_PASSENGER_LIST: 'vehicle_tickets:view:passenger_list',
  VIEW_VEHICLE_SCHEDULE: 'vehicle_tickets:view:schedule',
  VIEW_ROUTES: 'vehicle_tickets:view:routes',
}
```

#### ⚙️ Quyền Quản lý
```typescript
VEHICLE_TICKETS: {
  CREATE_TICKET: 'vehicle_tickets:create',
  UPDATE_TICKET_STATUS: 'vehicle_tickets:update:status',
  CANCEL_TICKET: 'vehicle_tickets:cancel',
  CONFIRM_TICKET: 'vehicle_tickets:confirm',
  MANAGE_SEAT_ASSIGNMENT: 'vehicle_tickets:manage:seats',
  MANAGE_DEPARTURE_TIMES: 'vehicle_tickets:manage:departure_times',
}
```

#### 👥 Quyền Chăm sóc Khách hàng
```typescript
VEHICLE_TICKETS: {
  HANDLE_CUSTOMER_REQUESTS: 'vehicle_tickets:handle:customer_requests',
  PROCESS_REFUNDS: 'vehicle_tickets:process:refunds',
}
```

#### 📊 Quyền Thống kê (Hạn chế)
```typescript
VEHICLE_TICKETS: {
  VIEW_TICKET_ANALYTICS: 'vehicle_tickets:view:analytics',
  EXPORT_TICKET_DATA: 'vehicle_tickets:export:data',
}
```

## API Endpoints

### 🎫 Quản lý Vé Xe Khách

#### Danh sách vé
```http
GET /vehicle-tickets?page=1&limit=10&status=CONFIRMED&vehicleType=BUS
```

#### Chi tiết vé
```http
GET /vehicle-tickets/{ticketId}
```

#### Tạo vé mới
```http
POST /vehicle-tickets
Content-Type: application/json

{
  "userId": "user-id",
  "serviceIds": ["service-bus-id"],
  "startDate": "2024-01-15T08:00:00Z",
  "endDate": "2024-01-15T18:00:00Z",
  "options": {
    "passengers": [
      {"name": "Nguyễn Văn A", "seatNumber": "12A"}
    ]
  }
}
```

#### Cập nhật trạng thái vé
```http
PATCH /vehicle-tickets/{ticketId}/status
Content-Type: application/json

{
  "status": "CONFIRMED",
  "reason": "Payment confirmed"
}
```

#### Hủy vé
```http
DELETE /vehicle-tickets/{ticketId}
```

### 👥 Quản lý Hành khách

#### Danh sách hành khách
```http
GET /vehicle-tickets/{ticketId}/passengers
```

#### Quản lý chỗ ngồi
```http
PATCH /vehicle-tickets/{ticketId}/seats
Content-Type: application/json

{
  "passengers": [
    {"name": "Nguyễn Văn A", "seatNumber": "12A"},
    {"name": "Trần Thị B", "seatNumber": "12B"}
  ]
}
```

### 📈 Thống kê và Báo cáo

#### Thống kê tổng quan
```http
GET /vehicle-tickets/analytics/overview?period=30d
```

#### Lịch trình xe
```http
GET /vehicle-tickets/schedule/{vehicleId}?date=2024-01-15
```

#### Tuyến đường phổ biến
```http
GET /vehicle-tickets/routes/popular
```

### 💰 Xử lý Hoàn tiền

#### Xử lý hoàn tiền
```http
POST /vehicle-tickets/{ticketId}/refund
Content-Type: application/json

{
  "refundAmount": 500000,
  "reason": "Customer cancellation",
  "refundMethod": "bank_transfer"
}
```

### 📋 Chăm sóc Khách hàng

#### Yêu cầu từ khách hàng
```http
GET /vehicle-tickets/{ticketId}/customer-requests
```

#### Phản hồi yêu cầu
```http
POST /vehicle-tickets/{ticketId}/customer-requests/{requestId}/respond
Content-Type: application/json

{
  "message": "Đã xử lý yêu cầu thay đổi chỗ ngồi",
  "action": "seat_changed"
}
```

### 📊 Xuất dữ liệu

#### Xuất báo cáo
```http
POST /vehicle-tickets/export
Content-Type: application/json

{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31", 
  "format": "excel",
  "filters": {
    "status": "CONFIRMED"
  }
}
```

## Giới hạn và Ràng buộc

### ⏰ Giới hạn Thời gian
- **Xuất dữ liệu**: Chỉ được phép từ 18:00 - 08:00 (ngoài giờ làm việc)
- **Truy cập vé cũ**: Không thể truy cập vé quá 1 năm tuổi

### 🔒 Giới hạn Thao tác  
- **Không được phép**: Thao tác hàng loạt (bulk operations)
- **Rate limiting**: Giới hạn số lần hủy/hoàn tiền mỗi giờ
- **Chỉ vé xe**: Không thể truy cập hotel, flight, tour bookings

### 💵 Giới hạn Tài chính
- **Hoàn tiền**: Cần quyền đặc biệt `process:refunds`
- **Không thể xem**: Doanh thu tổng thể, báo cáo tài chính công ty

## Triển khai

### 1. Chạy Migration
```bash
cd iccautotravel-backend
npx prisma migrate dev --name add_vehicle_ticket_permissions
```

### 2. Tạo User VEHICLE_TICKET_MANAGER
```sql
-- Sẽ được tự động tạo qua migration
-- Email: vehicle.manager@iccautotravel.com
-- Role: Vehicle Ticket Manager
```

### 3. Cập nhật Frontend
Sử dụng các endpoint mới:
```typescript
// Thay vì /bookings, sử dụng /vehicle-tickets
const vehicleTickets = await api.get('/vehicle-tickets');

// Kiểm tra quyền trước khi hiển thị UI
const canExport = userPermissions.includes('vehicle_tickets:export:data');
```

### 4. Cấu hình Environment
```env
# Thêm vào .env
VEHICLE_TICKET_RATE_LIMIT=10
VEHICLE_TICKET_EXPORT_HOURS="18-8"
```

## Testing

### Test Permissions
```bash
# Chạy script test bảo mật
chmod +x test-enhanced-security.sh
./test-enhanced-security.sh
```

### Test Scenarios
1. **Login as Vehicle Ticket Manager**
2. **Truy cập vehicle tickets** ✅
3. **Thử truy cập hotel bookings** ❌ (403 Forbidden)
4. **Xuất dữ liệu trong giờ làm việc** ❌ (403 Forbidden)
5. **Xuất dữ liệu ngoài giờ** ✅
6. **Xử lý hoàn tiền với quyền** ✅
7. **Thao tác hàng loạt** ❌ (403 Forbidden)

## Monitoring và Audit

### Audit Logs
Tất cả hoạt động được ghi lại:
```json
{
  "userId": "vehicle-manager-id",
  "action": "VEHICLE_TICKET_REFUND_PROCESSED", 
  "resourceId": "ticket-123",
  "details": {
    "refundAmount": 500000,
    "reason": "Customer cancellation"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "ipAddress": "192.168.1.100"
}
```

### Alerts
Thiết lập cảnh báo cho:
- Số lượng hoàn tiền bất thường
- Truy cập ngoài giờ làm việc
- Thất bại xác thực liên tiếp
- Xuất dữ liệu lớn

## Best Practices

### 🔐 Bảo mật
- Thay đổi mật khẩu định kỳ
- Sử dụng 2FA nếu có thể
- Không chia sẻ thông tin đăng nhập
- Đăng xuất sau khi sử dụng

### 📝 Quy trình
- Kiểm tra thông tin khách hàng trước khi xử lý
- Ghi chú đầy đủ lý do khi thay đổi trạng thái
- Xác nhận với supervisor trước khi hoàn tiền lớn
- Backup dữ liệu trước khi xuất báo cáo

### 🚨 Xử lý Sự cố
- Báo cáo ngay lập tức khi có vấn đề
- Không thử sửa chữa ngoài quyền hạn
- Ghi lại chi tiết sự cố
- Liên hệ IT support khi cần thiết

## Liên hệ Hỗ trợ

- **Technical Support**: tech@iccautotravel.com
- **Business Support**: business@iccautotravel.com  
- **Emergency**: +84 xxx xxx xxx 