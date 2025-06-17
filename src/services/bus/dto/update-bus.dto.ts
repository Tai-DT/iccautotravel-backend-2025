import { InputType, PartialType } from '@nestjs/graphql';
import { CreateBusDto } from './create-bus.dto';

@InputType()
export class UpdateBusDto extends PartialType(CreateBusDto) {}
