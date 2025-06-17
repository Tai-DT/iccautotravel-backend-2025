# Hướng dẫn Quản lý Chỗ ngồi Xe Khách - ICC Auto Travel

## Tổng quan Hệ thống

Hệ thống quản lý chỗ ngồi xe khách được thiết kế **giống thực tế** các công ty bán vé, với khả năng:

- ✅ **Cấu hình layout** chỗ ngồi linh hoạt theo loại xe
- ✅ **Quản lý tầng** cho xe 2 tầng (có tầng/không tầng)
- ✅ **Trạng thái thời gian thực** - vé đã mua không bán được nữa
- ✅ **Reservation system** - giữ chỗ 15 phút khi đặt
- ✅ **Phân loại ghế** - VIP, Standard, Sleeper với giá khác nhau
- ✅ **Vị trí ghế** - Cửa sổ, lối đi, giữa với giá khác nhau

## Kiến trúc Hệ thống

### 1. Database Schema

```sql
VehicleLayout (Layout chỗ ngồi)
├── VehicleSeat (Các ghế)
└── VehicleSchedule (Lịch trình xe)
    └── SeatBooking (Đặt chỗ)
```

### 2. Các thành phần chính

- **VehicleLayout**: Cấu hình layout chỗ ngồi cho từng xe
- **VehicleSeat**: Thông tin chi tiết từng ghế (số ghế, tầng, loại, giá)
- **VehicleSchedule**: Lịch trình xe theo ngày
- **SeatBooking**: Đặt chỗ với thông tin hành khách

## Quy trình Quản lý Vé

### 1. Nhân viên Tạo Layout Xe

```http
POST /vehicle-seats/layouts
Content-Type: application/json

{
  "vehicleId": "vehicle-limousine-001",
  "layoutName": "Limousine VIP 34 chỗ",
  "vehicleType": "LIMOUSINE",
  "totalSeats": 34,
  "hasMultipleFloors": false,
  "totalFloors": 1,
  "floorLayouts": [
    {
      "floorNumber": 1,
      "totalRows": 9,
      "seatsPerRow": 4,
      "seats": [
        {
          "seatNumber": "A1",
          "row": 1,
          "column": "A",
          "floor": 1,
          "seatType": "VIP",
          "isAvailable": true
        },
        // ... more seats
      ]
    }
  ]
}
```

### 2. Xem Sơ đồ Chỗ ngồi Thời gian thực

```http
GET /vehicle-seats/map/vehicle-limousine-001?scheduleId=schedule-001&departureDate=2024-01-20
```

**Response:**
```json
{
  "vehicleId": "vehicle-limousine-001",
  "layoutName": "Limousine VIP 34 chỗ",
  "totalSeats": 34,
  "availableSeats": 30,
  "bookedSeats": 4,
  "hasMultipleFloors": false,
  "totalFloors": 1,
  "floors": [
    {
      "floorNumber": 1,
      "totalRows": 9,
      "seatsPerRow": 4,
      "seats": [
        {
          "seatNumber": "A1",
          "floor": 1,
          "status": "AVAILABLE",
          "seatType": "VIP",
          "position": "WINDOW",
          "price": 165000
        },
        {
          "seatNumber": "A2",
          "floor": 1,
          "status": "BOOKED",
          "passengerName": "Nguyễn Văn A",
          "bookingId": "booking-123",
          "seatType": "VIP",
          "position": "AISLE",
          "price": 157500
        }
      ],
      "layout": "[[\"A1\",\"A2\",\"A3\",\"A4\"],[\"B1\",\"B2\",\"B3\",\"B4\"]]"
    }
  ]
}
```

### 3. Đặt Chỗ ngồi

```http
POST /vehicle-seats/book
Content-Type: application/json

{
  "vehicleId": "vehicle-limousine-001",
  "scheduleId": "schedule-001",
  "departureDate": "2024-01-20",
  "departureTime": "08:00",
  "selectedSeats": [
    {
      "seatNumber": "A1",
      "floor": 1,
      "passenger": {
        "name": "Nguyễn Văn B",
        "phone": "0901234567",
        "idNumber": "123456789",
        "age": 30,
        "gender": "Nam"
      }
    },
    {
      "seatNumber": "A2", 
      "floor": 1,
      "passenger": {
        "name": "Trần Thị C",
        "phone": "0987654321",
        "age": 25,
        "gender": "Nữ"
      }
    }
  ],
  "customerName": "Nguyễn Văn B",
  "customerPhone": "0901234567",
  "pickupLocation": "Bến xe Miền Đông"
}
```

