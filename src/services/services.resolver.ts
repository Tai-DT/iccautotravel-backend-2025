import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ServicesService } from './services.service';
import { ServiceEntity, ServiceWithExtras } from './entities/service.entity';
import { CreateServiceInput } from './dto/create-service.input';
import { UpdateServiceInput } from './dto/update-service.input';
import { ServiceFilterInput } from './dto/service-filter.input';
import { ServicePaginationResponse } from './entities/service-pagination-response.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UseGuards } from '@nestjs/common';
import { GraphQLJwtAuthGuard } from '../auth/guards/graphql-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';
// import { I18nLang } from '../i18n/decorators/i18n-lang.decorator'; // Disabled to fix I18n issues
import { MockTranslationService } from './mock-translation.service';

@Resolver(() => ServiceEntity)
@UseGuards(GraphQLJwtAuthGuard, RolesGuard)
export class ServicesResolver {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly translationService: MockTranslationService,
  ) {}

  @Mutation(() => ServiceEntity)
  @Roles('ADMIN')
  async createService(
    @Args('input') createServiceInput: CreateServiceInput,
    @CurrentUser() user: User,
    @Args('lang', { defaultValue: 'vi' }) lang: string,
  ): Promise<ServiceEntity> {
    const service = await this.servicesService.create(
      createServiceInput,
      user.id,
    );
    // Add localized service type name
    const serviceEntity = ServiceEntity.fromPrisma(
      service as unknown as ServiceWithExtras,
    );
    serviceEntity.localizedTypeName =
      this.translationService.getServiceTypeName(service.type, lang);
    return serviceEntity;
  }

  @Query(() => ServicePaginationResponse)
  async services(
    @Args('pagination') paginationDto: PaginationDto,
    @Args('filters', { nullable: true }) filters?: ServiceFilterInput,
    @Args('lang', { defaultValue: 'vi' }) lang?: string,
  ): Promise<ServicePaginationResponse> {
    const { data, total, page, limit } =
      await this.servicesService.findAllWithPagination(
        paginationDto,
        filters || {},
      );

    // Add localized service type names to each service
    const localizedData = data.map((service: any) => {
      const serviceEntity = ServiceEntity.fromPrisma(
        service as unknown as ServiceWithExtras,
      );
      serviceEntity.localizedTypeName =
        this.translationService.getServiceTypeName(service.type, lang);
      return serviceEntity;
    });

    return {
      data: localizedData,
      metadata: { total, page, limit },
    };
  }

  @Query(() => ServiceEntity, { nullable: true })
  async service(
    @Args('id') id: string,
    @Args('lang', { defaultValue: 'vi' }) lang?: string,
  ): Promise<ServiceEntity | null> {
    const service = await this.servicesService.findOne(id);
    if (service) {
      const serviceEntity = ServiceEntity.fromPrisma(
        service as unknown as ServiceWithExtras,
      );
      serviceEntity.localizedTypeName =
        this.translationService.getServiceTypeName(service.type, lang);
      return serviceEntity;
    }
    return null;
  }

  @Mutation(() => ServiceEntity)
  @Roles('ADMIN')
  async updateService(
    @Args('id') id: string,
    @Args('input') updateServiceInput: UpdateServiceInput,
    @CurrentUser() user: User,
    @Args('lang', { defaultValue: 'vi' }) lang?: string,
  ): Promise<ServiceEntity> {
    const service = await this.servicesService.update(
      id,
      updateServiceInput,
      user.id,
    );
    const serviceEntity = ServiceEntity.fromPrisma(
      service as unknown as ServiceWithExtras,
    );
    serviceEntity.localizedTypeName =
      this.translationService.getServiceTypeName(service.type, lang);
    return serviceEntity;
  }

  @Mutation(() => ServiceEntity)
  @Roles('ADMIN')
  async removeService(
    @Args('id') id: string,
    @CurrentUser() user: User,
    @Args('lang', { defaultValue: 'vi' }) lang?: string,
  ): Promise<ServiceEntity> {
    const service = await this.servicesService.remove(id, user.id);
    const serviceEntity = ServiceEntity.fromPrisma(
      service as unknown as ServiceWithExtras,
    );
    serviceEntity.localizedTypeName =
      this.translationService.getServiceTypeName(service.type, lang);
    return serviceEntity;
  }

  @Mutation(() => Boolean)
  @Roles('ADMIN')
  async generateServiceAudio(
    @Args('serviceId') serviceId: string,
    @Args('lang', { defaultValue: 'vi' }) lang: string,
    @Args('userId', { nullable: true }) userId?: string,
  ): Promise<boolean> {
    await this.servicesService.generateServiceAudio(serviceId, lang, userId);
    return true;
  }

  @Query(() => String, { nullable: true })
  async getServiceAudioUrl(
    @Args('serviceId') serviceId: string,
  ): Promise<string | null> {
    return await this.servicesService.getServiceAudio(serviceId);
  }

  @Mutation(() => Boolean)
  @Roles('ADMIN')
  async generateAudioForAllServices(
    @Args('lang', { defaultValue: 'vi' }) lang: string,
    @Args('userId', { defaultValue: 'system' }) userId: string,
  ): Promise<boolean> {
    await this.servicesService.generateAudioForAllServices(lang, userId);
    return true;
  }
}
