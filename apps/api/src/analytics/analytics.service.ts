import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(query: any) {
    const { state, district, startDate, endDate } = query;

    const where: any = {};
    if (state) where.state = state;
    if (district) where.district = district;

    // We'll compute several stats in parallel
    const [
      totalFPOs,
      totalFarmers,
      totalBuyers,
      totalTransactions,
      totalVolume,
      totalRevenue,
      activeFPOs,
      verifiedFPOs,
      recentTransactions,
    ] = await Promise.all([
      this.prisma.fpo.count({ where: { isActive: true, ...where } }),
      this.prisma.farmer.count({ where: { isActive: true, ...where } }),
      this.prisma.buyer.count({ where: { isActive: true, ...where } }),
      this.prisma.transaction.count({
        where: {
          status: 'COMPLETED',
          ...(startDate || endDate && {
            agreementDate: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }),
          ...(state && { fpo: { state } }),
          ...(district && { fpo: { district } }),
        },
      }),
      this.prisma.transaction.aggregate({
        where: {
          status: 'COMPLETED',
          ...(startDate || endDate && {
            agreementDate: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }),
          ...(state && { fpo: { state } }),
          ...(district && { fpo: { district } }),
        },
        _sum: { quantity: true, totalAmount: true },
      }),
      this.prisma.fpo.count({
        where: {
          isActive: true,
          transactions: {
            some: {
              status: 'COMPLETED',
              agreementDate: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          },
          ...where,
        },
      }),
      this.prisma.fpo.count({
        where: { isVerified: true, isActive: true, ...where },
      }),
      this.prisma.transaction.findMany({
        where: {
          status: 'COMPLETED',
          ...(startDate || endDate && {
            agreementDate: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }),
          ...(state && { fpo: { state } }),
          ...(district && { fpo: { district } }),
        },
        orderBy: { agreementDate: 'desc' },
        take: 5,
        include: {
          fpo: { select: { id: true, name: true, registrationNo: true } },
          buyer: { select: { id: true, companyName: true } },
          commodity: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      totalFPOs,
      totalFarmers,
      totalBuyers,
      totalTransactions,
      totalVolume: totalVolume._sum.quantity || 0,
      totalRevenue: totalVolume._sum.totalAmount || 0,
      activeFPOs,
      verifiedFPOs,
      recentTransactions,
    };
  }

  async getFpoPerformance(query: any) {
    const { state, district, limit = 10 } = query;

    // Get top performing FPOs by transaction volume in the last 6 months
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);

    const fpoPerformance = await this.prisma.fpo.groupBy({
      by: ['id', 'name', 'registrationNo', 'state', 'district'],
      where: {
        isActive: true,
        transactions: {
          some: {
            status: 'COMPLETED',
            agreementDate: { gte: sixMonthsAgo },
          },
        },
        ...(state && { state }),
        ...(district && { district }),
      },
      _sum: {
        transactions: {
          _sum: { quantity: true, totalAmount: true },
        },
      },
      _count: {
        transactions: true,
      },
      orderBy: {
        _sum: {
          transactions: {
            totalAmount: 'desc',
          },
        },
      },
      take: limit,
    });

    // Format the data
    return fpoPerformance.map((fpo) => ({
      id: fpo.id,
      name: fpo.name,
      registrationNo: fpo.registrationNo,
      state: fpo.state,
      district: fpo.district,
      transactionCount: fpo._count.transactions,
      totalQuantity: fpo._sum.transactions?._sum?.quantity || 0,
      totalRevenue: fpo._sum.transactions?._sum?.totalAmount || 0,
    }));
  }

  async getCommodityTrends(query: any) {
    const { state, district, months = 6 } = query;
    const startDate = new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000);

    // Get monthly commodity trends
    const commodityTrends = await this.prisma.$queryRaw`
      WITH monthly_data AS (
        SELECT
          DATE_TRunc('month', t."agreementDate")::date as month,
          c."name" as commodity_name,
          SUM(t.quantity) as total_quantity,
          SUM(t."totalAmount") as total_revenue
        FROM "Transaction" t
        JOIN "Commodity" c ON t."commodityId" = c.id
        JOIN "FPO" f ON t."fpoId" = f.id
        WHERE t.status = 'COMPLETED'
          AND t."agreementDate" >= ${startDate}
          ${state ? 'AND f.state = ${state}' : ''}
          ${district ? 'AND f.district = ${district}' : ''}
        GROUP BY month, c."name"
      )
      SELECT
        TO_CHAR(month, 'YYYY-MM') as month,
        commodity_name,
        total_quantity,
        total_revenue
      FROM monthly_data
      ORDER BY month DESC, commodity_name
    `;

    return commodityTrends;
  }

  async getBuyerDemandAnalytics(query: any) {
    const { state, district } = query;

    // Get demand statistics
    const demandStats = await this.prisma.buyerDemand.aggregate({
      where: {
        status: { in: ['OPEN', 'PARTIALLY_FILLED'] },
        ...(state && { deliveryState: state }),
        ...(district && { deliveryDistrict: district }),
      },
      _sum: { quantity: true, totalAmount: true },
      _avg: { quantity: true, pricePerUnit: true },
      _count: true,
    });

    // Get demand by commodity
    const demandByCommodity = await this.prisma.buyerDemand.groupBy({
      by: ['commodityId'],
      where: {
        status: { in: ['OPEN', 'PARTIALLY_FILLED'] },
        ...(state && { deliveryState: state }),
        ...(district && { deliveryDistrict: district }),
      },
      _sum: { quantity: true, totalAmount: true },
      _count: true,
      orderBy: {
        _sum: { quantity: 'desc' },
      },
      take: 10,
    });

    // Enrich with commodity names
    const commodityIds = demandByCommodity.map((d) => d.commodityId);
    const commodities = await this.prisma.commodity.findMany({
      where: { id: { in: commodityIds } },
      select: { id: true, name: true },
    });

    const commodityMap = new Map(commodities.map((c) => [c.id, c.name]));

    return {
      summary: demandStats,
      byCommodity: demandByCommodity.map((d) => ({
        commodityId: d.commodityId,
        commodityName: commodityMap.get(d.commodityId) || 'Unknown',
        totalQuantity: d._sum.quantity || 0,
        totalValue: d._sum.totalAmount || 0,
        demandCount: d._count,
        avgQuantity: d._avg.quantity || 0,
        avgPricePerUnit: d._avg.pricePerUnit || 0,
      })),
    };
  }

  async getTransactionVolume(query: any) {
    const { state, district, groupBy = 'month' } = query;

    let dateField = 't."agreementDate"';
    let groupFormat;
    if (groupBy === 'quarter') {
      groupFormat = "DATE_TRUNC('quarter', t.\"agreementDate\")::date";
    } else if (groupBy === 'year') {
      groupFormat = "DATE_TRUNC('year', t.\"agreementDate\")::date";
    } else {
      // Default to month
      groupFormat = "DATE_TRUNC('month', t.\"agreementDate\")::date";
    }

    const transactionVolume = await this.prisma.$queryRaw`
      SELECT
        TO_CHAR(${groupFormat}, 'YYYY-MM') as period,
        SUM(t.quantity) as total_volume,
        SUM(t."totalAmount") as total_revenue,
        COUNT(t.id) as transaction_count
      FROM "Transaction" t
      JOIN "FPO" f ON t."fpoId" = f.id
      WHERE t.status = 'COMPLETED'
        ${state ? 'AND f.state = ${state}' : ''}
        ${district ? 'AND f.district = ${district}' : ''}
      GROUP BY ${groupFormat}
      ORDER BY ${groupFormat} DESC
    `;

    return transactionVolume;
  }

  async getGeographicDistribution(query: any) {
    const { metric = 'fpoCount' } = query;

    let groupByField, aggregateField;
    if (metric === 'fpoCount') {
      groupByField = 'state';
      aggregateField = 'COUNT(DISTINCT f.id)';
    } else if (metric === 'farmerCount') {
      groupByField = 'state';
      aggregateField = 'COUNT(DISTINCT far.id)';
    } else if (metric === 'transactionVolume') {
      groupByField = 'state';
      aggregateField = 'SUM(t.quantity)';
    } else if (metric === 'transactionValue') {
      groupByField = 'state';
      aggregateField = 'SUM(t."totalAmount")';
    } else {
      // Default to FPO count by state
      groupByField = 'state';
      aggregateField = 'COUNT(DISTINCT f.id)';
    }

    const geographicData = await this.prisma.$queryRaw`
      SELECT
        f.${groupByField} as region,
        ${aggregateField} as value
      FROM "FPO" f
      LEFT JOIN "Farmer" far ON f.id = far."fpoId"
      LEFT JOIN "Transaction" t ON f.id = t."fpoId" AND t.status = 'COMPLETED'
      WHERE f.isActive = true
      GROUP BY f.${groupByField}
      ORDER BY value DESC
    `;

    return geographicData;
  }

  async getMonthlySnapshot(query: any) {
    const { year } = query;
    const startDate = year ? new Date(`${year}-01-01`) : new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000);
    const endDate = year ? new Date(`${year}-12-31`) : new Date();

    // Get monthly snapshots for the period
    const monthlySnapshots = await this.prisma.$queryRaw`
      WITH monthly_aggregates AS (
        SELECT
          DATE_TRUNC('month', date)::date as month,
          SUM(total_fpos) as total_fpos,
          SUM(total_farmers) as total_farmers,
          SUM(total_buyers) as total_buyers,
          SUM(total_transactions) as total_transactions,
          SUM(total_volume) as total_volume,
          SUM(total_revenue) as total_revenue
        FROM "AnalyticsSnapshot"
        WHERE date >= ${startDate} AND date <= ${endDate}
        GROUP BY DATE_TRUNC('month', date)::date
      )
      SELECT
        TO_CHAR(month, 'YYYY-MM') as month,
        total_fpos,
        total_farmers,
        total_buyers,
        total_transactions,
        total_volume,
        total_revenue
      FROM monthly_aggregates
      ORDER BY month
    `;

    return monthlySnapshots;
  }
}