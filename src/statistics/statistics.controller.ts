import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { StatisticsResponseDto } from './dto/statistics-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { HasPermission } from '../common/decorators/has-permission.decorator';

@ApiTags('statistics')
@Controller('statistics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get full system statistics' })
  @ApiResponse({
    status: 200,
    description: 'Returns full system statistics',
    type: StatisticsResponseDto,
  })
  @HasPermission('statistics:read')
  async getFullStatistics(): Promise<StatisticsResponseDto> {
    return this.statisticsService.getFullStatistics();
  }
}
