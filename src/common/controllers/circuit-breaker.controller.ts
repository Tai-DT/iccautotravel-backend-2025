import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CircuitBreakerService } from '../services/circuit-breaker.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('circuit-breaker')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class CircuitBreakerController {
  constructor(private readonly circuitBreakerService: CircuitBreakerService) {}

  @Get('health')
  async getAllCircuitsHealth() {
    return this.circuitBreakerService.getAllCircuitsHealth();
  }

  @Get('health/:name')
  async getCircuitHealth(@Param('name') name: string) {
    return this.circuitBreakerService.getCircuitHealth(name);
  }

  @Get('statistics')
  async getStatistics() {
    return this.circuitBreakerService.getCircuitStatistics();
  }

  @Post('force-open/:name')
  async forceOpenCircuit(
    @Param('name') name: string,
    @Body() body: { reason?: string },
  ) {
    await this.circuitBreakerService.forceOpenCircuit(name, body.reason);
    return { message: `Circuit "${name}" forced to OPEN state` };
  }

  @Post('force-close/:name')
  async forceCloseCircuit(
    @Param('name') name: string,
    @Body() body: { reason?: string },
  ) {
    await this.circuitBreakerService.forceCloseCircuit(name, body.reason);
    return { message: `Circuit "${name}" forced to CLOSED state` };
  }

  @Post('reset/:name')
  async resetCircuit(@Param('name') name: string) {
    await this.circuitBreakerService.resetCircuit(name);
    return { message: `Circuit "${name}" reset to default state` };
  }

  @Delete('cleanup')
  async cleanupOldCircuits() {
    const cleanedCount = await this.circuitBreakerService.cleanupOldCircuits();
    return {
      message: `Cleaned up ${cleanedCount} old circuit breaker entries`,
      cleanedCount,
    };
  }
}
