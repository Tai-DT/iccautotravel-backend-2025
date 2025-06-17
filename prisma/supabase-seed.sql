-- ================================================================
-- ICC AUTO TRAVEL - SUPABASE SEED DATA
-- Dữ liệu đầy đủ cho hệ thống du lịch ICC Auto Travel
-- ================================================================

-- Clear existing data (careful!)
-- TRUNCATE TABLE "User", "Service", "Booking", "Location", "Role", "Permission" CASCADE;

-- ==================== 1. ROLES ====================
INSERT INTO "Role" (id, name, description, "createdAt", "updatedAt") VALUES
('role-admin', 'Admin', 'Quản trị viên hệ thống với quyền truy cập đầy đủ', NOW(), NOW()),
('role-staff', 'Staff', 'Nhân viên có quyền truy cập hạn chế', NOW(), NOW()),
('role-driver', 'Driver', 'Tài xế có thể xem chuyến đi được phân công', NOW(), NOW()),
('role-customer', 'Customer', 'Khách hàng sử dụng dịch vụ', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 2. PERMISSIONS ====================
INSERT INTO "Permission" (id, name, description, "createdAt", "updatedAt") VALUES
('perm-user-view-all', 'user:view_all', 'Xem tất cả người dùng', NOW(), NOW()),
('perm-user-manage', 'user:manage', 'Quản lý người dùng', NOW(), NOW()),
('perm-service-view-all', 'service:view_all', 'Xem tất cả dịch vụ', NOW(), NOW()),
('perm-service-manage', 'service:manage', 'Quản lý dịch vụ', NOW(), NOW()),
('perm-booking-view-all', 'booking:view_all', 'Xem tất cả đặt chỗ', NOW(), NOW()),
('perm-booking-manage', 'booking:manage', 'Quản lý đặt chỗ', NOW(), NOW()),
('perm-dashboard-access', 'dashboard:access', 'Truy cập dashboard', NOW(), NOW()),
('perm-driver-view-trips', 'driver:view_trips', 'Xem chuyến đi được phân công', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 3. LOCATIONS ====================
INSERT INTO "Location" (id, name, address, latitude, longitude, type, "createdAt", "updatedAt") VALUES
('hanoi-center', 'Trung tâm Hà Nội', 'Quận Hoàn Kiếm, Hà Nội', 21.0285, 105.8542, 'CITY', NOW(), NOW()),
('ho-chi-minh-center', 'Trung tâm TP.HCM', 'Quận 1, TP.Hồ Chí Minh', 10.8231, 106.6297, 'CITY', NOW(), NOW()),
('da-nang-center', 'Trung tâm Đà Nẵng', 'Quận Hải Châu, Đà Nẵng', 16.0544, 108.2022, 'CITY', NOW(), NOW()),
('noi-bai-airport', 'Sân bay Nội Bài', 'Phù Linh, Sóc Sơn, Hà Nội', 21.2214, 105.8073, 'AIRPORT', NOW(), NOW()),
('tan-son-nhat-airport', 'Sân bay Tân Sơn Nhất', 'Quận Tân Bình, TP.Hồ Chí Minh', 10.8187, 106.6595, 'AIRPORT', NOW(), NOW()),
('hoi-an-ancient-town', 'Phố cổ Hội An', 'Hội An, Quảng Nam', 15.8801, 108.3380, 'TOURIST_ATTRACTION', NOW(), NOW()),
('ha-long-bay', 'Vịnh Hạ Long', 'Hạ Long, Quảng Ninh', 20.9101, 107.1839, 'TOURIST_ATTRACTION', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 4. USERS ====================
-- Password: Admin123! (hashed với bcrypt)
INSERT INTO "User" (id, email, password, "fullName", "roleId", phone, language, bio, "isActive", "createdAt", "updatedAt") VALUES
('admin-001', 'admin@iccautotravel.com', '$2b$10$K7LWS7Z1J1mY3QpqS5QOZOgHgWQQ1VHvHSV5Z8mF2QxV3qTcG5x6G', 'Nguyễn Văn Admin', 'role-admin', '+84901234567', 'vi', 'Quản trị viên hệ thống ICC Auto Travel', true, NOW(), NOW()),
('staff-001', 'staff@iccautotravel.com', '$2b$10$K7LWS7Z1J1mY3QpqS5QOZOgHgWQQ1VHvHSV5Z8mF2QxV3qTcG5x6G', 'Trần Thị Nhân Viên', 'role-staff', '+84901234568', 'vi', 'Nhân viên tư vấn dịch vụ du lịch', true, NOW(), NOW()),
('driver-001', 'driver1@iccautotravel.com', '$2b$10$K7LWS7Z1J1mY3QpqS5QOZOgHgWQQ1VHvHSV5Z8mF2QxV3qTcG5x6G', 'Lê Minh Tài Xế', 'role-driver', '+84901234569', 'vi', 'Tài xế chuyên nghiệp với 10 năm kinh nghiệm', true, NOW(), NOW()),
('driver-002', 'driver2@iccautotravel.com', '$2b$10$K7LWS7Z1J1mY3QpqS5QOZOgHgWQQ1VHvHSV5Z8mF2QxV3qTcG5x6G', 'Phạm Văn Lái Xe', 'role-driver', '+84901234570', 'vi', 'Tài xế an toàn, thân thiện', true, NOW(), NOW()),
('customer-001', 'customer1@example.com', '$2b$10$K7LWS7Z1J1mY3QpqS5QOZOgHgWQQ1VHvHSV5Z8mF2QxV3qTcG5x6G', 'Hoàng Thị Khách Hàng', 'role-customer', '+84901234571', 'vi', NULL, true, NOW(), NOW()),
('customer-002', 'customer2@example.com', '$2b$10$K7LWS7Z1J1mY3QpqS5QOZOgHgWQQ1VHvHSV5Z8mF2QxV3qTcG5x6G', 'Công ty TNHH Du Lịch ABC', 'role-customer', '+84901234572', 'vi', NULL, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Update driver specific fields
UPDATE "User" SET 
  "driverStatus" = 'APPROVED',
  "experience" = 10,
  "languages" = ARRAY['vi', 'en'],
  "licenseClass" = 'B2',
  "licenseNumber" = 'B2-123456789',
  "rating" = 4.8
WHERE id = 'driver-001';

UPDATE "User" SET 
  "driverStatus" = 'APPROVED',
  "experience" = 7,
  "languages" = ARRAY['vi'],
  "licenseClass" = 'D',
  "licenseNumber" = 'D-987654321',
  "rating" = 4.6
WHERE id = 'driver-002';

-- Update customer specific fields
UPDATE "User" SET 
  "customerType" = 'INDIVIDUAL'
WHERE id = 'customer-001';

UPDATE "User" SET 
  "customerType" = 'COMPANY',
  "companyName" = 'Công ty TNHH Du Lịch ABC',
  "taxCode" = '0123456789'
WHERE id = 'customer-002';

-- ==================== 5. COMPANY INFO ====================
INSERT INTO "CompanyInfo" (id, key, title, content, lang, "isActive", "createdAt", "updatedAt") VALUES
('company-vi', 'company_info', 'ICC Auto Travel', 
'{
  "name": "Công ty TNHH Du Lịch ICC Auto Travel",
  "address": "123 Đường Láng, Quận Đống Đa, Hà Nội",
  "phone": "+84 24 3765 4321",
  "email": "info@iccautotravel.com",
  "website": "https://iccautotravel.com",
  "description": "Chuyên cung cấp dịch vụ du lịch, cho thuê xe và tour trọn gói",
  "workingHours": {
    "monday": "08:00 - 18:00",
    "tuesday": "08:00 - 18:00",
    "wednesday": "08:00 - 18:00",
    "thursday": "08:00 - 18:00",
    "friday": "08:00 - 18:00",
    "saturday": "08:00 - 17:00",
    "sunday": "09:00 - 17:00"
  },
  "socialMedia": {
    "facebook": "https://facebook.com/iccautotravel",
    "instagram": "https://instagram.com/iccautotravel",
    "youtube": "https://youtube.com/iccautotravel"
  }
}', 'vi', true, NOW(), NOW()),
('company-en', 'company_info', 'ICC Auto Travel',
'{
  "name": "ICC Auto Travel Co., Ltd",
  "address": "123 Lang Street, Dong Da District, Hanoi",
  "phone": "+84 24 3765 4321",
  "email": "info@iccautotravel.com",
  "website": "https://iccautotravel.com",
  "description": "Specializing in travel services, car rental and package tours",
  "workingHours": {
    "monday": "08:00 - 18:00",
    "tuesday": "08:00 - 18:00",
    "wednesday": "08:00 - 18:00",
    "thursday": "08:00 - 18:00",
    "friday": "08:00 - 18:00",
    "saturday": "08:00 - 17:00",
    "sunday": "09:00 - 17:00"
  },
  "socialMedia": {
    "facebook": "https://facebook.com/iccautotravel",
    "instagram": "https://instagram.com/iccautotravel",
    "youtube": "https://youtube.com/iccautotravel"
  }
}', 'en', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 6. SERVICES ====================
-- Vehicle Services
INSERT INTO "Service" (id, type, name, description, "isActive", "createdAt", "updatedAt") VALUES
('vehicle-sedan-001', 'VEHICLE', 'Toyota Camry - Sedan 4 chỗ', 'Xe sedan hạng sang, phù hợp cho chuyến đi công tác và gia đình nhỏ', true, NOW(), NOW()),
('vehicle-suv-001', 'VEHICLE', 'Ford Everest - SUV 7 chỗ', 'SUV 7 chỗ rộng rãi, phù hợp cho gia đình và nhóm bạn', true, NOW(), NOW()),
('vehicle-bus-001', 'VEHICLE', 'Hyundai Universe - Xe khách 45 chỗ', 'Xe khách cao cấp dành cho nhóm lớn và tour du lịch', true, NOW(), NOW()),
('tour-halong-001', 'TOUR', 'Tour Vịnh Hạ Long 2N1Đ', 'Khám phá kỳ quan thiên nhiên thế giới Vịnh Hạ Long', true, NOW(), NOW()),
('tour-sapa-001', 'TOUR', 'Tour Sapa Fansipan 3N2Đ', 'Chinh phục nóc nhà Đông Dương và khám phá văn hóa vùng cao', true, NOW(), NOW()),
('hotel-hanoi-001', 'HOTEL', 'Khách sạn Metropole Hà Nội', 'Khách sạn 5 sao trung tâm Hà Nội với lịch sử hơn 100 năm', true, NOW(), NOW()),
('hotel-hoian-001', 'HOTEL', 'Resort Anantara Hội An', 'Resort cao cấp bên sông Thu Bồn, Hội An', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Vehicle Service Details
INSERT INTO "VehicleServiceDetail" (id, "serviceId", "vehicleType", brand, model, "licensePlate", seats, "fuelType", "pricePerDay", "pickupLocation", "pickupLatitude", "pickupLongitude", description, extras, "createdAt", "updatedAt") VALUES
('vehicle-sedan-001-detail', 'vehicle-sedan-001', 'Sedan', 'Toyota', 'Camry 2023', '30A-12345', 4, 'Xăng', 1500000, 'Trung tâm Hà Nội', 21.0285, 105.8542, 'Xe sedan cao cấp với đầy đủ tiện nghi: điều hòa, GPS, ghế da', '{"airConditioning": true, "gps": true, "leatherSeats": true, "bluetooth": true, "usb": true}', NOW(), NOW()),
('vehicle-suv-001-detail', 'vehicle-suv-001', 'SUV', 'Ford', 'Everest 2023', '30A-67890', 7, 'Dầu', 2200000, 'Sân bay Nội Bài', 21.2214, 105.8073, 'SUV 7 chỗ với cốp rộng, phù hợp cho chuyến đi dài', '{"airConditioning": true, "gps": true, "sunroof": true, "thirdRowSeating": true, "largeTrunk": true}', NOW(), NOW()),
('vehicle-bus-001-detail', 'vehicle-bus-001', 'Bus', 'Hyundai', 'Universe Noble 2023', '30B-11111', 45, 'Dầu', 5000000, 'Bến xe Mỹ Đình', 21.0278, 105.7811, 'Xe khách cao cấp với ghế nằm, wifi, tivi', '{"airConditioning": true, "wifi": true, "tv": true, "recliningSeats": true, "restroom": true, "miniBar": true}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Tour Service Details
INSERT INTO "TourServiceDetail" (id, "serviceId", destination, duration, "maxGroupSize", "minGroupSize", difficulty, price, includes, excludes, itinerary, "createdAt", "updatedAt") VALUES
('tour-halong-001-detail', 'tour-halong-001', 'Vịnh Hạ Long, Quảng Ninh', 2, 30, 2, 'Dễ', 2500000, '["Xe đưa đón", "Khách sạn 4*", "Ăn sáng", "Hướng dẫn viên"]', '["Vé máy bay", "Chi phí cá nhân"]', '{"day1": "Hà Nội - Hạ Long - Du thuyền trên vịnh", "day2": "Tham quan động Thiên Cung - Về Hà Nội"}', NOW(), NOW()),
('tour-sapa-001-detail', 'tour-sapa-001', 'Sapa, Lào Cai', 3, 20, 2, 'Trung bình', 3500000, '["Xe đưa đón", "Khách sạn 3*", "Ăn 3 bữa/ngày", "Hướng dẫn viên", "Vé cáp treo"]', '["Vé máy bay", "Đồ uống có cồn", "Chi phí cá nhân"]', '{"day1": "Hà Nội - Sapa - Tham quan Bản Cát Cát", "day2": "Chinh phục đỉnh Fansipan bằng cáp treo", "day3": "Tham quan thác Bạc - Về Hà Nội"}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Hotel Service Details
INSERT INTO "HotelServiceDetail" (id, "serviceId", name, address, "starRating", "checkInTime", "checkOutTime", "pricePerNight", amenities, "roomTypes", "cancellationPolicy", "createdAt", "updatedAt") VALUES
('hotel-hanoi-001-detail', 'hotel-hanoi-001', 'Sofitel Legend Metropole Hanoi', '15 Ngô Quyền, Hoàn Kiếm, Hà Nội', 5, '15:00', '12:00', 8000000, '["Spa", "Bể bơi", "Gym", "Wifi miễn phí", "Dịch vụ phòng 24h"]', '["Superior Room", "Premium Room", "Suite"]', 'Miễn phí hủy trước 24h', NOW(), NOW()),
('hotel-hoian-001-detail', 'hotel-hoian-001', 'Anantara Hoi An Resort', '1 Phạm Hồng Thái, Cẩm An, Hội An', 5, '15:00', '12:00', 6500000, '["Spa", "Bể bơi vô cực", "Gym", "Wifi miễn phí", "Kayak miễn phí"]', '["River View Room", "Garden View Room", "Villa"]', 'Miễn phí hủy trước 48h', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 7. BOOKINGS ====================
INSERT INTO "Booking" (id, "userId", status, "paymentStatus", "totalPrice", "bookingCode", notes, "startDate", "endDate", metadata, "createdAt", "updatedAt") VALUES
('booking-001', 'customer-001', 'CONFIRMED', 'PAID', 7500000, 'ICC-001-2024', 'Khách hàng yêu cầu đón tại sân bay Nội Bài lúc 14:00', '2024-12-20 00:00:00', '2024-12-22 00:00:00', '{"specialRequests": ["Ghế trẻ em", "Wifi"], "emergencyContact": "+84901234571"}', NOW(), NOW()),
('booking-002', 'customer-002', 'PENDING', 'UNPAID', 15000000, 'ICC-002-2024', 'Booking cho công ty, cần hóa đơn VAT', '2024-12-25 00:00:00', '2024-12-27 00:00:00', '{"invoiceRequired": true, "companyInvoice": true, "groupSize": 15}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 8. BANNERS ====================
INSERT INTO "Banner" (id, title, subtitle, description, "imageUrl", "linkUrl", "buttonText", position, type, "isActive", lang, "seoTitle", "seoDescription", "sortOrder", "startDate", "endDate", "createdAt", "updatedAt") VALUES
('banner-hero-001', 'Khám Phá Việt Nam Cùng ICC Auto Travel', 'Dịch vụ du lịch chuyên nghiệp', 'Cho thuê xe, tour trọn gói với giá tốt nhất', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200', '/services', 'Đặt ngay', 'HOMEPAGE', 'HERO', true, 'vi', 'Du lịch Việt Nam - ICC Auto Travel', 'Dịch vụ cho thuê xe và tour du lịch chất lượng cao', 1, NULL, NULL, NOW(), NOW()),
('banner-promo-001', 'Giảm 20% Tour Hạ Long', 'Ưu đãi tháng 12', 'Áp dụng cho đoàn từ 10 người trở lên', 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800', '/tours/halong', 'Xem chi tiết', 'HOMEPAGE', 'PROMOTION', true, 'vi', NULL, NULL, 2, '2024-12-01 00:00:00', '2024-12-31 23:59:59', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 9. BLOG POSTS ====================
INSERT INTO "Blog" (id, title, slug, content, excerpt, lang, status, "authorId", tags, "seoTitle", "seoDescription", "createdAt", "updatedAt") VALUES
('blog-001', '10 Địa Điểm Du Lịch Không Thể Bỏ Qua Ở Việt Nam', '10-dia-diem-du-lich-khong-the-bo-qua-o-viet-nam', 
'<h2>1. Vịnh Hạ Long - Kỳ quan thiên nhiên thế giới</h2><p>Vịnh Hạ Long là một trong những điểm đến không thể bỏ qua khi du lịch Việt Nam...</p><h2>2. Phố cổ Hội An - Di sản văn hóa thế giới</h2><p>Hội An với những ngôi nhà cổ kính, đèn lồng rực rỡ...</p><h2>3. Sapa - Thiên đường mây trắng</h2><p>Sapa nổi tiếng với những thửa ruộng bậc thang tuyệt đẹp...</p>',
'Khám phá 10 địa điểm du lịch tuyệt vời nhất Việt Nam mà bạn không thể bỏ qua', 'vi', 'PUBLISHED', 'staff-001', 
'{"du lịch", "việt nam", "điểm đến"}', '10 Địa Điểm Du Lịch Đẹp Nhất Việt Nam | ICC Auto Travel', 'Khám phá 10 địa điểm du lịch không thể bỏ qua ở Việt Nam cùng ICC Auto Travel', NOW(), NOW()),
('blog-002', 'Kinh Nghiệm Thuê Xe Du Lịch An Toàn', 'kinh-nghiem-thue-xe-du-lich-an-toan',
'<h2>1. Chọn đơn vị cho thuê xe uy tín</h2><p>Việc lựa chọn đơn vị cho thuê xe uy tín là bước đầu tiên...</p><h2>2. Kiểm tra xe cẩn thận trước khi nhận</h2><p>Hãy kiểm tra kỹ tình trạng xe trước khi ký hợp đồng...</p><h2>3. Hiểu rõ điều khoản hợp đồng</h2><p>Đọc kỹ các điều khoản trong hợp đồng thuê xe...</p>',
'Những kinh nghiệm hữu ích khi thuê xe du lịch để có chuyến đi an toàn và tiết kiệm', 'vi', 'PUBLISHED', 'admin-001',
'{"thuê xe", "an toàn", "kinh nghiệm"}', 'Kinh Nghiệm Thuê Xe Du Lịch An Toàn | ICC Auto Travel', 'Chia sẻ kinh nghiệm thuê xe du lịch an toàn và tiết kiệm chi phí', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 10. FAQ ====================
INSERT INTO "FAQ" (id, question, answer, category, lang, "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
('faq-001', 'Làm thế nào để đặt xe?', 'Bạn có thể đặt xe qua website, điện thoại hoặc đến trực tiếp văn phòng của chúng tôi. Quy trình đặt xe rất đơn giản và nhanh chóng.', 'Đặt xe', 'vi', true, 1, NOW(), NOW()),
('faq-002', 'Chi phí thuê xe được tính như thế nào?', 'Chi phí thuê xe phụ thuộc vào loại xe, thời gian thuê, và khoảng cách di chuyển. Chúng tôi có bảng giá công khai và minh bạch.', 'Giá cả', 'vi', true, 2, NOW(), NOW()),
('faq-003', 'Có cần đặt cọc trước không?', 'Có, bạn cần đặt cọc trước 30% tổng giá trị để giữ chỗ. Số tiền còn lại sẽ thanh toán khi nhận xe.', 'Thanh toán', 'vi', true, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 11. NOTIFICATIONS ====================
INSERT INTO "Notification" (id, title, message, type, priority, "userId", "isRead", metadata, "createdAt", "updatedAt") VALUES
('notif-001', 'Đặt xe thành công', 'Đơn đặt xe ICC-001-2024 đã được xác nhận. Xe sẽ đón bạn lúc 14:00 ngày 20/12.', 'BOOKING_CONFIRMATION', 'HIGH', 'customer-001', false, '{"bookingId": "booking-001", "bookingCode": "ICC-001-2024"}', NOW(), NOW()),
('notif-002', 'Chương trình khuyến mãi mới', 'Giảm 20% tour Hạ Long cho đoàn từ 10 người. Ưu đãi có hạn!', 'PROMOTION', 'MEDIUM', 'customer-001', false, '{"promotionCode": "HALONG20", "validUntil": "2024-12-31"}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 12. INVOICES ====================
INSERT INTO "Invoice" (id, "bookingId", "invoiceNumber", "totalAmount", "taxAmount", status, "dueDate", "paidAt", metadata, "createdAt", "updatedAt") VALUES
('invoice-001', 'booking-001', 'ICC-INV-001-2024', 7500000, 750000, 'PAID', '2024-12-15 00:00:00', '2024-12-14 00:00:00',
'{
  "customerName": "Hoàng Thị Khách Hàng",
  "customerAddress": "Hà Nội",
  "items": [
    {
      "name": "Tour Vịnh Hạ Long 2N1Đ",
      "quantity": 1,
      "unitPrice": 7500000,
      "totalPrice": 7500000
    }
  ]
}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 13. PAYMENTS ====================
INSERT INTO "Payment" (id, "bookingId", amount, method, status, "transactionId", metadata, "createdAt", "updatedAt") VALUES
('payment-001', 'booking-001', 7500000, 'BANK_TRANSFER', 'PAID', 'TXN-001-2024',
'{
  "bankName": "Vietcombank",
  "accountNumber": "1234567890",
  "transferNote": "Thanh toan booking ICC-001-2024"
}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 14. SERVICE REVIEWS ====================
INSERT INTO "ServiceReview" (id, "serviceId", "userId", rating, comment, "isApproved", "createdAt", "updatedAt") VALUES
('review-001', 'tour-halong-001', 'customer-001', 5, 'Tour rất tuyệt vời! Hướng dẫn viên nhiệt tình, lịch trình hợp lý. Sẽ quay lại lần sau.', true, NOW(), NOW()),
('review-002', 'vehicle-sedan-001', 'customer-002', 4, 'Xe sạch sẽ, tài xế lịch sự. Dịch vụ tốt, giá cả hợp lý.', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 15. DRIVER REVIEWS ====================
INSERT INTO "DriverReview" (id, "driverId", "userId", rating, comment, "tripDate", "createdAt", "updatedAt") VALUES
('driver-review-001', 'driver-001', 'customer-001', 5, 'Tài xế lái xe an toàn, đúng giờ, rất thân thiện và nhiệt tình.', '2024-12-20 00:00:00', NOW(), NOW()),
('driver-review-002', 'driver-002', 'customer-002', 4, 'Dịch vụ tốt, xe sạch sẽ. Tài xế có kinh nghiệm.', '2024-12-18 00:00:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 16. NEWSLETTER ====================
INSERT INTO "Newsletter" (id, email, status, "subscribedAt", "createdAt", "updatedAt") VALUES
('newsletter-001', 'customer1@example.com', 'SUBSCRIBED', NOW(), NOW(), NOW()),
('newsletter-002', 'customer2@example.com', 'SUBSCRIBED', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 17. CONTACTS ====================
INSERT INTO "Contact" (id, name, email, phone, subject, message, status, "userId", response, "responseAt", "createdAt", "updatedAt") VALUES
('contact-001', 'Nguyễn Văn A', 'nguyenvana@example.com', '+84901234567', 'Hỏi giá tour Sapa', 'Tôi muốn hỏi giá tour Sapa 3 ngày 2 đêm cho 4 người.', 'NEW', 'customer-001', NULL, NULL, NOW(), NOW()),
('contact-002', 'Trần Thị B', 'tranthib@example.com', '+84901234568', 'Thuê xe đi Đà Nẵng', 'Tôi cần thuê xe 7 chỗ đi Đà Nẵng 5 ngày.', 'RESPONDED', NULL, 'Cảm ơn bạn đã liên hệ. Chúng tôi sẽ gửi báo giá trong 24h.', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- SUMMARY
-- ================================================================
/*
✅ Dữ liệu đã tạo thành công:

📋 ROLES & PERMISSIONS:
- 4 Roles: Admin, Staff, Driver, Customer
- 8 Permissions cơ bản

📍 LOCATIONS:
- 7 địa điểm: Hà Nội, TP.HCM, Đà Nẵng, 2 sân bay, 2 điểm du lịch

👥 USERS:
- 6 users: 1 Admin, 1 Staff, 2 Drivers, 2 Customers
- Password cho tất cả: Admin123!

🏢 COMPANY INFO:
- Thông tin công ty bằng tiếng Việt và tiếng Anh

🚗 SERVICES:
- 7 dịch vụ: 3 Vehicle, 2 Tour, 2 Hotel
- Đầy đủ chi tiết cho từng loại dịch vụ

📋 BOOKINGS:
- 2 booking mẫu với trạng thái khác nhau

🎨 BANNERS:
- 2 banner: Hero và Promotion

📝 BLOG:
- 2 bài viết về du lịch Việt Nam

❓ FAQ:
- 3 câu hỏi thường gặp

🔔 NOTIFICATIONS:
- 2 thông báo mẫu

🧾 INVOICES & PAYMENTS:
- 1 hóa đơn và thanh toán hoàn tất

⭐ REVIEWS:
- 4 đánh giá: 2 service, 2 driver

📧 NEWSLETTER & CONTACTS:
- 2 newsletter subscriber
- 2 contact message

🎉 Database sẵn sàng cho phát triển!
*/
</rewritten_file>
 
-- ICC AUTO TRAVEL - SUPABASE SEED DATA
-- Dữ liệu đầy đủ cho hệ thống du lịch ICC Auto Travel
-- ================================================================

-- Clear existing data (careful!)
-- TRUNCATE TABLE "User", "Service", "Booking", "Location", "Role", "Permission" CASCADE;

-- ==================== 1. ROLES ====================
INSERT INTO "Role" (id, name, description, "createdAt", "updatedAt") VALUES
('role-admin', 'Admin', 'Quản trị viên hệ thống với quyền truy cập đầy đủ', NOW(), NOW()),
('role-staff', 'Staff', 'Nhân viên có quyền truy cập hạn chế', NOW(), NOW()),
('role-driver', 'Driver', 'Tài xế có thể xem chuyến đi được phân công', NOW(), NOW()),
('role-customer', 'Customer', 'Khách hàng sử dụng dịch vụ', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 2. PERMISSIONS ====================
INSERT INTO "Permission" (id, name, description, "createdAt", "updatedAt") VALUES
('perm-user-view-all', 'user:view_all', 'Xem tất cả người dùng', NOW(), NOW()),
('perm-user-manage', 'user:manage', 'Quản lý người dùng', NOW(), NOW()),
('perm-service-view-all', 'service:view_all', 'Xem tất cả dịch vụ', NOW(), NOW()),
('perm-service-manage', 'service:manage', 'Quản lý dịch vụ', NOW(), NOW()),
('perm-booking-view-all', 'booking:view_all', 'Xem tất cả đặt chỗ', NOW(), NOW()),
('perm-booking-manage', 'booking:manage', 'Quản lý đặt chỗ', NOW(), NOW()),
('perm-dashboard-access', 'dashboard:access', 'Truy cập dashboard', NOW(), NOW()),
('perm-driver-view-trips', 'driver:view_trips', 'Xem chuyến đi được phân công', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 3. LOCATIONS ====================
INSERT INTO "Location" (id, name, address, latitude, longitude, type, "createdAt", "updatedAt") VALUES
('hanoi-center', 'Trung tâm Hà Nội', 'Quận Hoàn Kiếm, Hà Nội', 21.0285, 105.8542, 'CITY', NOW(), NOW()),
('ho-chi-minh-center', 'Trung tâm TP.HCM', 'Quận 1, TP.Hồ Chí Minh', 10.8231, 106.6297, 'CITY', NOW(), NOW()),
('da-nang-center', 'Trung tâm Đà Nẵng', 'Quận Hải Châu, Đà Nẵng', 16.0544, 108.2022, 'CITY', NOW(), NOW()),
('noi-bai-airport', 'Sân bay Nội Bài', 'Phù Linh, Sóc Sơn, Hà Nội', 21.2214, 105.8073, 'AIRPORT', NOW(), NOW()),
('tan-son-nhat-airport', 'Sân bay Tân Sơn Nhất', 'Quận Tân Bình, TP.Hồ Chí Minh', 10.8187, 106.6595, 'AIRPORT', NOW(), NOW()),
('hoi-an-ancient-town', 'Phố cổ Hội An', 'Hội An, Quảng Nam', 15.8801, 108.3380, 'TOURIST_ATTRACTION', NOW(), NOW()),
('ha-long-bay', 'Vịnh Hạ Long', 'Hạ Long, Quảng Ninh', 20.9101, 107.1839, 'TOURIST_ATTRACTION', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 4. USERS ====================
-- Password: Admin123! (hashed với bcrypt)
INSERT INTO "User" (id, email, password, "fullName", "roleId", phone, language, bio, "isActive", "createdAt", "updatedAt") VALUES
('admin-001', 'admin@iccautotravel.com', '$2b$10$K7LWS7Z1J1mY3QpqS5QOZOgHgWQQ1VHvHSV5Z8mF2QxV3qTcG5x6G', 'Nguyễn Văn Admin', 'role-admin', '+84901234567', 'vi', 'Quản trị viên hệ thống ICC Auto Travel', true, NOW(), NOW()),
('staff-001', 'staff@iccautotravel.com', '$2b$10$K7LWS7Z1J1mY3QpqS5QOZOgHgWQQ1VHvHSV5Z8mF2QxV3qTcG5x6G', 'Trần Thị Nhân Viên', 'role-staff', '+84901234568', 'vi', 'Nhân viên tư vấn dịch vụ du lịch', true, NOW(), NOW()),
('driver-001', 'driver1@iccautotravel.com', '$2b$10$K7LWS7Z1J1mY3QpqS5QOZOgHgWQQ1VHvHSV5Z8mF2QxV3qTcG5x6G', 'Lê Minh Tài Xế', 'role-driver', '+84901234569', 'vi', 'Tài xế chuyên nghiệp với 10 năm kinh nghiệm', true, NOW(), NOW()),
('driver-002', 'driver2@iccautotravel.com', '$2b$10$K7LWS7Z1J1mY3QpqS5QOZOgHgWQQ1VHvHSV5Z8mF2QxV3qTcG5x6G', 'Phạm Văn Lái Xe', 'role-driver', '+84901234570', 'vi', 'Tài xế an toàn, thân thiện', true, NOW(), NOW()),
('customer-001', 'customer1@example.com', '$2b$10$K7LWS7Z1J1mY3QpqS5QOZOgHgWQQ1VHvHSV5Z8mF2QxV3qTcG5x6G', 'Hoàng Thị Khách Hàng', 'role-customer', '+84901234571', 'vi', NULL, true, NOW(), NOW()),
('customer-002', 'customer2@example.com', '$2b$10$K7LWS7Z1J1mY3QpqS5QOZOgHgWQQ1VHvHSV5Z8mF2QxV3qTcG5x6G', 'Công ty TNHH Du Lịch ABC', 'role-customer', '+84901234572', 'vi', NULL, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Update driver specific fields
UPDATE "User" SET 
  "driverStatus" = 'APPROVED',
  "experience" = 10,
  "languages" = ARRAY['vi', 'en'],
  "licenseClass" = 'B2',
  "licenseNumber" = 'B2-123456789',
  "rating" = 4.8
WHERE id = 'driver-001';

UPDATE "User" SET 
  "driverStatus" = 'APPROVED',
  "experience" = 7,
  "languages" = ARRAY['vi'],
  "licenseClass" = 'D',
  "licenseNumber" = 'D-987654321',
  "rating" = 4.6
WHERE id = 'driver-002';

-- Update customer specific fields
UPDATE "User" SET 
  "customerType" = 'INDIVIDUAL'
WHERE id = 'customer-001';

UPDATE "User" SET 
  "customerType" = 'COMPANY',
  "companyName" = 'Công ty TNHH Du Lịch ABC',
  "taxCode" = '0123456789'
WHERE id = 'customer-002';

-- ==================== 5. COMPANY INFO ====================
INSERT INTO "CompanyInfo" (id, key, title, content, lang, "isActive", "createdAt", "updatedAt") VALUES
('company-vi', 'company_info', 'ICC Auto Travel', 
'{
  "name": "Công ty TNHH Du Lịch ICC Auto Travel",
  "address": "123 Đường Láng, Quận Đống Đa, Hà Nội",
  "phone": "+84 24 3765 4321",
  "email": "info@iccautotravel.com",
  "website": "https://iccautotravel.com",
  "description": "Chuyên cung cấp dịch vụ du lịch, cho thuê xe và tour trọn gói",
  "workingHours": {
    "monday": "08:00 - 18:00",
    "tuesday": "08:00 - 18:00",
    "wednesday": "08:00 - 18:00",
    "thursday": "08:00 - 18:00",
    "friday": "08:00 - 18:00",
    "saturday": "08:00 - 17:00",
    "sunday": "09:00 - 17:00"
  },
  "socialMedia": {
    "facebook": "https://facebook.com/iccautotravel",
    "instagram": "https://instagram.com/iccautotravel",
    "youtube": "https://youtube.com/iccautotravel"
  }
}', 'vi', true, NOW(), NOW()),
('company-en', 'company_info', 'ICC Auto Travel',
'{
  "name": "ICC Auto Travel Co., Ltd",
  "address": "123 Lang Street, Dong Da District, Hanoi",
  "phone": "+84 24 3765 4321",
  "email": "info@iccautotravel.com",
  "website": "https://iccautotravel.com",
  "description": "Specializing in travel services, car rental and package tours",
  "workingHours": {
    "monday": "08:00 - 18:00",
    "tuesday": "08:00 - 18:00",
    "wednesday": "08:00 - 18:00",
    "thursday": "08:00 - 18:00",
    "friday": "08:00 - 18:00",
    "saturday": "08:00 - 17:00",
    "sunday": "09:00 - 17:00"
  },
  "socialMedia": {
    "facebook": "https://facebook.com/iccautotravel",
    "instagram": "https://instagram.com/iccautotravel",
    "youtube": "https://youtube.com/iccautotravel"
  }
}', 'en', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 6. SERVICES ====================
-- Vehicle Services
INSERT INTO "Service" (id, type, name, description, "isActive", "createdAt", "updatedAt") VALUES
('vehicle-sedan-001', 'VEHICLE', 'Toyota Camry - Sedan 4 chỗ', 'Xe sedan hạng sang, phù hợp cho chuyến đi công tác và gia đình nhỏ', true, NOW(), NOW()),
('vehicle-suv-001', 'VEHICLE', 'Ford Everest - SUV 7 chỗ', 'SUV 7 chỗ rộng rãi, phù hợp cho gia đình và nhóm bạn', true, NOW(), NOW()),
('vehicle-bus-001', 'VEHICLE', 'Hyundai Universe - Xe khách 45 chỗ', 'Xe khách cao cấp dành cho nhóm lớn và tour du lịch', true, NOW(), NOW()),
('tour-halong-001', 'TOUR', 'Tour Vịnh Hạ Long 2N1Đ', 'Khám phá kỳ quan thiên nhiên thế giới Vịnh Hạ Long', true, NOW(), NOW()),
('tour-sapa-001', 'TOUR', 'Tour Sapa Fansipan 3N2Đ', 'Chinh phục nóc nhà Đông Dương và khám phá văn hóa vùng cao', true, NOW(), NOW()),
('hotel-hanoi-001', 'HOTEL', 'Khách sạn Metropole Hà Nội', 'Khách sạn 5 sao trung tâm Hà Nội với lịch sử hơn 100 năm', true, NOW(), NOW()),
('hotel-hoian-001', 'HOTEL', 'Resort Anantara Hội An', 'Resort cao cấp bên sông Thu Bồn, Hội An', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Vehicle Service Details
INSERT INTO "VehicleServiceDetail" (id, "serviceId", "vehicleType", brand, model, "licensePlate", seats, "fuelType", "pricePerDay", "pickupLocation", "pickupLatitude", "pickupLongitude", description, extras, "createdAt", "updatedAt") VALUES
('vehicle-sedan-001-detail', 'vehicle-sedan-001', 'Sedan', 'Toyota', 'Camry 2023', '30A-12345', 4, 'Xăng', 1500000, 'Trung tâm Hà Nội', 21.0285, 105.8542, 'Xe sedan cao cấp với đầy đủ tiện nghi: điều hòa, GPS, ghế da', '{"airConditioning": true, "gps": true, "leatherSeats": true, "bluetooth": true, "usb": true}', NOW(), NOW()),
('vehicle-suv-001-detail', 'vehicle-suv-001', 'SUV', 'Ford', 'Everest 2023', '30A-67890', 7, 'Dầu', 2200000, 'Sân bay Nội Bài', 21.2214, 105.8073, 'SUV 7 chỗ với cốp rộng, phù hợp cho chuyến đi dài', '{"airConditioning": true, "gps": true, "sunroof": true, "thirdRowSeating": true, "largeTrunk": true}', NOW(), NOW()),
('vehicle-bus-001-detail', 'vehicle-bus-001', 'Bus', 'Hyundai', 'Universe Noble 2023', '30B-11111', 45, 'Dầu', 5000000, 'Bến xe Mỹ Đình', 21.0278, 105.7811, 'Xe khách cao cấp với ghế nằm, wifi, tivi', '{"airConditioning": true, "wifi": true, "tv": true, "recliningSeats": true, "restroom": true, "miniBar": true}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Tour Service Details
INSERT INTO "TourServiceDetail" (id, "serviceId", destination, duration, "maxGroupSize", "minGroupSize", difficulty, price, includes, excludes, itinerary, "createdAt", "updatedAt") VALUES
('tour-halong-001-detail', 'tour-halong-001', 'Vịnh Hạ Long, Quảng Ninh', 2, 30, 2, 'Dễ', 2500000, '["Xe đưa đón", "Khách sạn 4*", "Ăn sáng", "Hướng dẫn viên"]', '["Vé máy bay", "Chi phí cá nhân"]', '{"day1": "Hà Nội - Hạ Long - Du thuyền trên vịnh", "day2": "Tham quan động Thiên Cung - Về Hà Nội"}', NOW(), NOW()),
('tour-sapa-001-detail', 'tour-sapa-001', 'Sapa, Lào Cai', 3, 20, 2, 'Trung bình', 3500000, '["Xe đưa đón", "Khách sạn 3*", "Ăn 3 bữa/ngày", "Hướng dẫn viên", "Vé cáp treo"]', '["Vé máy bay", "Đồ uống có cồn", "Chi phí cá nhân"]', '{"day1": "Hà Nội - Sapa - Tham quan Bản Cát Cát", "day2": "Chinh phục đỉnh Fansipan bằng cáp treo", "day3": "Tham quan thác Bạc - Về Hà Nội"}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Hotel Service Details
INSERT INTO "HotelServiceDetail" (id, "serviceId", name, address, "starRating", "checkInTime", "checkOutTime", "pricePerNight", amenities, "roomTypes", "cancellationPolicy", "createdAt", "updatedAt") VALUES
('hotel-hanoi-001-detail', 'hotel-hanoi-001', 'Sofitel Legend Metropole Hanoi', '15 Ngô Quyền, Hoàn Kiếm, Hà Nội', 5, '15:00', '12:00', 8000000, '["Spa", "Bể bơi", "Gym", "Wifi miễn phí", "Dịch vụ phòng 24h"]', '["Superior Room", "Premium Room", "Suite"]', 'Miễn phí hủy trước 24h', NOW(), NOW()),
('hotel-hoian-001-detail', 'hotel-hoian-001', 'Anantara Hoi An Resort', '1 Phạm Hồng Thái, Cẩm An, Hội An', 5, '15:00', '12:00', 6500000, '["Spa", "Bể bơi vô cực", "Gym", "Wifi miễn phí", "Kayak miễn phí"]', '["River View Room", "Garden View Room", "Villa"]', 'Miễn phí hủy trước 48h', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 7. BOOKINGS ====================
INSERT INTO "Booking" (id, "userId", status, "paymentStatus", "totalPrice", "bookingCode", notes, "startDate", "endDate", metadata, "createdAt", "updatedAt") VALUES
('booking-001', 'customer-001', 'CONFIRMED', 'PAID', 7500000, 'ICC-001-2024', 'Khách hàng yêu cầu đón tại sân bay Nội Bài lúc 14:00', '2024-12-20 00:00:00', '2024-12-22 00:00:00', '{"specialRequests": ["Ghế trẻ em", "Wifi"], "emergencyContact": "+84901234571"}', NOW(), NOW()),
('booking-002', 'customer-002', 'PENDING', 'UNPAID', 15000000, 'ICC-002-2024', 'Booking cho công ty, cần hóa đơn VAT', '2024-12-25 00:00:00', '2024-12-27 00:00:00', '{"invoiceRequired": true, "companyInvoice": true, "groupSize": 15}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 8. BANNERS ====================
INSERT INTO "Banner" (id, title, subtitle, description, "imageUrl", "linkUrl", "buttonText", position, type, "isActive", lang, "seoTitle", "seoDescription", "sortOrder", "startDate", "endDate", "createdAt", "updatedAt") VALUES
('banner-hero-001', 'Khám Phá Việt Nam Cùng ICC Auto Travel', 'Dịch vụ du lịch chuyên nghiệp', 'Cho thuê xe, tour trọn gói với giá tốt nhất', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200', '/services', 'Đặt ngay', 'HOMEPAGE', 'HERO', true, 'vi', 'Du lịch Việt Nam - ICC Auto Travel', 'Dịch vụ cho thuê xe và tour du lịch chất lượng cao', 1, NULL, NULL, NOW(), NOW()),
('banner-promo-001', 'Giảm 20% Tour Hạ Long', 'Ưu đãi tháng 12', 'Áp dụng cho đoàn từ 10 người trở lên', 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800', '/tours/halong', 'Xem chi tiết', 'HOMEPAGE', 'PROMOTION', true, 'vi', NULL, NULL, 2, '2024-12-01 00:00:00', '2024-12-31 23:59:59', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 9. BLOG POSTS ====================
INSERT INTO "Blog" (id, title, slug, content, excerpt, lang, status, "authorId", tags, "seoTitle", "seoDescription", "createdAt", "updatedAt") VALUES
('blog-001', '10 Địa Điểm Du Lịch Không Thể Bỏ Qua Ở Việt Nam', '10-dia-diem-du-lich-khong-the-bo-qua-o-viet-nam', 
'<h2>1. Vịnh Hạ Long - Kỳ quan thiên nhiên thế giới</h2><p>Vịnh Hạ Long là một trong những điểm đến không thể bỏ qua khi du lịch Việt Nam...</p><h2>2. Phố cổ Hội An - Di sản văn hóa thế giới</h2><p>Hội An với những ngôi nhà cổ kính, đèn lồng rực rỡ...</p><h2>3. Sapa - Thiên đường mây trắng</h2><p>Sapa nổi tiếng với những thửa ruộng bậc thang tuyệt đẹp...</p>',
'Khám phá 10 địa điểm du lịch tuyệt vời nhất Việt Nam mà bạn không thể bỏ qua', 'vi', 'PUBLISHED', 'staff-001', 
'{"du lịch", "việt nam", "điểm đến"}', '10 Địa Điểm Du Lịch Đẹp Nhất Việt Nam | ICC Auto Travel', 'Khám phá 10 địa điểm du lịch không thể bỏ qua ở Việt Nam cùng ICC Auto Travel', NOW(), NOW()),
('blog-002', 'Kinh Nghiệm Thuê Xe Du Lịch An Toàn', 'kinh-nghiem-thue-xe-du-lich-an-toan',
'<h2>1. Chọn đơn vị cho thuê xe uy tín</h2><p>Việc lựa chọn đơn vị cho thuê xe uy tín là bước đầu tiên...</p><h2>2. Kiểm tra xe cẩn thận trước khi nhận</h2><p>Hãy kiểm tra kỹ tình trạng xe trước khi ký hợp đồng...</p><h2>3. Hiểu rõ điều khoản hợp đồng</h2><p>Đọc kỹ các điều khoản trong hợp đồng thuê xe...</p>',
'Những kinh nghiệm hữu ích khi thuê xe du lịch để có chuyến đi an toàn và tiết kiệm', 'vi', 'PUBLISHED', 'admin-001',
'{"thuê xe", "an toàn", "kinh nghiệm"}', 'Kinh Nghiệm Thuê Xe Du Lịch An Toàn | ICC Auto Travel', 'Chia sẻ kinh nghiệm thuê xe du lịch an toàn và tiết kiệm chi phí', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 10. FAQ ====================
INSERT INTO "FAQ" (id, question, answer, category, lang, "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
('faq-001', 'Làm thế nào để đặt xe?', 'Bạn có thể đặt xe qua website, điện thoại hoặc đến trực tiếp văn phòng của chúng tôi. Quy trình đặt xe rất đơn giản và nhanh chóng.', 'Đặt xe', 'vi', true, 1, NOW(), NOW()),
('faq-002', 'Chi phí thuê xe được tính như thế nào?', 'Chi phí thuê xe phụ thuộc vào loại xe, thời gian thuê, và khoảng cách di chuyển. Chúng tôi có bảng giá công khai và minh bạch.', 'Giá cả', 'vi', true, 2, NOW(), NOW()),
('faq-003', 'Có cần đặt cọc trước không?', 'Có, bạn cần đặt cọc trước 30% tổng giá trị để giữ chỗ. Số tiền còn lại sẽ thanh toán khi nhận xe.', 'Thanh toán', 'vi', true, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 11. NOTIFICATIONS ====================
INSERT INTO "Notification" (id, title, message, type, priority, "userId", "isRead", metadata, "createdAt", "updatedAt") VALUES
('notif-001', 'Đặt xe thành công', 'Đơn đặt xe ICC-001-2024 đã được xác nhận. Xe sẽ đón bạn lúc 14:00 ngày 20/12.', 'BOOKING_CONFIRMATION', 'HIGH', 'customer-001', false, '{"bookingId": "booking-001", "bookingCode": "ICC-001-2024"}', NOW(), NOW()),
('notif-002', 'Chương trình khuyến mãi mới', 'Giảm 20% tour Hạ Long cho đoàn từ 10 người. Ưu đãi có hạn!', 'PROMOTION', 'MEDIUM', 'customer-001', false, '{"promotionCode": "HALONG20", "validUntil": "2024-12-31"}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 12. INVOICES ====================
INSERT INTO "Invoice" (id, "bookingId", "invoiceNumber", "totalAmount", "taxAmount", status, "dueDate", "paidAt", metadata, "createdAt", "updatedAt") VALUES
('invoice-001', 'booking-001', 'ICC-INV-001-2024', 7500000, 750000, 'PAID', '2024-12-15 00:00:00', '2024-12-14 00:00:00',
'{
  "customerName": "Hoàng Thị Khách Hàng",
  "customerAddress": "Hà Nội",
  "items": [
    {
      "name": "Tour Vịnh Hạ Long 2N1Đ",
      "quantity": 1,
      "unitPrice": 7500000,
      "totalPrice": 7500000
    }
  ]
}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 13. PAYMENTS ====================
INSERT INTO "Payment" (id, "bookingId", amount, method, status, "transactionId", metadata, "createdAt", "updatedAt") VALUES
('payment-001', 'booking-001', 7500000, 'BANK_TRANSFER', 'PAID', 'TXN-001-2024',
'{
  "bankName": "Vietcombank",
  "accountNumber": "1234567890",
  "transferNote": "Thanh toan booking ICC-001-2024"
}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 14. SERVICE REVIEWS ====================
INSERT INTO "ServiceReview" (id, "serviceId", "userId", rating, comment, "isApproved", "createdAt", "updatedAt") VALUES
('review-001', 'tour-halong-001', 'customer-001', 5, 'Tour rất tuyệt vời! Hướng dẫn viên nhiệt tình, lịch trình hợp lý. Sẽ quay lại lần sau.', true, NOW(), NOW()),
('review-002', 'vehicle-sedan-001', 'customer-002', 4, 'Xe sạch sẽ, tài xế lịch sự. Dịch vụ tốt, giá cả hợp lý.', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 15. DRIVER REVIEWS ====================
INSERT INTO "DriverReview" (id, "driverId", "userId", rating, comment, "tripDate", "createdAt", "updatedAt") VALUES
('driver-review-001', 'driver-001', 'customer-001', 5, 'Tài xế lái xe an toàn, đúng giờ, rất thân thiện và nhiệt tình.', '2024-12-20 00:00:00', NOW(), NOW()),
('driver-review-002', 'driver-002', 'customer-002', 4, 'Dịch vụ tốt, xe sạch sẽ. Tài xế có kinh nghiệm.', '2024-12-18 00:00:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 16. NEWSLETTER ====================
INSERT INTO "Newsletter" (id, email, status, "subscribedAt", "createdAt", "updatedAt") VALUES
('newsletter-001', 'customer1@example.com', 'SUBSCRIBED', NOW(), NOW(), NOW()),
('newsletter-002', 'customer2@example.com', 'SUBSCRIBED', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== 17. CONTACTS ====================
INSERT INTO "Contact" (id, name, email, phone, subject, message, status, "userId", response, "responseAt", "createdAt", "updatedAt") VALUES
('contact-001', 'Nguyễn Văn A', 'nguyenvana@example.com', '+84901234567', 'Hỏi giá tour Sapa', 'Tôi muốn hỏi giá tour Sapa 3 ngày 2 đêm cho 4 người.', 'NEW', 'customer-001', NULL, NULL, NOW(), NOW()),
('contact-002', 'Trần Thị B', 'tranthib@example.com', '+84901234568', 'Thuê xe đi Đà Nẵng', 'Tôi cần thuê xe 7 chỗ đi Đà Nẵng 5 ngày.', 'RESPONDED', NULL, 'Cảm ơn bạn đã liên hệ. Chúng tôi sẽ gửi báo giá trong 24h.', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- SUMMARY
-- ================================================================
/*
✅ Dữ liệu đã tạo thành công:

📋 ROLES & PERMISSIONS:
- 4 Roles: Admin, Staff, Driver, Customer
- 8 Permissions cơ bản

📍 LOCATIONS:
- 7 địa điểm: Hà Nội, TP.HCM, Đà Nẵng, 2 sân bay, 2 điểm du lịch

👥 USERS:
- 6 users: 1 Admin, 1 Staff, 2 Drivers, 2 Customers
- Password cho tất cả: Admin123!

🏢 COMPANY INFO:
- Thông tin công ty bằng tiếng Việt và tiếng Anh

🚗 SERVICES:
- 7 dịch vụ: 3 Vehicle, 2 Tour, 2 Hotel
- Đầy đủ chi tiết cho từng loại dịch vụ

📋 BOOKINGS:
- 2 booking mẫu với trạng thái khác nhau

🎨 BANNERS:
- 2 banner: Hero và Promotion

📝 BLOG:
- 2 bài viết về du lịch Việt Nam

❓ FAQ:
- 3 câu hỏi thường gặp

🔔 NOTIFICATIONS:
- 2 thông báo mẫu

🧾 INVOICES & PAYMENTS:
- 1 hóa đơn và thanh toán hoàn tất

⭐ REVIEWS:
- 4 đánh giá: 2 service, 2 driver

📧 NEWSLETTER & CONTACTS:
- 2 newsletter subscriber
- 2 contact message

🎉 Database sẵn sàng cho phát triển!
*/
</rewritten_file>