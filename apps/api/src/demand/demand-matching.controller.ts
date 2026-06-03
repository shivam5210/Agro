import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { DemandMatchingService } from './demand-matching.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('demand-matching')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'FPO_ADMIN', 'BUYER')
export class DemandMatchingController {
  constructor(private readonly demandMatchingService: DemandMatchingService) {}

  @Get(':demandId/matches')
  async getDemandMatches(
    @Param('demandId') demandId: string,
    @Query('limit') limit: number = 10,
    @Query('minScore') minScore: number = 60,
  ) {
    return this.demandMatchingService.findMatchesForDemand(
      demandId,
      limit,
      minScore,
    );
  }

  @Get(':demandId/saved-matches')
  async getSavedDemandMatches(
    @Param('demandId') demandId: string,
  ) {
    return this.demandMatchingService.getSavedMatches(demandId);
  }

  @Post(':demandId/save-matches')
  async saveDemandMatches(
    @Param('demandId') demandId: string,
    @Query('limit') limit: number = 10,
    @Query('minScore') minScore: number = 60,
  ) {
    const matches = await this.demandMatchingService.findMatchesForDemand(
      demandId,
      limit,
      minScore,
    );
    await this.demandMatchingService.saveMatchResults(demandId, matches);
    return { message: 'Matches saved successfully', count: matches.length };
  }
}