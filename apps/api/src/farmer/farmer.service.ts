import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { CreateFarmerDto } from './dto/create-farmer.dto';
import { UpdateFarmerDto } from './dto/update-farmer.dto';

@Injectable()
export class FarmerService {
  constructor(private prisma: PrismaService) {}

  async create(createFarmerDto: CreateFarmerDto) {
    // Check if farmer with same phone already exists
    const existingFarmer = await this.prisma.farmer.findUnique({
      where: { phone: createFarmerDto.phone },
    });

    if (existingFarmer) {
      throw new BadRequestException('Farmer with this phone number already exists');
    }

    // Check if Aadhar number is unique (if provided)
    if (createFarmerDto.aadharNumber) {
      const existingAadhar = await this.prisma.farmer.findUnique({
        where: { aadharNumber: createFarmerDto.aadharNumber },
      });

      if (existingAadhar) {
        throw new BadRequestException('Farmer with this Aadhar number already exists');
      }
    }

    // Check if FPO exists
    if (createFarmerDto.fpoId) {
      const fpoExists = await this.prisma.fpo.findUnique({
        where: { id: createFarmerDto.fpoId },
      });

      if (!fpoExists) {
        throw new NotFoundException('FPO not found');
      }
    }

    // Create user account for farmer (optional - can be linked later)
    let userId: string | undefined;
    if (createFarmerDto.email && createFarmerDto.password) {
      const hashedPassword = await bcrypt.hash(createFarmerDto.password, 10);
      const user = await this.prisma.user.create({
        data: {
          email: createFarmerDto.email,
          phone: createFarmerDto.phone,
          password: hashedPassword,
          role: 'FARMER',
          firstName: createFarmerDto.firstName,
          lastName: createFarmerDto.lastName,
        },
      });
      userId = user.id;
    }

    return this.prisma.farmer.create({
      data: {
        firstName: createFarmerDto.firstName,
        lastName: createFarmerDto.lastName,
        phone: createFarmerDto.phone,
        email: createFarmerDto.email,
        aadharNumber: createFarmerDto.aadharNumber,
        village: createFarmerDto.village,
        district: createFarmerDto.district,
        state: createFarmerDto.state,
        landArea: createFarmerDto.landArea,
        latitude: createFarmerDto.latitude,
        longitude: createFarmerDto.longitude,
        fpo: createFarmerDto.fpoId ? { connect: { id: createFarmerDto.fpoId } } : undefined,
        user: userId ? { connect: { id: userId } } : undefined,
      },
    });
  }

  async bulkUpload(file: Express.Multer.File, fpoId: string) {
    // In a real implementation, you would parse CSV/XLSX here
    // For now, return a placeholder
    return {
      message: 'File uploaded successfully. Processing would happen in background job.',
      fileName: file.originalname,
      fileSize: file.size,
      fpoId,
      note: 'Implement CSV/XLSX parsing logic using libraries like csv-parser or exceljs',
    };
  }

  async findAll(query: any) {
    const { fpoId, state, district, page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (fpoId) where.fpoId = fpoId;
    if (state) where.state = state;
    if (district) where.district = district;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { village: { contains: search, mode: 'insensitive' } },
        { aadharNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [farmers, total] = await Promise.all([
      this.prisma.farmer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          fpo: {
            select: { id: true, name: true, registrationNo: true },
          },
          user: {
            select: { id: true, email: true, role: true },
          },
          crops: {
            select: { id: true, cropName: true, expectedYield: true, expectedHarvest: true },
          },
        },
      }),
      this.prisma.farmer.count({ where }),
    ]);

    return {
      data: farmers,
      meta: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const farmer = await this.prisma.farmer.findUnique({
      where: { id },
      include: {
        fpo: {
          select: { id: true, name: true, registrationNo: true, state: true, district: true },
        },
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        },
        crops: {
          orderBy: { createdAt: 'desc' },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Recent transactions
          include: {
            buyer: {
              select: { id: true, companyName: true },
            },
            commodity: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!farmer) {
      throw new NotFoundException(`Farmer with ID ${id} not found`);
    }

    return farmer;
  }

  async update(id: string, updateFarmerDto: UpdateFarmerDto) {
    const farmer = await this.prisma.farmer.findUnique({ where: { id } });

    if (!farmer) {
      throw new NotFoundException(`Farmer with ID ${id} not found`);
    }

    // Check if updating phone creates duplicate
    if (
      updateFarmerDto.phone &&
      updateFarmerDto.phone !== farmer.phone
    ) {
      const existingFarmer = await this.prisma.farmer.findUnique({
        where: { phone: updateFarmerDto.phone },
      });

      if (existingFarmer) {
        throw new BadRequestException('Farmer with this phone number already exists');
      }
    }

    // Check if updating Aadhar creates duplicate
    if (
      updateFarmerDto.aadharNumber &&
      updateFarmerDto.aadharNumber !== farmer.aadharNumber
    ) {
      const existingFarmer = await this.prisma.farmer.findUnique({
        where: { aadharNumber: updateFarmerDto.aadharNumber },
      });

      if (existingFarmer) {
        throw new BadRequestException('Farmer with this Aadhar number already exists');
      }
    }

    // Check if FPO exists (if updating)
    if (
      updateFarmerDto.fpoId &&
      updateFarmerDto.fpoId !== farmer.fpoId
    ) {
      const fpoExists = await this.prisma.fpo.findUnique({
        where: { id: updateFarmerDto.fpoId },
      });

      if (!fpoExists) {
        throw new NotFoundException('FPO not found');
      }
    }

    return this.prisma.farmer.update({
      where: { id },
      data: updateFarmerDto,
    });
  }

  async remove(id: string) {
    const farmer = await this.prisma.farmer.findUnique({ where: { id } });

    if (!farmer) {
      throw new NotFoundException(`Farmer with ID ${id} not found`);
    }

    // Check if farmer has associated crops or transactions
    const [cropCount, transactionCount] = await Promise.all([
      this.prisma.farmerCrop.count({ where: { farmerId: id } }),
      this.prisma.transaction.count({ where: { farmerId: id } }),
    ]);

    if (cropCount > 0 || transactionCount > 0) {
      throw new Error(
        'Cannot delete farmer with existing crop records or transactions. Consider deactivating instead.',
      );
    }

    // Also delete associated user account if exists
    if (farmer.userId) {
      await this.prisma.user.delete({ where: { id: farmer.userId } });
    }

    return this.prisma.farmer.delete({ where: { id } });
  }

  // Additional methods for dashboard/stats
  async getFarmerStats(farmerId: string) {
    const [
      cropCount,
      transactionCount,
      totalTransactionValue,
    ] = await Promise.all([
      this.prisma.farmerCrop.count({ where: { farmerId } }),
      this.prisma.transaction.count({ where: { farmerId } }),
      this.prisma.transaction.aggregate({
        where: { farmerId, status: 'COMPLETED' },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      cropCount,
      transactionCount,
      totalTransactionValue: totalTransactionValue._sum.totalAmount || 0,
    };
  }
}