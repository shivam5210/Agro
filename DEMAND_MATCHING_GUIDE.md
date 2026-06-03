# Demand Matching Engine Implementation Guide

This document provides detailed guidance on the Demand Matching Engine implementation, one of the core features specified in the SUPER PROMPT for the National FPO Digital Market Linkage Platform.

## 🎯 **Overview**

The Demand Matching Engine automatically suggests matching FPOs for buyer demands based on:
- Quantity Available
- Location Match (State/District)
- Quality Match
- Generates a composite Match Score (0-100)

This implements the "Smart Matching" requirement from the SUPER PROMPT under the Buyer Demand Module.

## 🔧 **Technical Implementation**

### **1. Backend Components**

#### **Demand Matching Service** (`apps/api/src/demand-matching/demand-matching.service.ts`)
The core algorithm that calculates match scores between buyer demands and FPO supplies.

#### **Demand Matching Controller** (`apps/api/src/demand-matching/demand-matching.controller.ts`)
Exposes the matching functionality via REST API endpoints.

#### **Demand Matching Module** (`apps/api/src/demand-matching/demand-matching.module.ts`)
NestJS module that wires everything together.

### **2. Database Schema**
Added a new `DemandMatch` entity to track matching results (would need to be added to `schema.prisma`):
```prisma
model DemandMatch {
  id            String   @id @default(uuid())
  demand        BuyerDemand @relation("demandMatches", fields: [demandId], references: [id])
  demandId      String
  fpo           FPO      @relation("fpoMatches", fields: [fpoId], references: [id])
  fpoId         String
  matchScore    Float    // 0-100 composite score
  quantityMatch Float    // 0-100 quantity fulfillment score
  locationMatch Float    // 0-100 geographical proximity score
  qualityMatch  Float    // 0-100 quality compliance score
  matchedAt     DateTime @default(now())

  @@index([demandId, matchScore])
  @@index([fpoId])
}
```

### **3. API Endpoints**
Added to the backend and exposed through the frontend API client:

- `GET /demand-matching/:demandId/matches` - Find matches for a demand
- `GET /demand-matching/:demandId/saved-matches` - Get previously saved matches
- `POST /demand-matching/:demandId/save-matches` - Calculate and save matches

## 📊 **Matching Algorithm Details**

### **Scoring Methodology**

The match score is a weighted average of three factors:

1. **Quantity Match (40% weight)**: 
   - 100 if FPO supply ≥ demand quantity
   - Proportional score if FPO supply < demand quantity
   - Formula: `min(100, (availableQuantity / demandedQuantity) * 100)`

2. **Location Match (30% weight)**:
   - 100: Exact state and district match
   - 70: State match, different district
   - 40: Neighboring states (based on predefined mapping)
   - 0: No geographical relationship

3. **Quality Match (30% weight)**:
   - 100: Exact quality grade match or FPO quality ≥ demanded quality
   - Proportional penalty for lower quality grades (25 points per grade drop)
   - 80: No quality specified by either party
   - 90: Buyer doesn't specify quality requirements
   - 30: FPO doesn't specify quality but buyer does

**Final Score** = (QuantityMatch × 0.4) + (LocationMatch × 0.3) + (QualityMatch × 0.3)

### **Matching Process**

1. **Filter Candidates**: Only considers verified, active FPOs that:
   - Have the demanded commodity in their catalog
   - Have active production forecasts with available quantity > 0
   - Are marked as verified

2. **Score Calculation**: For each candidate FPO, calculate the three component scores

3. **Ranking**: Sort matches by composite score descending (best matches first)

4. **Threshold**: By default, only returns matches with score ≥ 60 (configurable)

5. **Persistence**: Optionally save match results to database for audit/tracking

### **Quality Grade Handling**

The system understands standard quality grades:
- A (Highest quality)
- B (Good quality)
- C (Average quality)
- D (Below average)
- E/F (Poor quality)

If FPO provides quality grade B and buyer demands grade A → Score = 75 (one grade penalty)
If FPO provides quality grade A and buyer demands grade C → Score = 100 (FPO exceeds requirements)

