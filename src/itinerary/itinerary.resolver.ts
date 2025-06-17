import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ItineraryService } from './itinerary.service';
import { GraphQLJwtAuthGuard } from '../auth/guards/graphql-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { ItineraryEntity } from './entities/itinerary.entity';
import { ItineraryResponseEntity } from './entities/itinerary-response.entity';

@Resolver(() => ItineraryEntity)
export class ItineraryResolver {
  constructor(private readonly itineraryService: ItineraryService) {}

  @Mutation(() => ItineraryResponseEntity)
  @UseGuards(GraphQLJwtAuthGuard)
  async generateItinerary(
    @Args('input') createItineraryDto: CreateItineraryDto,
    @CurrentUser() user: User,
  ): Promise<ItineraryResponseEntity> {
    return this.itineraryService.generateItinerary(createItineraryDto);
  }

  @Query(() => [ItineraryEntity])
  @UseGuards(GraphQLJwtAuthGuard)
  async itineraries(@CurrentUser() user: User): Promise<ItineraryEntity[]> {
    return this.itineraryService.findAll(user.id);
  }

  @Query(() => ItineraryEntity)
  @UseGuards(GraphQLJwtAuthGuard)
  async itinerary(@Args('id') id: string): Promise<ItineraryEntity> {
    return this.itineraryService.findOne(id);
  }

  @Mutation(() => ItineraryEntity)
  @UseGuards(GraphQLJwtAuthGuard)
  async updateItinerary(
    @Args('id') id: string,
    @Args('input') updateItineraryDto: UpdateItineraryDto,
  ): Promise<ItineraryEntity> {
    return this.itineraryService.update(id, updateItineraryDto);
  }

  @Mutation(() => ItineraryEntity)
  @UseGuards(GraphQLJwtAuthGuard)
  async removeItinerary(@Args('id') id: string): Promise<ItineraryEntity> {
    return this.itineraryService.remove(id);
  }
}
