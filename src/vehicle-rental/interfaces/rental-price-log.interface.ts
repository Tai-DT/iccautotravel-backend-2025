// Interface cho RentalPriceLog
export interface RentalPriceLogWhereInput {
  id?: string | { equals?: string };
  vehicleTypeId?: string | { equals?: string };
  regionId?: string | { equals?: string } | null;
  userId?: string | { equals?: string };
  priceDate?: Date | { gte?: Date; lte?: Date };
  createdAt?: Date | { gte?: Date; lte?: Date };
  [key: string]: any;
}

export interface RentalPriceLogOrderByWithRelationInput {
  id?: 'asc' | 'desc';
  vehicleTypeId?: 'asc' | 'desc';
  regionId?: 'asc' | 'desc';
  price?: 'asc' | 'desc';
  priceDate?: 'asc' | 'desc';
  createdAt?: 'asc' | 'desc';
  [key: string]: any;
}
