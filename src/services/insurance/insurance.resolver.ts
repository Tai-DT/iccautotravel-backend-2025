import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { InsuranceService } from './insurance.service';
import { ServiceEntity } from '../entities/service.entity';
import { CreateInsuranceServiceInput } from './dto/create-insurance-service.input';
import { UpdateInsuranceServiceInput } from './dto/update-insurance-service.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { ROLE_NAMES } from '../../common/constants/roles';

@Resolver(() => ServiceEntity)
@UseGuards(JwtAuthGuard, RolesGuard)
export class InsuranceResolver {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Mutation(() => ServiceEntity)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF)
  createInsuranceService(
    @Args('createInsuranceServiceInput')
    createInsuranceServiceInput: CreateInsuranceServiceInput,
    @CurrentUser() user: User,
  ) {
    return this.insuranceService.create(createInsuranceServiceInput, user.id);
  }

  @Query(() => [ServiceEntity], { name: 'insurances' })
  findAllInsurances() {
    return this.insuranceService.findAll();
  }

  @Query(() => ServiceEntity, { name: 'insurance' })
  findOneInsurance(@Args('id', { type: () => ID }) id: string) {
    return this.insuranceService.findOne(id);
  }

  @Mutation(() => ServiceEntity)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF)
  updateInsuranceService(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateInsuranceServiceInput')
    updateInsuranceServiceInput: UpdateInsuranceServiceInput,
    @CurrentUser() user: User,
  ) {
    return this.insuranceService.update(
      id,
      updateInsuranceServiceInput,
      user.id,
    );
  }

  @Mutation(() => ServiceEntity)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF)
  removeInsuranceService(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ) {
    return this.insuranceService.remove(id, user.id);
  }
}
