import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'FPO_ADMIN', 'BUYER')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboardStats(@Query() query: any) {
    return this.analyticsService.getDashboardStats(query);
  }

  @Get('fpo-performance')
  getFpoPerformance(@Query() query: any) {
    return this.analyticsService.getFpoPerformance(query);
  }

  @Get('commodity-trends')
  getCommodityTrends(@Query() query: any) {
    return this.analyticsService.getCommodityTrends(query);
  }

  @Get('buyer-demand')
  getBuyerDemandAnalytics(@Query() query: any) {
    return this.analyticsService.getBuyerDemandAnalytics(query);
  }

  @Get('transaction-volume')
  getTransactionVolume(@Query() query: any) {
    return this.analyticsService.getTransactionVolume(query);
  }

  @Get('geographic-distribution')
  getGeographicDistribution(@Query() query: any) {
    return this.analyticsService.getGeographicDistribution(query);
  }

  @Get('monthly-snapshot')
  getMonthlySnapshot(@Query() query: any) {
    return this.analyticsService.getMonthlySnapshot(query);
  }
}