## 🚀 **How to Use the Feature**

### **Backend Usage**

The matching service can be used directly in other services:
```typescript
import { DemandMatchingService } from './demand-matching.service';

// In a service constructor
constructor(private demandMatchingService: DemandMatchingService) {}

// Find matches for a demand
const matches = await this.demandMatchingService.findMatchesForDemand(
  demandId,      // The buyer demand ID
  10,            // Limit to top 10 matches
  60             // Minimum score threshold
);

// Save matches to database
await this.demandMatchingService.saveMatchResults(demandId, matches);
```

### **Frontend Usage**

#### **API Client Methods** (`apps/web/src/lib/api.ts`)
```typescript
// Get matches for a demand
const matches = await api.demandMatching.getMatches(demandId, {
  limit: 10,
  minScore: 60
});

// Get previously saved matches
const savedMatches = await api.demandMatching.getSavedMatches(demandId);

// Calculate and save new matches
await api.demandMatching.saveMatches(demandId, {
  limit: 10,
  minScore: 60
});
```

#### **Example Component Usage**
```typescript
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function DemandMatchResults({ demandId }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoading(true);
        const response = await api.demandMatching.getMatches(demandId, {
          limit: 10,
          minScore: 60
        });
        setMatches(response);
      } catch (error) {
        console.error('Failed to load matches:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [demandId]);

  if (loading) return <div>Finding matches...</div>;
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Matching FPOs</h3>
      {matches.length === 0 ? (
        <p className="text-gray-500">No suitable matches found</p>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <div key={match.fpoId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{match.fpoName}</h4>
                  <p className="text-sm text-gray-600">
                    {match.fpoId}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {match.matchScore}%
                  </div>
                  <p className="text-xs text-gray-500">Match Score</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                <div>
                  <p className="font-medium">Quantity Match</p>
                  <p>{match.quantityMatch}%</p>
                </div>
                <div>
                  <p className="font-medium">Location Match</p>
                  <p>{match.locationMatch}%</p>
                </div>
                <div>
                  <p className="font-medium">Quality Match</p>
                  <p>{match.qualityMatch}%</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Available: {match.availableQuantity} Qtl | 
                Quality: {match.expectedQuality}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 🧪 **Testing the Feature**

### **Step-by-Step Verification**

1. **Start the development stack**:
   ```bash
   npm run dev:all
   ```

2. **Create test data**:
   - Login as Super Admin (admin@fpomarketlink.gov.in / Admin@123)
   - Create a verified FPO in "Maharashtra", "Pune" district
   - Add a commodity (e.g., "Onions") to the FPO
   - Add a production forecast for Onions with 100 Qtl available, quality grade "B"
   - Create a buyer user
   - Create a buyer demand for 50 Qtl of Onions, quality grade "B", delivery to "Maharashtra", "Pune"

3. **Test the matching API**:
   - Get the demand ID from the URL or API response
   - Call: `GET http://localhost:4000/demand-matching/{demandId}/matches?limit=5&minScore=50`
   - Expected response: Should return the FPO with high match score (~90-100)

4. **Test via frontend**:
   - Navigate to the demand detail page
   - Look for a "Find Matches" or "Matching FPOs" section
   - Should display the FPO with match score breakdown

### **Expected Match Scores for Test Case**

| Factor | Calculation | Score |
|--------|-------------|-------|
| **Quantity** | 100 Qtl available ≥ 50 Qtl demanded | 100% |
| **Location** | Exact state & district match | 100% |
| **Quality** | FPO grade B = Demand grade B | 100% |
| **Final** | (100×0.4) + (100×0.3) + (100×0.3) | **100%** |

### **Edge Cases to Test**

1. **Quantity Mismatch**: Demand 150 Qtl, FPO has 100 Qtl → Quantity score = 66.7%
2. **Location Mismatch**: FPO in Maharashtra, demand in Karnataka → Location score = 0% (unless neighboring)
3. **Quality Mismatch**: FPO grade C, demand grade A → Quality score = 50% (2 grades down = 50 point penalty)
4. **No Available Quantity**: FPO has 0 Qtl available → Should not appear in matches
5. **Unverified FPO**: Should be excluded from matching results

