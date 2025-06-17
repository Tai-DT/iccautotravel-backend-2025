import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { TransferService } from './transfer.service';
import { ServiceEntity } from '../entities/service.entity';
import { CreateTransferServiceInput } from './dto/create-transfer-service.input';
import { UpdateTransferServiceInput } from './dto/update-transfer-service.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';

@Resolver(() => ServiceEntity)
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransferResolver {
  constructor(private readonly transferService: TransferService) {}

  @Mutation(() => ServiceEntity)
  @Roles('ADMIN', 'STAFF')
  createTransferService(
    @Args('createTransferServiceInput')
    createTransferServiceInput: CreateTransferServiceInput,
    @CurrentUser() user: User,
  ) {
    return this.transferService.create(createTransferServiceInput, user.id);
  }

  @Query(() => [ServiceEntity], { name: 'transfers' })
  findAllTransfers() {
    return this.transferService.findAll();
  }

  @Query(() => ServiceEntity, { name: 'transfer' })
  findOneTransfer(@Args('id', { type: () => ID }) id: string) {
    return this.transferService.findOne(id);
  }

  @Mutation(() => ServiceEntity)
  @Roles('ADMIN', 'STAFF')
  updateTransferService(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateTransferServiceInput')
    updateTransferServiceInput: UpdateTransferServiceInput,
    @CurrentUser() user: User,
  ) {
    return this.transferService.update(id, updateTransferServiceInput, user.id);
  }

  @Mutation(() => ServiceEntity)
  @Roles('ADMIN', 'STAFF')
  removeTransferService(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ) {
    return this.transferService.remove(id, user.id);
  }
}
