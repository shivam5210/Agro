import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BuyerDemand, FPO, ProductionForecast, Commodity } from '@prisma/client';

interface DemandMatchScore {
  fpoId: string;
  fpoName: string;
  matchScore: number; // 0-100
  quantityMatch: number; // 0-100
  locationMatch: number; // 0-100
  qualityMatch: number; // 0-100
  availableQuantity: number;
  expectedQuality: string;
  distanceKm: number | null;
}

/**
 * Demand Matching Engine
 * Implements smart matching between buyer demands and FPO supply
 * Based on SUPER PROMPT requirements:
 * - Automatically suggest matching FPOs
 * - Quantity Available
 * - Location Match
 * * Quality Match
 * - Generate Match Score
 */
@Injectable()
export class DemandMatchingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find matching FPOs for a buyer demand
   * @param demandId ID of the buyer demand to match
   * @param limit Maximum number of matches to return
   * @param minScore Minimum match score (0-100) to include in results
   */
  async findMatchesForDemand(
    demandId: string,
    limit: number = 10,
    minScore: number = 60,
  ): Promise<DemandMatchScore[]> {
    // Get the demand details
    const demand = await this.prisma.buyerDemand.findUnique({
      where: { id: demandId },
      include: {
        commodity: true,
        buyer: true,
      },
    });

    if (!demand) {
      throw new NotFoundException(`Demand with ID ${demandId} not found`);
    }

    // Only match open or partially filled demands
    if (demand.status !== 'OPEN' && demand.status !== 'PARTIALLY_FILLED') {
      return [];
    }

    // Get all active FPOs that have this commodity
    const fposWithCommodity = await this.prisma.fpo.findMany({
      where: {
        isActive: true,
        isVerified: true, // Only match with verified FPOs
        commodities: {
          some: {
            id: demand.commodityId,
          },
        },
        productionForecasts: {
          some: {
            commodityId: demand.commodityId,
            isActive: true,
            availableQuantity: {
              gt: 0, // Must have available quantity
            },
          },
        },
      },
      include: {
        productionForecasts: {
          where: {
            commodityId: demand.commodityId,
            isActive: true,
          },
          orderBy: {
            harvestStart: 'asc', // Prioritize earlier harvests
          },
        },
      },
    });

    // Calculate match scores for each FPO
    const matches: DemandMatchScore[] = [];

    for (const fpo of fposWithCommodity) {
      const matchScore = await this.calculateMatchScore(demand, fpo);

      if (matchScore.matchScore >= minScore) {
        matches.push(matchScore);
      }
    }

    // Sort by match score descending (best matches first)
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Return top matches
    return matches.slice(0, limit);
  }

  /**
   * Calculate match score between a demand and an FPO
   * @param demand The buyer demand
   * @param fpo The FPO to match against
   */
  private async calculateMatchScore(
    demand: BuyerDemand & { commodity: Commodity },
    fpo: FPO & { productionForecasts: ProductionForecast[] },
  ): Promise<DemandMatchScore> {
    // Get the best production forecast for this commodity
    const forecast = fpo.productionForecasts[0]; // Already sorted by harvestStart

    if (!forecast) {
      return this.createZeroMatchScore(fpo);
    }

    // 1. Quantity Match (0-100)
    const quantityMatch = this.calculateQuantityMatch(
      demand.quantity,
      forecast.availableQuantity,
    );

    // 2. Location Match (0-100)
    const locationMatch = await this.calculateLocationMatch(
      demand.deliveryState,
      demand.deliveryDistrict,
      fpo.state,
      fpo.district,
    );

    // 3. Quality Match (0-100)
    const qualityMatch = this.calculateQualityMatch(
      demand.qualityGrade,
      forecast.qualityGrade,
    );

    // 4. Overall Match Score (weighted average)
    // Weights: Quantity 40%, Location 30%, Quality 30%
    const matchScore =
      quantityMatch * 0.4 +
      locationMatch * 0.3 +
      qualityMatch * 0.3;

    return {
      fpoId: fpo.id,
      fpoName: fpo.name,
      matchScore: Number(matchScore.toFixed(1)),
      quantityMatch: Number(quantityMatch.toFixed(1)),
      locationMatch: Number(locationMatch.toFixed(1)),
      qualityMatch: Number(qualityMatch.toFixed(1)),
      availableQuantity: forecast.availableQuantity,
      expectedQuality: forecast.qualityGrade || 'Not specified',
      distanceKm: null, // Would calculate with geocoding service in production
    };
  }

  /**
   * Calculate quantity match score
   * @param demandedQuantity Quantity buyer needs
   * @param availableQuantity Quantity FPO has available
   */
  private calculateQuantityMatch(
    demandedQuantity: number,
    availableQuantity: number,
  ): number {
    if (demandedQuantity <= 0) return 100;
    if (availableQuantity <= 0) return 0;

    // If FPO has enough or more than needed, full score
    if (availableQuantity >= demandedQuantity) return 100;

    // Partial match based on what percentage can be fulfilled
    return (availableQuantity / demandedQuantity) * 100;
  }

  /**
   * Calculate location match score
   * @param demandState Buyer's delivery state
   * @param demandDistrict Buyer's delivery district
   * @param fpoState FPO's state
   * @param fpoDistrict FPO's district
   */
  private async calculateLocationMatch(
    demandState: string | undefined,
    demandDistrict: string | undefined,
    fpoState: string,
    fpoDistrict: string,
  ): Promise<number> {
    // Exact state and district match = 100
    if (
      demandState &&
      demandState.toLowerCase() === fpoState.toLowerCase() &&
      demandDistrict &&
      demandDistrict.toLowerCase() === fpoDistrict.toLowerCase()
    ) {
      return 100;
    }

    // State match but different district = 70
    if (
      demandState &&
      demandState.toLowerCase() === fpoState.toLowerCase()
    ) {
      return 70;
    }

    // Same region (neighboring states) = 40
    // In a real implementation, you'd use a geographical distance service
    // For now, we'll use a simple approach
    const neighboringStates = this.getNeighboringStates(fpoState);
    if (
      demandState &&
      neighboringStates.includes(demandState.toLowerCase())
    ) {
      return 40;
    }

    // No match = 0
    return 0;
  }

  /**
   * Get neighboring states for a given state (simplified)
   * In production, you'd use a geographical database or service
   */
  private getNeighboringStates(state: string): string[] {
    // Simplified neighboring states mapping for India
    const neighbors: Record<string, string[]> = {
      'andhra pradesh': ['tamil nadu', 'karnataka', 'telangana', 'odisha'],
      'arunachal pradesh': ['assam', 'nagaland'],
      'assam': ['arunachal pradesh', 'nagaland', 'manipur', 'mizoram', 'meghalaya', 'west bengal'],
      'bihar': ['uttar pradesh', 'jharkhand', 'west bengal'],
      'chhattisgarh': ['madhya pradesh', 'maharashtra', 'telangana', 'odisha', 'jharkhand', 'uttar pradesh'],
      'goa': ['maharashtra', 'karnataka'],
      'gujarat': ['rajasthan', 'madhya pradesh', 'maharashtra'],
      'haryana': ['punjab', 'himachal pradesh', 'uttar pradesh', 'rajasthan'],
      'himachal pradesh': ['punjab', 'haryana', 'uttarakhand', 'uttar pradesh'],
      'jammu & kashmir': ['punjab', 'himachal pradesh'],
      'jharkhand': ['bihar', 'odisha', 'west bengal', 'chhattisgarh'],
      'karnataka': ['goa', 'maharashtra', 'telangana', 'andhra pradesh', 'tamil nadu', 'kerala'],
      'kerala': ['karnataka', 'tamil nadu'],
      'madhya pradesh': ['uttar pradesh', 'chhattisgarh', 'maharashtra', 'gujarat', 'rajasthan'],
      'maharashtra': ['gujarat', 'madhya pradesh', 'chhattisgarh', 'telangana', 'karnataka', 'goa'],
      'manipur': ['nagaland', 'assam', 'mizoram'],
      'meghalaya': ['assam'],
      'mizoram': ['assam', 'manipur', 'tripura'],
      'nagaland': ['assam', 'arunachal pradesh', 'manipur'],
      'odisha': ['west bengal', 'jharkhand', 'chhattisgarh', 'andhra pradesh'],
      'punjab': ['himachal pradesh', 'haryana', 'rajasthan', 'jammu & kashmir'],
      'rajasthan': ['punjab', 'haryana', 'uttar pradesh', 'madhya pradesh', 'gujarat'],
      'sikkim': ['west bengal'],
      'tamil nadu': ['kerala', 'karnataka', 'andhra pradesh'],
      'telangana': ['maharashtra', 'chhattisgarh', 'karnataka'],
      'tripura': ['assam', 'mizoram'],
      'uttar pradesh': ['uttarakhand', 'himachal pradesh', 'haryana', 'rajasthan', 'madhya pradesh', 'bihar', 'jharkhand'],
      'uttarakhand': ['himachal pradesh', 'uttar pradesh'],
      'west bengal': ['odisha', 'jharkhand', 'bihar', 'sikkim', 'assam'],
    };

    return neighbors[state.toLowerCase()] || [];
  }

  /**
   * Calculate quality match score
   * @param demandedQuality Quality buyer requires
   * @param availableQuality Quality FPO has available
   */
  private calculateQualityMatch(
    demandedQuality: string | undefined,
    availableQuality: string | undefined,
  ): number {
    // If no quality specified, assume match
    if (!demandedQuality && !availableQuality) return 80;
    if (!demandedQuality) return 90; // Buyer doesn't care about quality
    if (!availableQuality) return 30; // FPO doesn't specify quality

    const demandQ = demandedQuality.toUpperCase();
    const availQ = availableQuality.toUpperCase();

    // Exact match
    if (demandQ === availQ) return 100;

    // Quality grades: A > B > C > D etc.
    const qualityOrder = ['A', 'B', 'C', 'D', 'E', 'F'];
    const demandIndex = qualityOrder.indexOf(demandQ);
    const availIndex = qualityOrder.indexOf(availQ);

    // If either grade not in our scale, use basic comparison
    if (demandIndex === -1 || availIndex === -1) {
      return demandQ === availQ ? 100 : 50;
    }

    // If FPO quality is better than or equal to what's demanded, full score
    if (availIndex <= demandIndex) return 100;

    // Penalty for lower quality - exponential decay
    const qualityDiff = availIndex - demandIndex;
    return Math.max(0, 100 - (qualityDiff * 25)); // 25 points penalty per grade drop
  }

  /**
   * Create a zero match score object (when no match possible)
   */
  private createZeroMatchScore(fpo: FPO): DemandMatchScore {
    return {
      fpoId: fpo.id,
      fpoName: fpo.name,
      matchScore: 0,
      quantityMatch: 0,
      locationMatch: 0,
      qualityMatch: 0,
      availableQuantity: 0,
      expectedQuality: 'Not specified',
      distanceKm: null,
    };
  }

  /**
   * Save match results to database for tracking/audit
   */
  async saveMatchResults(
    demandId: string,
    matches: DemandMatchScore[],
  ): Promise<void> {
    // Delete existing matches for this demand
    await this.prisma.demandMatch.deleteMany({
      where: { demandId },
    });

    // Create new match records
    const matchRecords = matches
      .filter((match) => match.matchScore > 0)
      .map((match) => ({
        demandId,
        fpoId: match.fpoId,
        matchScore: match.matchScore,
        quantityMatch: match.quantityMatch,
        locationMatch: match.locationMatch,
        qualityMatch: match.qualityMatch,
        matchedAt: new Date(),
      }));

    if (matchRecords.length > 0) {
      await this.prisma.demandMatch.createMany({
        data: matchRecords,
      });
    }
  }

  /**
   * Get saved matches for a demand
   */
  async getSavedMatches(demandId: string): Promise<DemandMatchScore[]> {
    const savedMatches = await this.prisma.demandMatch.findMany({
      where: { demandId },
      include: {
        fpo: {
          select: {
            id: true,
            name: true,
            registrationNo: true,
            state: true,
            district: true,
          },
        },
      },
      orderBy: {
        matchScore: 'desc',
      },
    });

    return savedMatches.map((match) => ({
      fpoId: match.fpo.id,
      fpoName: match.fpo.name,
      matchScore: match.matchScore,
      quantityMatch: match.quantityMatch,
      locationMatch: match.locationMatch,
      qualityMatch: match.qualityMatch,
      availableQuantity: 0, // Would need to join with production forecast
      expectedQuality: 'Not specified',
      distanceKm: null,
    }));
  }
}