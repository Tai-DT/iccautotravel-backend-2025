import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { VisaService } from './visa.service';
import { ServiceEntity } from '../entities/service.entity';
import { CreateVisaServiceInput } from './dto/create-visa-service.input'; // Use specific DTO
import { UpdateVisaServiceInput } from './dto/update-visa-service.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { ROLE_NAMES } from '../../common/constants/roles';

@Resolver(() => ServiceEntity) // Associate with the generic ServiceEntity for now
@UseGuards(JwtAuthGuard, RolesGuard) // Apply guards to all endpoints in this resolver
export class VisaResolver {
  constructor(private readonly visaService: VisaService) {}

  @Mutation(() => ServiceEntity)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF) // Only ADMIN and STAFF can create Visa services
  createVisaService(
    @Args('createVisaServiceInput')
    createVisaServiceInput: CreateVisaServiceInput,
    @CurrentUser() user: User,
  ) {
    return this.visaService.create(createVisaServiceInput, user.id);
  }

  @Query(() => [ServiceEntity], { name: 'visas' })
  findAllVisas() {
    return this.visaService.findAll();
  }

  @Query(() => ServiceEntity, { name: 'visa' })
  findOneVisa(@Args('id', { type: () => ID }) id: string) {
    return this.visaService.findOne(id);
  }

  @Mutation(() => ServiceEntity)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF) // Only ADMIN and STAFF can update Visa services
  updateVisaService(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateVisaServiceInput')
    updateVisaServiceInput: UpdateVisaServiceInput,
    @CurrentUser() user: User,
  ) {
    return this.visaService.update(id, updateVisaServiceInput, user.id);
  }

  @Mutation(() => ServiceEntity)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF) // Only ADMIN and STAFF can remove Visa services
  removeVisaService(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ) {
    return this.visaService.remove(id, user.id);
  }
}