## 📈 **Performance Considerations**

### **Optimizations Implemented**
- **Early filtering**: Only checks FPOs that have the demanded commodity
- **Indexed queries**: Uses database indexes on commodityId, isActive, isVerified
- **Limited results**: Default limit of 10 matches prevents excessive computation
- **Sorted forecasts**: Uses earliest harvest first for better match quality

### **Potential Enhancements**
1. **Geocoding Integration**: Replace simplified location matching with actual distance calculation using latitude/longitude
2. **Caching**: Cache match results for frequently queried demands
3. **Background Processing**: For large-scale matching, use job queues (Bull/RabbitMQ)
4. **Machine Learning**: Improve matching with historical transaction data
5. **Price Factor**: Add price compatibility to matching score
6. **Seasonality**: Consider harvest timing in matching algorithm

## 🔗 **Integration Points**

### **Where Matching is Used in the Platform**

1. **Buyer Demand Detail Page**: Show "Recommended FPOs" section
2. **FPO Profile Page**: Show "Matching Buyer Demands" section
3. **Transaction Creation**: Pre-select best match when creating transaction from demand
4. **Notifications**: Alert FPOs when new high-score matches appear for their commodities
5. **Analytics**: Track match-to-transaction conversion rates

### **Frontend Integration Examples**

#### **In Demand Detail Page**
```typescript
// apps/web/src/app/(dashboard)/demands/[demandId]/page.tsx
import { DemandMatchResults } from '@/components/demand-match-results';

export default function DemandDetailPage({ params }: { params: { demandId: string } }) {
  return (
    <div className="space-y-6">
      {/* Demand details... */}
      
      <section>
        <h2 className="text-xl font-bold">Matching FPOs</h2>
        <DemandMatchResults demandId={params.demandId} />
      </section>
      
      {/* Other sections... */}
    </div>
  );
}
```

#### **In FPO Detail Page (Reverse Matching)**
```typescript
// Show demands that match this FPO's supply
import { api } from '@/lib/api';

export function FpoMatchingDemands({ fpoId }) {
  const [matches, setMatches] = useState([]);
  
  useEffect(() => {
    // Would need a reverse matching endpoint or client-side filtering
    // For now, get all demands and filter client-side (ok for moderate data volumes)
    api.demand.getAll({ status: ['OPEN', 'PARTIALLY_FILLED'] })
      .then(response => {
        // Filter demands for this Fpo's commodities
        const relevantDemands = response.data.filter(demand => 
          fpoCommodities.includes(demand.commodityId)
        );
        // Then get matches for each relevant demand
        return Promise.all(
          relevantDemands.map(demand => 
            api.demandMatching.getMatches(demand.id, { limit: 3, minScore: 50 })
          )
        );
      })
      .then(allMatches => {
        // Flatten and deduplicate results
        const flattened = allMatches.flat();
        const uniqueMatches = Array.from(
          new Map(flattened.map(m => [m.fpoId, m])).values()
        );
        setMatches(uniqueMatches.sort((a, b) => b.matchScore - a.matchScore));
      });
  }, [fpoId]);
  
  // Render matches...
}
```

## 🛠️ **Extending the Implementation**

### **Adding New Matching Factors**

To add a new factor (e.g., price compatibility):

1. **Add calculation method** in `DemandMatchingService`:
```typescript
private calculatePriceMatch(demand: BuyerDemand, forecast: ProductionForecast): number {
  // Implementation here
}
```

2. **Update the final score calculation**:
```typescript
const matchScore =
  quantityMatch * 0.3 +  // Reduced from 0.4
  locationMatch * 0.25 + // Reduced from 0.3
  qualityMatch * 0.25 +  // Reduced from 0.3
  priceMatch * 0.2;      // New 20% weight
```

3. **Update the result interface** to include the new factor
4. **Update frontend components** to display the new factor

### **Configuration Options**

Make the matching algorithm configurable via environment variables or database settings:

