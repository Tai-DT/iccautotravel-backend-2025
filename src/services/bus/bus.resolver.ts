import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { BusService } from './bus.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { ServiceEntity } from '../entities/service.entity';

@Resolver(() => ServiceEntity)
export class BusResolver {
  constructor(private readonly busService: BusService) {}

  @Mutation(() => ServiceEntity)
  async createBus(@Args('createBusInput') createBusDto: CreateBusDto) {
    return this.busService.create(createBusDto);
  }

  @Query(() => [ServiceEntity], { name: 'buses' })
  async findAllBuses() {
    return this.busService.findAll();
  }

  @Query(() => ServiceEntity, { name: 'bus' })
  async findOneBus(@Args('id', { type: () => ID }) id: string) {
    return this.busService.findOne(id);
  }

  @Query(() => [ServiceEntity], { name: 'busesByRoute' })
  async findBusesByRoute(
    @Args('origin') origin: string,
    @Args('destination') destination: string,
  ) {
    return this.busService.findByRoute(origin, destination);
  }

  @Mutation(() => ServiceEntity)
  async updateBus(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateBusInput') updateBusDto: UpdateBusDto,
  ) {
    return this.busService.update(id, updateBusDto);
  }

  @Mutation(() => ServiceEntity)
  async removeBus(@Args('id', { type: () => ID }) id: string) {
    return this.busService.remove(id);
  }
}