**Response:**
```json
{
  "success": true,
  "bookingId": "booking-456",
  "seats": [
    {
      "seatNumber": "A1",
      "passengerName": "Nguyễn Văn B",
      "status": "RESERVED",
      "reservedUntil": "2024-01-20T08:15:00Z"
    },
    {
      "seatNumber": "A2",
      "passengerName": "Trần Thị C", 
      "status": "RESERVED",
      "reservedUntil": "2024-01-20T08:15:00Z"
    }
  ]
}
```

### 4. Xác nhận Đặt chỗ (sau thanh toán)

```http
PATCH /vehicle-seats/booking/booking-456/confirm
```

### 5. Hủy Đặt chỗ

```http
PATCH /vehicle-seats/booking/booking-456/cancel
```

## Các Layout Chuẩn

### 1. Xe Limousine 34 chỗ (1 tầng)

```
    A  B  C  D
1 [ ][ ][ ][ ]  VIP
2 [ ][ ][ ][ ]  VIP  
3 [ ][ ][ ][ ]  
4 [ ][ ][ ][ ]  
5 [ ][ ][ ][ ]  
6 [ ][ ][ ][ ]  
7 [ ][ ][ ][ ]  
8 [ ][ ][ ][ ]  
9   [V1] [V2]    VIP
```

### 2. Xe Giường nằm 40 chỗ (2 tầng)

**Tầng 1:**
```
    A  B
1 [ ][ ]  
2 [ ][ ]  
...
10[ ][ ]  (20 chỗ)
```

**Tầng 2:**
```
    A  B
1 [ ][ ]  
2 [ ][ ]  
...
10[ ][ ]  (20 chỗ)
```

### 3. Xe Khách 45 chỗ (1 tầng)

```
    A  B  C  D
1 [ ][ ][ ][ ]  
2 [ ][ ][ ][ ]  
...
10[ ][ ][ ][ ]  
11  [ ]        (1 chỗ lẻ)
```

## API Endpoints Chính

### 🎫 Quản lý Layout

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/vehicle-seats/layouts` | Tạo layout chỗ ngồi |
| GET | `/vehicle-seats/layouts/:id` | Xem layout |
| POST | `/vehicle-seats/layouts/:id/duplicate` | Sao chép layout |

### 🗺️ Sơ đồ Chỗ ngồi

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/vehicle-seats/map/:vehicleId` | Sơ đồ thời gian thực |
| GET | `/vehicle-seats/availability/check` | Kiểm tra ghế trống |

### 🎯 Đặt chỗ

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/vehicle-seats/book` | Đặt chỗ ngồi |
| PATCH | `/vehicle-seats/booking/:id/confirm` | Xác nhận |
| PATCH | `/vehicle-seats/booking/:id/cancel` | Hủy đặt chỗ |

### 🧹 Maintenance

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/vehicle-seats/cleanup-expired` | Dọn reservation hết hạn |
| GET | `/vehicle-seats/statistics/:vehicleId` | Thống kê |

## Logic Nghiệp vụ Thực tế

### 1. Trạng thái Chỗ ngồi

- **AVAILABLE** ✅ - Ghế trống, có thể đặt
- **RESERVED** ⏳ - Đang giữ chỗ (15 phút)
- **BOOKED** ❌ - Đã mua, không bán được nữa
- **MAINTENANCE** 🔧 - Ghế hỏng, không bán

### 2. Pricing Logic

```typescript
// Giá cơ bản theo loại ghế
const basePrices = {
  STANDARD: 100000,
  VIP: 150000,
  SLEEPER: 200000
};

// Phụ phí theo vị trí
const positionMultiplier = {
  WINDOW: 1.1,    // +10%
  AISLE: 1.05,    // +5%
  MIDDLE: 1.0     // Giá gốc
};

// Giá cuối = Giá cơ bản × Vị trí
finalPrice = basePrice * positionMultiplier;
```

### 3. Reservation System

- **Thời gian giữ chỗ**: 15 phút
- **Auto cleanup**: Chạy job dọn dẹp mỗi 5 phút
- **Conflict prevention**: Unique constraint ngăn đặt trùng