```typescript
// In DemandMatchingService constructor
constructor(
  private prisma: PrismaService,
  @Inject(MATCHING_WEIGHTS_OPTIONS) 
  private matchingWeights: MatchingWeights
) {}

// Where MatchingWeights is:
// interface MatchingWeights {
//   quantity: number;
//   location: number;
//   quality: number;
//   [key: string]: number; // For extensibility
// }

// Default values:
// { quantity: 0.4, location: 0.3, quality: 0.3 }
```

## 📋 **Testing Checklist**

### **Unit Tests (Service Level)**
- [ ] Quantity match calculation (various scenarios)
- [ ] Location match calculation (exact, state-only, neighboring, none)
- [ ] Quality match calculation (exact match, better, worse, unspecified)
- [ ] Final score calculation with different weights
- [ ] Edge cases (zero quantities, null values, etc.)

### **Integration Tests (API Level)**
- [ ] Endpoint returns correct HTTP status codes
- [ ] Response matches expected schema
- [ ] Filtering by limit and minScore works
- [ ] Saved matches persistence works
- [ ] Authentication and authorization enforced

### **End-to-End Tests (UI Level)**
- [ ] User can create demand and FPO with test data
- [ ] "Find Matches" button works and shows results
- [ ] Match score breakdown displays correctly
- [ ] User can save matches for future reference
- [ ] Matches persist after page refresh
- [ ] No matches shown when criteria not met

## 🚀 **Production Readiness Notes**

### **Scaling Considerations**
- For 10,000+ demands/hour, consider:
  - Adding Redis caching for frequent demands
  - Using database materialized views for commodity-FPO relationships
  - Implementing approximate matching algorithms for large datasets
  - Adding pagination to matching results

### **Monitoring & Metrics**
- Track match-to-conversion rate (what % of matches lead to transactions)
- Monitor average match score by commodity/region
- Track computation time per matching request
- Alert on sudden drops in match quality (indicating data issues)

### **Data Quality Dependencies**
The matching engine relies on:
- Accurate commodity catalog synchronization between FPOs and demands
- Reliable geographical data (states/districts)
- Consistent quality grading standards
- Up-to-date availability quantities

Consider adding:
- Data validation rules for commodity names
- Standardized quality grade definitions
- Automated data quality checks and reporting

## 📚 **Related SUPER PROMPT Requirements**

This implementation directly addresses:

### **From Buyer Demand Module:**
- "Implement smart matching" ✅
- "Automatically suggest: Matching FPOs, Quantity Available, Location Match, Quality Match" ✅
- "Generate Match Score" ✅

### **From Technology Stack:**
- "Backend: Node.js, NestJS, REST API" ✅
- "Database: PostgreSQL, Prisma ORM" ✅

### **From Future Ready Features:**
- "AI Demand Forecasting" - Foundation laid for ML enhancement
- "Price Prediction" - Can be added as additional matching factor

## 📁 **Files Modified/Added**

### **New Files:**
- `apps/api/src/demand-matching/demand-matching.service.ts`
- `apps/api/src/demand-matching/demand-matching.controller.ts`
- `apps/api/src/demand-matching/demand-matching.module.ts`

### **Modified Files:**
- `apps/api/src/app.module.ts` - Added DemandMatchingModule
- `apps/web/src/lib/api.ts` - Added demandMatching API methods
- `apps/api/prisma/schema.prisma` - Would need to add DemandMatch entity (shown above)

## ✅ **Verification Status**

The demand matching engine has been:
- [x] Implemented with full algorithm
- [x] Integrated into NestJS module system
- [x] Exposed via REST API with proper guards
- [x] Made accessible through frontend API client
- [x] Documented with usage examples
- [x] Ready for frontend component integration
- [x] Designed for extensibility and performance

This implementation provides a solid foundation for the smart matching feature that can be immediately used by your development team to build the buyer demand matching functionality as specified in the SUPER PROMPT.

---

*Ready for implementation: Your team can now build UI components that call the matching API to display recommended FPOs for buyer demands, complete with score breakdowns and actionable insights.*