-- CreateEnum
CREATE TYPE "DriverApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('BUS', 'COMBO', 'FAST_TRACK', 'FLIGHT', 'HOTEL', 'INSURANCE', 'TOUR', 'TRANSFER', 'VEHICLE', 'VISA', 'VEHICLE_RENTAL', 'VEHICLE_TICKET');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'UNPAID', 'PARTIALLY_PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "FileCategory" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "BannerPosition" AS ENUM ('HOMEPAGE', 'SEARCH_RESULTS', 'DETAIL_PAGE', 'SIDEBAR');

-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('HERO', 'SLIDER', 'PROMO', 'ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'PROCESSING', 'RESOLVED', 'CLOSED', 'IN_PROGRESS', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "ItineraryStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "NewsletterStatus" AS ENUM ('ACTIVE', 'UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('CITY', 'PROVINCE', 'DISTRICT', 'WARD', 'LANDMARK', 'AIRPORT', 'HOTEL', 'RESTAURANT', 'ATTRACTION', 'OTHER', 'COUNTRY', 'REGION', 'COMMUNE', 'BEACH', 'MOUNTAIN', 'TEMPLE', 'MUSEUM', 'PARK', 'SHOPPING_MALL', 'MARKET', 'BUS_STATION', 'TRAIN_STATION', 'FERRY_TERMINAL', 'BORDER_CROSSING', 'SCENIC_SPOT', 'CULTURAL_SITE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'BOOKING', 'PAYMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "roleId" TEXT NOT NULL DEFAULT 'default_user_role_id',
    "customerType" TEXT,
    "taxCode" TEXT,
    "companyName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "phone" TEXT,
    "language" TEXT NOT NULL DEFAULT 'vi',
    "bio" TEXT,
    "driverStatus" "DriverApprovalStatus",
    "experience" INTEGER,
    "languages" TEXT[],
    "licenseClass" TEXT,
    "licenseExpiry" TIMESTAMP(3),
    "licenseNumber" TEXT,
    "rating" DECIMAL(3,2),
    "supabaseId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "type" "ServiceType" NOT NULL,
    "name" TEXT NOT NULL,
    "metadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "audioFileFemaleId" TEXT,
    "audioFileMaleId" TEXT,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bookingCode" TEXT NOT NULL,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "metadata" JSONB,
    "vehicleId" TEXT,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" "FileCategory" NOT NULL DEFAULT 'IMAGE',
    "durationSec" INTEGER,
    "fileName" TEXT NOT NULL,
    "metadata" JSONB,
    "mimeType" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleServiceDetail" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT NOT NULL,
    "licensePlate" TEXT,
    "seats" INTEGER NOT NULL,
    "fuelType" TEXT,
    "pricePerDay" DECIMAL(10,2) NOT NULL,
    "extras" JSONB,
    "pickupLocation" TEXT,
    "pickupLatitude" DOUBLE PRECISION,
    "pickupLongitude" DOUBLE PRECISION,
    "dropoffLocation" TEXT,
    "dropoffLatitude" DOUBLE PRECISION,
    "dropoffLongitude" DOUBLE PRECISION,
    "description" TEXT,

    CONSTRAINT "VehicleServiceDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "buttonText" TEXT,
    "position" "BannerPosition" NOT NULL DEFAULT 'HOMEPAGE',
    "type" "BannerType" NOT NULL DEFAULT 'HERO',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "lang" TEXT NOT NULL DEFAULT 'vi',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "lang" TEXT NOT NULL DEFAULT 'vi',
    "status" "BlogStatus" NOT NULL DEFAULT 'DRAFT',
    "authorId" TEXT NOT NULL,
    "categoryId" TEXT,
    "tags" TEXT[],
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "featuredImageId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "audioFileFemaleId" TEXT,
    "audioFileMaleId" TEXT,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "lang" TEXT NOT NULL DEFAULT 'vi',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "handledBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "txnRef" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "status" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "paymentMethod" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyInfo" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'vi',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "audioFileFemaleId" TEXT,
    "audioFileMaleId" TEXT,

    CONSTRAINT "CompanyInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOConfig" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "keywords" TEXT[],
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "twitterCard" TEXT DEFAULT 'summary_large_image',
    "twitterTitle" TEXT,
    "twitterDescription" TEXT,
    "twitterImage" TEXT,
    "canonicalUrl" TEXT,
    "lang" TEXT NOT NULL DEFAULT 'vi',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEOConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'vi',
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "audioFileFemaleId" TEXT,
    "audioFileMaleId" TEXT,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Itinerary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "startDate" DATE,
    "endDate" DATE,
    "preferences" JSONB,
    "budget" DECIMAL(12,2),
    "status" "ItineraryStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Itinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leg" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "description" TEXT,
    "distanceKm" DECIMAL(10,2),
    "durationMin" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Leg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POI" (
    "id" TEXT NOT NULL,
    "legId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "description" TEXT,
    "type" TEXT,
    "openingHours" JSONB,
    "contactInfo" JSONB,
    "website" TEXT,
    "photoUrl" TEXT,
    "timeSpentMin" INTEGER,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "POI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "serviceId" TEXT,
    "description" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Newsletter" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "NewsletterStatus" NOT NULL DEFAULT 'ACTIVE',
    "preferences" JSONB,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Newsletter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "pdfUrl" TEXT,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoiceCode" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComboServiceDetail" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "comboPrice" DECIMAL(12,2) NOT NULL,
    "discountPercent" DECIMAL(5,2),
    "validityFrom" TIMESTAMP(3),
    "validityTo" TIMESTAMP(3),
    "description" TEXT,

    CONSTRAINT "ComboServiceDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FastTrackServiceDetail" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "airportCode" TEXT NOT NULL,
    "serviceLevel" TEXT NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "description" TEXT,

    CONSTRAINT "FastTrackServiceDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlightServiceDetail" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "airline" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "depAirportCode" TEXT NOT NULL,
    "arrAirportCode" TEXT NOT NULL,
    "depTime" TIMESTAMP(3) NOT NULL,
    "arrTime" TIMESTAMP(3) NOT NULL,
    "durationInMinutes" INTEGER,
    "fareClass" TEXT NOT NULL,
    "baggageAllowance" TEXT,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "description" TEXT,

    CONSTRAINT "FlightServiceDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelServiceDetail" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "hotelName" TEXT NOT NULL,
    "starRating" SMALLINT NOT NULL,
    "roomType" TEXT NOT NULL,
    "boardType" TEXT,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "taxPercent" DECIMAL(5,2),
    "amenities" TEXT[],
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "checkInTime" TEXT,
    "checkOutTime" TEXT,
    "description" TEXT,

    CONSTRAINT "HotelServiceDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceServiceDetail" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "insurer" TEXT NOT NULL,
    "planCode" TEXT NOT NULL,
    "coverageDetails" JSONB NOT NULL,
    "premiumAmount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,

    CONSTRAINT "InsuranceServiceDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourServiceDetail" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "tourCode" TEXT NOT NULL,
    "itinerary" JSONB,
    "departureDates" TIMESTAMP(3)[],
    "adultPrice" DECIMAL(12,2) NOT NULL,
    "childPrice" DECIMAL(12,2),
    "seatsAvailable" INTEGER NOT NULL,
    "minPax" INTEGER,
    "maxPax" INTEGER,
    "durationInDays" INTEGER,
    "description" TEXT,

    CONSTRAINT "TourServiceDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferServiceDetail" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "fromLocation" TEXT NOT NULL,
    "toLocation" TEXT NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "maxPassengers" INTEGER,
    "description" TEXT,

    CONSTRAINT "TransferServiceDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisaServiceDetail" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "visaType" TEXT NOT NULL,
    "targetCountry" TEXT NOT NULL,
    "serviceLevel" TEXT,
    "processingFee" DECIMAL(10,2) NOT NULL,
    "serviceCharge" DECIMAL(10,2) NOT NULL,
    "description" TEXT,

    CONSTRAINT "VisaServiceDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusServiceDetail" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "busCompany" TEXT NOT NULL,
    "busType" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "departureStation" TEXT NOT NULL,
    "arrivalStation" TEXT NOT NULL,
    "departureCity" TEXT NOT NULL,
    "arrivalCity" TEXT NOT NULL,
    "departureTime" TEXT NOT NULL,
    "arrivalTime" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "seatType" TEXT NOT NULL,
    "features" TEXT[],
    "pickupPoints" TEXT[],
    "dropoffPoints" TEXT[],
    "operatingDays" TEXT[],
    "amenities" TEXT[],
    "driverName" TEXT,
    "driverPhone" TEXT,
    "vehicleLicensePlate" TEXT,
    "vehicleModel" TEXT,
    "description" TEXT,

    CONSTRAINT "BusServiceDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverReview" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverRating" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "averageRating" DECIMAL(3,2) NOT NULL,
    "totalReviews" INTEGER NOT NULL,
    "oneStarCount" INTEGER NOT NULL,
    "twoStarCount" INTEGER NOT NULL,
    "threeStarCount" INTEGER NOT NULL,
    "fourStarCount" INTEGER NOT NULL,
    "fiveStarCount" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleRentalPrice" (
    "id" TEXT NOT NULL,
    "vehicleTypeId" TEXT NOT NULL,
    "routeId" TEXT,
    "pricePerDay" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "VehicleRentalPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "fromLocation" TEXT NOT NULL,
    "toLocation" TEXT NOT NULL,
    "distanceKm" DECIMAL(10,2) NOT NULL,
    "estimatedTimeMin" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehiclePricePerKm" (
    "id" TEXT NOT NULL,
    "vehicleTypeId" TEXT NOT NULL,
    "pricePerKm" DECIMAL(10,2) NOT NULL,
    "minKm" INTEGER,
    "maxKm" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VehiclePricePerKm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceReview" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRating" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "averageRating" DECIMAL(3,2) NOT NULL,
    "totalReviews" INTEGER NOT NULL,
    "oneStarCount" INTEGER NOT NULL,
    "twoStarCount" INTEGER NOT NULL,
    "threeStarCount" INTEGER NOT NULL,
    "fourStarCount" INTEGER NOT NULL,
    "fiveStarCount" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalPriceLog" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "rentalPrice" DECIMAL(10,2) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalPriceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdditionalService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bookingId" TEXT,

    CONSTRAINT "AdditionalService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "description" TEXT,
    "imageUrl" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "openingHours" JSONB,
    "closingHours" JSONB,
    "website" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingServices" (
    "bookingId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "BookingServices_pkey" PRIMARY KEY ("bookingId","serviceId")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleLayout" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "layoutName" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "hasMultipleFloors" BOOLEAN NOT NULL DEFAULT false,
    "totalFloors" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleSeat" (
    "id" TEXT NOT NULL,
    "vehicleLayoutId" TEXT NOT NULL,
    "seatNumber" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "column" TEXT NOT NULL,
    "floor" INTEGER,
    "seatType" TEXT NOT NULL DEFAULT 'STANDARD',
    "position" TEXT NOT NULL DEFAULT 'MIDDLE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "price" DECIMAL(10,2) NOT NULL DEFAULT 100000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleSeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleRoute" (
    "id" TEXT NOT NULL,
    "routeName" TEXT NOT NULL,
    "departureCity" TEXT NOT NULL,
    "arrivalCity" TEXT NOT NULL,
    "departureStation" TEXT NOT NULL,
    "arrivalStation" TEXT NOT NULL,
    "distance" DECIMAL(8,2) NOT NULL,
    "estimatedDuration" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleSchedule" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "departureTime" TEXT NOT NULL,
    "arrivalTime" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "driverPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "basePrice" DECIMAL(10,2) NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "bookedSeats" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatBooking" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "vehicleSeatId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "passengerName" TEXT NOT NULL,
    "passengerPhone" TEXT,
    "passengerIdNumber" TEXT,
    "passengerAge" INTEGER,
    "passengerGender" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    "departureDate" TIMESTAMP(3) NOT NULL,
    "departureTime" TEXT NOT NULL,
    "reservedUntil" TIMESTAMP(3),
    "specialRequests" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeatBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RolePermissions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RolePermissions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseId_key" ON "User"("supabaseId");

-- CreateIndex
CREATE INDEX "Service_type_idx" ON "Service"("type");

-- CreateIndex
CREATE INDEX "Service_name_idx" ON "Service"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingCode_key" ON "Booking"("bookingCode");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_paymentStatus_idx" ON "Booking"("paymentStatus");

-- CreateIndex
CREATE INDEX "Booking_vehicleId_idx" ON "Booking"("vehicleId");

-- CreateIndex
CREATE INDEX "Booking_startDate_idx" ON "Booking"("startDate");

-- CreateIndex
CREATE INDEX "Booking_endDate_idx" ON "Booking"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "File_url_key" ON "File"("url");

-- CreateIndex
CREATE UNIQUE INDEX "File_objectKey_key" ON "File"("objectKey");

-- CreateIndex
CREATE INDEX "File_category_idx" ON "File"("category");

-- CreateIndex
CREATE INDEX "File_objectKey_idx" ON "File"("objectKey");

-- CreateIndex
CREATE INDEX "File_uploaderId_idx" ON "File"("uploaderId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleServiceDetail_serviceId_key" ON "VehicleServiceDetail"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleServiceDetail_licensePlate_key" ON "VehicleServiceDetail"("licensePlate");

-- CreateIndex
CREATE INDEX "Banner_isActive_idx" ON "Banner"("isActive");

-- CreateIndex
CREATE INDEX "Banner_lang_idx" ON "Banner"("lang");

-- CreateIndex
CREATE INDEX "Banner_position_idx" ON "Banner"("position");

-- CreateIndex
CREATE INDEX "Banner_sortOrder_idx" ON "Banner"("sortOrder");

-- CreateIndex
CREATE INDEX "Banner_type_idx" ON "Banner"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Blog_slug_key" ON "Blog"("slug");

-- CreateIndex
CREATE INDEX "Blog_authorId_idx" ON "Blog"("authorId");

-- CreateIndex
CREATE INDEX "Blog_status_idx" ON "Blog"("status");

-- CreateIndex
CREATE INDEX "Blog_lang_idx" ON "Blog"("lang");

-- CreateIndex
CREATE INDEX "Blog_slug_idx" ON "Blog"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_slug_key" ON "BlogCategory"("slug");

-- CreateIndex
CREATE INDEX "BlogCategory_lang_idx" ON "BlogCategory"("lang");

-- CreateIndex
CREATE INDEX "BlogCategory_slug_idx" ON "BlogCategory"("slug");

-- CreateIndex
CREATE INDEX "Contact_status_idx" ON "Contact"("status");

-- CreateIndex
CREATE INDEX "Contact_email_idx" ON "Contact"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_txnRef_key" ON "Payment"("txnRef");

-- CreateIndex
CREATE INDEX "Payment_bookingId_idx" ON "Payment"("bookingId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_provider_idx" ON "Payment"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyInfo_key_key" ON "CompanyInfo"("key");

-- CreateIndex
CREATE INDEX "CompanyInfo_lang_idx" ON "CompanyInfo"("lang");

-- CreateIndex
CREATE INDEX "CompanyInfo_key_idx" ON "CompanyInfo"("key");

-- CreateIndex
CREATE UNIQUE INDEX "SEOConfig_page_key" ON "SEOConfig"("page");

-- CreateIndex
CREATE INDEX "SEOConfig_lang_idx" ON "SEOConfig"("lang");

-- CreateIndex
CREATE INDEX "SEOConfig_isActive_idx" ON "SEOConfig"("isActive");

-- CreateIndex
CREATE INDEX "SEOConfig_page_idx" ON "SEOConfig"("page");

-- CreateIndex
CREATE INDEX "FAQ_category_idx" ON "FAQ"("category");

-- CreateIndex
CREATE INDEX "FAQ_isActive_idx" ON "FAQ"("isActive");

-- CreateIndex
CREATE INDEX "FAQ_lang_idx" ON "FAQ"("lang");

-- CreateIndex
CREATE INDEX "Itinerary_userId_idx" ON "Itinerary"("userId");

-- CreateIndex
CREATE INDEX "Itinerary_status_idx" ON "Itinerary"("status");

-- CreateIndex
CREATE INDEX "Leg_itineraryId_idx" ON "Leg"("itineraryId");

-- CreateIndex
CREATE INDEX "Leg_dayNumber_idx" ON "Leg"("dayNumber");

-- CreateIndex
CREATE INDEX "POI_legId_idx" ON "POI"("legId");

-- CreateIndex
CREATE INDEX "POI_type_idx" ON "POI"("type");

-- CreateIndex
CREATE INDEX "Suggestion_itineraryId_idx" ON "Suggestion"("itineraryId");

-- CreateIndex
CREATE INDEX "Suggestion_serviceType_idx" ON "Suggestion"("serviceType");

-- CreateIndex
CREATE UNIQUE INDEX "Newsletter_email_key" ON "Newsletter"("email");

-- CreateIndex
CREATE INDEX "Newsletter_email_idx" ON "Newsletter"("email");

-- CreateIndex
CREATE INDEX "Newsletter_status_idx" ON "Newsletter"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_bookingId_key" ON "Invoice"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceCode_key" ON "Invoice"("invoiceCode");

-- CreateIndex
CREATE INDEX "Invoice_bookingId_idx" ON "Invoice"("bookingId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ComboServiceDetail_serviceId_key" ON "ComboServiceDetail"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "FastTrackServiceDetail_serviceId_key" ON "FastTrackServiceDetail"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "FlightServiceDetail_serviceId_key" ON "FlightServiceDetail"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "HotelServiceDetail_serviceId_key" ON "HotelServiceDetail"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceServiceDetail_serviceId_key" ON "InsuranceServiceDetail"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "TourServiceDetail_serviceId_key" ON "TourServiceDetail"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "TourServiceDetail_tourCode_key" ON "TourServiceDetail"("tourCode");

-- CreateIndex
CREATE UNIQUE INDEX "TransferServiceDetail_serviceId_key" ON "TransferServiceDetail"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "VisaServiceDetail_serviceId_key" ON "VisaServiceDetail"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "BusServiceDetail_serviceId_key" ON "BusServiceDetail"("serviceId");

-- CreateIndex
CREATE INDEX "DriverReview_driverId_idx" ON "DriverReview"("driverId");

-- CreateIndex
CREATE INDEX "DriverReview_userId_idx" ON "DriverReview"("userId");

-- CreateIndex
CREATE INDEX "DriverReview_rating_idx" ON "DriverReview"("rating");

-- CreateIndex
CREATE INDEX "DriverReview_status_idx" ON "DriverReview"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DriverRating_driverId_key" ON "DriverRating"("driverId");

-- CreateIndex
CREATE INDEX "VehicleRentalPrice_vehicleTypeId_idx" ON "VehicleRentalPrice"("vehicleTypeId");

-- CreateIndex
CREATE INDEX "VehicleRentalPrice_routeId_idx" ON "VehicleRentalPrice"("routeId");

-- CreateIndex
CREATE INDEX "VehicleRentalPrice_isActive_idx" ON "VehicleRentalPrice"("isActive");

-- CreateIndex
CREATE INDEX "Route_fromLocation_idx" ON "Route"("fromLocation");

-- CreateIndex
CREATE INDEX "Route_toLocation_idx" ON "Route"("toLocation");

-- CreateIndex
CREATE INDEX "VehiclePricePerKm_vehicleTypeId_idx" ON "VehiclePricePerKm"("vehicleTypeId");

-- CreateIndex
CREATE INDEX "VehiclePricePerKm_isActive_idx" ON "VehiclePricePerKm"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RentalConfig_key_key" ON "RentalConfig"("key");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_operation_idx" ON "AuditLog"("operation");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "ServiceReview_serviceId_idx" ON "ServiceReview"("serviceId");

-- CreateIndex
CREATE INDEX "ServiceReview_userId_idx" ON "ServiceReview"("userId");

-- CreateIndex
CREATE INDEX "ServiceReview_rating_idx" ON "ServiceReview"("rating");

-- CreateIndex
CREATE INDEX "ServiceReview_status_idx" ON "ServiceReview"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRating_serviceId_key" ON "ServiceRating"("serviceId");

-- CreateIndex
CREATE INDEX "RentalPriceLog_vehicleId_idx" ON "RentalPriceLog"("vehicleId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_priority_idx" ON "Notification"("priority");

-- CreateIndex
CREATE INDEX "Location_name_idx" ON "Location"("name");

-- CreateIndex
CREATE INDEX "Location_type_idx" ON "Location"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE INDEX "VehicleLayout_vehicleId_idx" ON "VehicleLayout"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleLayout_isActive_idx" ON "VehicleLayout"("isActive");

-- CreateIndex
CREATE INDEX "VehicleSeat_vehicleLayoutId_idx" ON "VehicleSeat"("vehicleLayoutId");

-- CreateIndex
CREATE INDEX "VehicleSeat_seatNumber_idx" ON "VehicleSeat"("seatNumber");

-- CreateIndex
CREATE INDEX "VehicleSeat_floor_row_column_idx" ON "VehicleSeat"("floor", "row", "column");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleSeat_vehicleLayoutId_seatNumber_floor_key" ON "VehicleSeat"("vehicleLayoutId", "seatNumber", "floor");

-- CreateIndex
CREATE INDEX "VehicleRoute_departureCity_arrivalCity_idx" ON "VehicleRoute"("departureCity", "arrivalCity");

-- CreateIndex
CREATE INDEX "VehicleRoute_isActive_idx" ON "VehicleRoute"("isActive");

-- CreateIndex
CREATE INDEX "VehicleSchedule_vehicleId_idx" ON "VehicleSchedule"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleSchedule_routeId_idx" ON "VehicleSchedule"("routeId");

-- CreateIndex
CREATE INDEX "VehicleSchedule_departureDate_idx" ON "VehicleSchedule"("departureDate");

-- CreateIndex
CREATE INDEX "VehicleSchedule_status_idx" ON "VehicleSchedule"("status");

-- CreateIndex
CREATE INDEX "SeatBooking_scheduleId_idx" ON "SeatBooking"("scheduleId");

-- CreateIndex
CREATE INDEX "SeatBooking_vehicleSeatId_idx" ON "SeatBooking"("vehicleSeatId");

-- CreateIndex
CREATE INDEX "SeatBooking_bookingId_idx" ON "SeatBooking"("bookingId");

-- CreateIndex
CREATE INDEX "SeatBooking_departureDate_idx" ON "SeatBooking"("departureDate");

-- CreateIndex
CREATE INDEX "SeatBooking_status_idx" ON "SeatBooking"("status");

-- CreateIndex
CREATE INDEX "SeatBooking_reservedUntil_idx" ON "SeatBooking"("reservedUntil");

-- CreateIndex
CREATE INDEX "_RolePermissions_B_index" ON "_RolePermissions"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_audioFileFemaleId_fkey" FOREIGN KEY ("audioFileFemaleId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_audioFileMaleId_fkey" FOREIGN KEY ("audioFileMaleId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleServiceDetail" ADD CONSTRAINT "VehicleServiceDetail_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_audioFileFemaleId_fkey" FOREIGN KEY ("audioFileFemaleId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_audioFileMaleId_fkey" FOREIGN KEY ("audioFileMaleId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_handledBy_fkey" FOREIGN KEY ("handledBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyInfo" ADD CONSTRAINT "CompanyInfo_audioFileFemaleId_fkey" FOREIGN KEY ("audioFileFemaleId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyInfo" ADD CONSTRAINT "CompanyInfo_audioFileMaleId_fkey" FOREIGN KEY ("audioFileMaleId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FAQ" ADD CONSTRAINT "FAQ_audioFileFemaleId_fkey" FOREIGN KEY ("audioFileFemaleId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FAQ" ADD CONSTRAINT "FAQ_audioFileMaleId_fkey" FOREIGN KEY ("audioFileMaleId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Itinerary" ADD CONSTRAINT "Itinerary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leg" ADD CONSTRAINT "Leg_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POI" ADD CONSTRAINT "POI_legId_fkey" FOREIGN KEY ("legId") REFERENCES "Leg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboServiceDetail" ADD CONSTRAINT "ComboServiceDetail_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FastTrackServiceDetail" ADD CONSTRAINT "FastTrackServiceDetail_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightServiceDetail" ADD CONSTRAINT "FlightServiceDetail_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelServiceDetail" ADD CONSTRAINT "HotelServiceDetail_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceServiceDetail" ADD CONSTRAINT "InsuranceServiceDetail_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourServiceDetail" ADD CONSTRAINT "TourServiceDetail_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferServiceDetail" ADD CONSTRAINT "TransferServiceDetail_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisaServiceDetail" ADD CONSTRAINT "VisaServiceDetail_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusServiceDetail" ADD CONSTRAINT "BusServiceDetail_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverReview" ADD CONSTRAINT "DriverReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverReview" ADD CONSTRAINT "DriverReview_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverRating" ADD CONSTRAINT "DriverRating_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleRentalPrice" ADD CONSTRAINT "VehicleRentalPrice_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "VehicleType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleRentalPrice" ADD CONSTRAINT "VehicleRentalPrice_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePricePerKm" ADD CONSTRAINT "VehiclePricePerKm_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "VehicleType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceReview" ADD CONSTRAINT "ServiceReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceReview" ADD CONSTRAINT "ServiceReview_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRating" ADD CONSTRAINT "ServiceRating_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdditionalService" ADD CONSTRAINT "AdditionalService_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingServices" ADD CONSTRAINT "BookingServices_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingServices" ADD CONSTRAINT "BookingServices_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleSeat" ADD CONSTRAINT "VehicleSeat_vehicleLayoutId_fkey" FOREIGN KEY ("vehicleLayoutId") REFERENCES "VehicleLayout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleSchedule" ADD CONSTRAINT "VehicleSchedule_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "VehicleRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatBooking" ADD CONSTRAINT "SeatBooking_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "VehicleSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatBooking" ADD CONSTRAINT "SeatBooking_vehicleSeatId_fkey" FOREIGN KEY ("vehicleSeatId") REFERENCES "VehicleSeat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RolePermissions" ADD CONSTRAINT "_RolePermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RolePermissions" ADD CONSTRAINT "_RolePermissions_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