### 4. Floor Management

```typescript
// Xe 1 tầng
hasMultipleFloors: false
totalFloors: 1
seats: [{ floor: 1 }]

// Xe 2 tầng  
hasMultipleFloors: true
totalFloors: 2
seats: [
  { floor: 1 }, // Tầng dưới
  { floor: 2 }  // Tầng trên
]
```

## Frontend Integration

### 1. Hiển thị Sơ đồ Ghế

```typescript
// Lấy sơ đồ ghế
const seatMap = await api.get(`/vehicle-seats/map/${vehicleId}`, {
  params: { scheduleId, departureDate }
});

// Render ghế theo tầng
seatMap.floors.forEach(floor => {
  const layout = JSON.parse(floor.layout);
  
  layout.forEach((row, rowIndex) => {
    row.forEach((seatNumber, colIndex) => {
      const seat = floor.seats.find(s => s.seatNumber === seatNumber);
      
      // Render ghế với trạng thái
      renderSeat({
        number: seatNumber,
        status: seat.status,
        price: seat.price,
        type: seat.seatType,
        passenger: seat.passengerName
      });
    });
  });
});
```

### 2. Đặt chỗ với UI

```typescript
// Chọn ghế
const selectedSeats = [];

// Thêm thông tin hành khách
selectedSeats.forEach(seatNumber => {
  const passenger = getPassengerInfo(seatNumber);
  // Validate passenger info
});

// Gửi booking request
const booking = await api.post('/vehicle-seats/book', {
  vehicleId,
  scheduleId,
  departureDate,
  selectedSeats,
  customerInfo
});

// Hiển thị countdown 15 phút
startReservationCountdown(booking.seats);
```

### 3. Real-time Updates

```typescript
// WebSocket để update real-time
socket.on('seat-booked', (data) => {
  updateSeatStatus(data.seatNumber, 'BOOKED');
});

socket.on('seat-released', (data) => {
  updateSeatStatus(data.seatNumber, 'AVAILABLE');
});
```

## Templates Layout Sẵn có

### Sử dụng Template

```http
GET /vehicle-seats/templates/standard-layouts
```

**Response:**
```json
[
  {
    "name": "Xe Limousine 34 chỗ",
    "type": "LIMOUSINE", 
    "totalSeats": 34,
    "floors": 1,
    "config": [...]
  },
  {
    "name": "Xe giường nằm 40 chỗ 2 tầng",
    "type": "SLEEPER_BUS",
    "totalSeats": 40, 
    "floors": 2,
    "config": [...]
  },
  {
    "name": "Xe khách 45 chỗ",
    "type": "COACH",
    "totalSeats": 45,
    "floors": 1,
    "config": [...]
  }
]
```

## Monitoring & Analytics

### 1. Thống kê Chỗ ngồi

```http
GET /vehicle-seats/statistics/vehicle-001?startDate=2024-01-01&endDate=2024-01-31
```

### 2. Tỷ lệ lấp đầy

```json
{
  "totalBookings": 250,
  "bySeatType": {
    "VIP": 80,
    "STANDARD": 150, 
    "SLEEPER": 20
  },
  "byPosition": {
    "WINDOW": 120,
    "AISLE": 90,
    "MIDDLE": 40
  },
  "occupancyRate": 85.5
}
```

## Best Practices

### 1. **Nhập Layout**
- Sử dụng template có sẵn làm cơ sở
- Kiểm tra tổng số ghế khớp với thực tế
- Test layout với dữ liệu thật

### 2. **Quản lý Đặt chỗ**
- Cleanup reservation hết hạn thường xuyên
- Monitor ghế "chết" (reserved quá lâu)
- Backup dữ liệu trước khi thay đổi layout

### 3. **Performance**
- Cache sơ đồ ghế cho multiple requests
- Index database cho queries thường dùng
- Pagination cho danh sách booking lớn

### 4. **Business Rules**
- Không cho đặt ghế quá 30 ngày trước
- Hủy booking trước 2 giờ khởi hành
- VIP seats không được discount

Hệ thống này **hoàn toàn giống thực tế** các công ty bán vé xe khách với đầy đủ tính năng quản lý chỗ ngồi, pricing động và reservation system! 