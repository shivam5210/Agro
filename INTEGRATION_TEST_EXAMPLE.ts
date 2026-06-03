// Example Integration Test - Demonstrating Frontend ↔ Backend API Communication
// This file shows how the three parts work together

/**
 * PART 1: FRONTEND (Next.js) - What the user sees and interacts with
 * File: apps/web/src/components/fpo-create-form.tsx
 */

import { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function FPOCreateForm() {
  const [formData, setFormData] = useState({
    name: '',
    registrationNo: '',
    address: '',
    district: '',
    state: '',
    pincode: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    website: '',
    description: '',
    establishedYear: undefined as number | undefined,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // PART 2: API INTEGRATION - Frontend calling Backend API
      // This is where frontend communicates with backend via HTTP requests
      const response = await api.fpo.create(formData);

      // Success! Show confirmation and redirect
      setSuccess(true);
      setTimeout(() => {
        // Redirect to FPO detail page
        router.push(`/fpo/${response.id}`);
      }, 1500);
    } catch (err: any) {
      // Handle API errors (validation, server errors, etc.)
      setError(err.response?.data?.message || err.message || 'Failed to create FPO');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form fields */}
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
          FPO Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      {/* ... more form fields ... */}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 ${
            loading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Creating...' : 'Create FPO'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <p className="text-green-700">FPO created successfully!</p>
        </div>
      )}
    </form>
  );
}

/**
 * PART 2: BACKEND (NestJS) - What processes the request
 * File: apps/api/src/fpo/fpo.controller.ts
 */

import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { FpoService } from './fpo.service';
import { CreateFpoDto } from './dto/create-fpo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('fpo')
export class FpoController {
  constructor(private readonly fpoService: FpoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'FPO_ADMIN')
  create(@Body() createFpoDto: CreateFpoDto) {
    // This method receives the data from the frontend API call
    // It validates the data (via DTO) and passes it to the service layer
    return this.fpoService.create(createFpoDto);
  }
}

/**
 * PART 3: DATABASE/PERSISTENCE - Where data is stored
 * File: apps/api/src/fpo/fpo.service.ts (uses Prisma)
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFpoDto } from './dto/create-fpo.dto';

@Injectable()
export class FpoService {
  constructor(private prisma: PrismaService) {}

  async create(createFpoDto: CreateFpoDto) {
    // Check if FPO with same registration number already exists
    const existingFpo = await this.prisma.fpo.findUnique({
      where: { registrationNo: createFpoDto.registrationNo },
    });

    if (existingFpo) {
      throw new Error('FPO with this registration number already exists');
    }

    // Save to database using Prisma ORM
    return this.prisma.fpo.create({
      data: {
        ...createFpoDto,
        // If admin user id is provided from request, link it
        adminId: createFpoDto.adminId, // Comes from authenticated user in real implementation
      },
    });
  }
}

/**
 * FULL INTEGRATION FLOW:
 *
 * 1. USER ACTION: User fills out FPO creation form in browser (Frontend)
 * 2. FRONTEND → BACKEND: Form data sent via POST /api/fpo (Axios/fetch)
 * 3. BACKEND VALIDATION: NestJS controller validates input via DTO
 * 4. BUSINESS LOGIC: Service layer checks for duplicates, processes data
 * 5. DATABASE: Prisma saves to PostgreSQL database
 * 6. BACKEND → FRONTEND: Returns created FPO object with ID
 * 7. FRONTEND UPDATE: UI shows success message, redirects to FPO detail page
 *
 * DATA FLOW EXAMPLE:
 *
 * Frontend State: {name: "Green Valley FPO", registrationNo: "FPO001", ...}
 *
 * HTTP Request:
 * POST http://localhost:4000/fpo
 * Headers: { Authorization: "Bearer <jwt-token>", "Content-Type": "application/json" }
 * Body: { "name": "Green Valley FPO", "registrationNo": "FPO001", ... }
 *
 * Backend Processing:
 * - JWT verified via auth guard
 * - Role checked via roles guard (SUPER_ADMIN/FPO_ADMIN allowed)
 * - Data validated against CreateFpoDto class
 * - Service checks for existing registration number
 * - New FPO record created in database
 *
 * HTTP Response:
 * Status: 201 Created
 * Body: {
 *   id: "c5e3f8a2-1b4c-4d9e-8f7a-2b3c4d5e6f7a",
 *   name: "Green Valley FPO",
 *   registrationNo: "FPO001",
 *   ... (other fields),
 *   createdAt: "2026-06-03T10:30:00.000Z"
 * }
 *
 * Frontend Updates:
 * - Shows success message
 * - Stores FPO ID for redirect
 * - Navigates to /fpo/c5e3f8a2-1b4c-4d9e-8f7a-2b3c4d5e6f7a
 *
 * SUBSEQUENT REQUESTS:
 * - Frontend loads FPO detail page
 * - Makes GET request to http://localhost:4000/fpo/c5e3f8a2-1b4c-4d9e-8f7a-2b3c4d5e6f7a
 * - Backend returns the full FPO object with relationships
 * - UI displays FPO details, farmer count, commodity list, etc.
 */

// VERIFICATION STEPS:
// 1. Start development stack: npm run dev:all
// 2. Login as Super Admin (admin@fpomarketlink.gov.in / Admin@123)
// 3. Navigate to FPO Directory
// 4. Click "Create FPO"
// 5. Fill form and submit
// 6. Verify success message appears
// 7. Verify redirect to FPO detail page
// 8. Verify data appears in FPO directory list
// 9. Stop and restart services, verify data persists
// 10. Check API docs at http://localhost:4000/api-docs to test endpoints directly