// Interfaces cho ServiceReview
export interface ServiceReviewWhereUniqueInput {
  id?: string;
  serviceId_userId_bookingId?: {
    serviceId: string;
    userId: string;
    bookingId?: string;
  };
}

export interface ServiceReviewWhereInput {
  id?: { equals?: string } | string;
  serviceId?: { equals?: string } | string;
  userId?: { equals?: string } | string;
  bookingId?: { equals?: string } | string | null;
  status?: { equals?: string } | string;
  rating?: { equals?: number } | number | { gte?: number; lte?: number };
  [key: string]: any;
}

export interface ServiceReviewOrderByWithRelationInput {
  id?: 'asc' | 'desc';
  createdAt?: 'asc' | 'desc';
  updatedAt?: 'asc' | 'desc';
  rating?: 'asc' | 'desc';
  [key: string]: any;
}

export interface ServiceReviewInclude {
  service?: boolean;
  user?: boolean;
  booking?: boolean;
  [key: string]: any;
}

export interface ServiceReviewCreateInput {
  id: string;
  serviceId: string;
  userId: string;
  bookingId?: string;
  rating: number;
  comment?: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}

export interface ServiceReviewUpdateInput {
  rating?: number;
  comment?: string;
  status?: string;
  updatedAt?: Date;
  [key: string]: any;
}
