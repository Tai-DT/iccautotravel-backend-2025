import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ComboService } from './combo.service';
import { ServiceEntity } from '../entities/service.entity';
import { CreateComboServiceInput } from './dto/create-combo-service.input'; // Use specific DTO
import { UpdateComboServiceInput } from './dto/update-combo-service.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { ROLE_NAMES } from '../../common/constants/roles';

@Resolver(() => ServiceEntity) // Associate with the generic ServiceEntity for now
@UseGuards(JwtAuthGuard, RolesGuard) // Apply guards to all endpoints in this resolver
export class ComboResolver {
  constructor(private readonly comboService: ComboService) {}

  @Mutation(() => ServiceEntity)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF) // Only ADMIN and STAFF can create Combo services
  createComboService(
    @Args('createComboServiceInput')
    createComboServiceInput: CreateComboServiceInput,
    @CurrentUser() user: User,
  ) {
    return this.comboService.create(createComboServiceInput, user.id);
  }

  @Query(() => [ServiceEntity], { name: 'combos' })
  findAllCombos() {
    return this.comboService.findAll();
  }

  @Query(() => ServiceEntity, { name: 'combo' })
  findOneCombo(@Args('id', { type: () => ID }) id: string) {
    return this.comboService.findOne(id);
  }

  @Mutation(() => ServiceEntity)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF) // Only ADMIN and STAFF can update Combo services
  updateComboService(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateComboServiceInput')
    updateComboServiceInput: UpdateComboServiceInput,
    @CurrentUser() user: User,
  ) {
    return this.comboService.update(id, updateComboServiceInput, user.id);
  }

  @Mutation(() => ServiceEntity)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF) // Only ADMIN and STAFF can remove Combo services
  removeComboService(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ) {
    return this.comboService.remove(id, user.id);
  }
}
