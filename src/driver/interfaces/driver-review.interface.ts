// Interfaces cho DriverReview service
export interface DriverReviewWhereUniqueInput {
  id?: string;
  driverId_userId_bookingId?: {
    driverId: string;
    userId: string;
    bookingId?: string;
  };
}

export interface DriverReviewWhereInput {
  id?: { equals?: string } | string;
  driverId?: { equals?: string } | string;
  userId?: { equals?: string } | string;
  bookingId?: { equals?: string } | string | null;
  status?: { equals?: string } | string;
  rating?: { equals?: number } | number | { gte?: number; lte?: number };
  [key: string]: any;
}

export interface DriverReviewOrderByWithRelationInput {
  id?: 'asc' | 'desc';
  createdAt?: 'asc' | 'desc';
  updatedAt?: 'asc' | 'desc';
  rating?: 'asc' | 'desc';
  [key: string]: any;
}

export interface DriverReviewInclude {
  driver?: boolean;
  user?: boolean;
  booking?: boolean;
  [key: string]: any;
}

export interface DriverReviewCreateInput {
  id: string;
  driverId: string;
  userId: string;
  bookingId?: string;
  rating: number;
  comment?: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}

export interface DriverReviewUpdateInput {
  rating?: number;
  comment?: string;
  status?: string;
  updatedAt?: Date;
  [key: string]: any;
}
