import { InputType, PartialType } from '@nestjs/graphql';
import { CreateItineraryDto } from './create-itinerary.dto';

@InputType()
export class UpdateItineraryDto extends PartialType(CreateItineraryDto) {}
