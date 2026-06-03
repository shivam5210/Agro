import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { DemandMatchResults } from '@/components/demand-match-results';
import { Button } from '@/components/ui/button';

export default async function DemandDetailPage({
  params,
}: {
  params: { demandId: string }
}) {
  const demandId = params.demandId;

  // Fetch demand details to verify it exists
  let demand;
  try {
    demand = await api.demand.getById(demandId);
  } catch (error) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Demand Header */}
      <div className="flex items-center justify-between flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Demand Details
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Demand ID: {demandId}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span
            className={`px-3 py-1 rounded text-xs font-medium ${
              demand.status === 'OPEN'
                ? 'bg-green-100 text-green-800'
                : demand.status === 'PARTIALLY_FILLED'
                ? 'bg-yellow-100 text-yellow-800'
                : demand.status === 'FILLED'
                ? 'bg-blue-100 text-blue-800'
                : demand.status === 'CLOSED'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {demand.status}
          </span>
        </div>
      </div>

      {/* Demand Details */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Demand Information</h2>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">Commodity</p>
            <p className="text-lg font-medium text-gray-900">
              {demand.commodity?.name || 'Unknown'}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">Quantity Required</p>
            <p className="text-lg font-medium text-gray-900">
              {demand.quantity?.toLocaleString()} {demand.unit}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">Quality Required</p>
            <p className="text-lg font-medium text-gray-900">
              {demand.qualityGrade || 'Not specified'}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">Delivery Location</p>
            <p className="text-lg font-medium text-gray-900">
              {demand.deliveryLocation}
            </p>
            {demand.deliveryDistrict && demand.deliveryState && (
              <p className="text-sm text-gray-600">
                {demand.deliveryDistrict}, {demand.deliveryState}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">Delivery By</p>
            <p className="text-lg font-medium text-gray-900">
              {new Date(demand.deliveryBy).toLocaleDateString()}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">Price Expectation</p>
            <p className="text-lg font-medium text-gray-900">
              {demand.pricePerUnit ? `₹{demand.pricePerUnit.toFixed(2)}/${demand.unit}` : 'Not specified'}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">Payment Terms</p>
            <p className="text-lg font-medium text-gray-900">
              {demand.paymentTerms || 'Not specified'}
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium text-gray-900">Buyer Information</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 h-10 w-10">
                <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="1" y1="14" x2="23" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="4" y1="20" x2="4" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="20" y1="20" x2="20" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {demand.buyer?.companyName || 'Unknown Buyer'}
                </h3>
                <p className="text-sm text-gray-500">
                  {demand.buyer?.contactPerson || ''}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Contact</p>
              <p className="text-sm text-gray-600">
                {demand.buyer?.contactPhone || 'Not provided'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-sm text-gray-600">
                {demand.buyer?.contactEmail || 'Not provided'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Matching FPOs Section */}
      <div className="border-t pt-6">
        <h2 className="text-xl font-bold text-gray-900">
          Matching FPOs
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Automatically suggested FPOs based on quantity, location, and quality match
        </p>
        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // In a real app, this would trigger a refresh
              window.location.reload();
            }}
          >
            Refresh Matches
          </Button>
        </div>
        <DemandMatchResults demandId={demandId} limit={10} minScore={60} />
      </div>

      {/* Inquiry Section */}
      <div className="border-t pt-6">
        <h2 className="text-xl font-bold text-gray-900">
          Send Inquiry
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Contact matching FPOs to discuss fulfilling this demand
        </p>
        <div className="flex flex-col sm:flex-row sm:space-x-4 mt-4">
          <Button
            onClick={() => {
              // In a real app, this would open a modal/form to send inquiry
              alert('Inquiry form would open here');
            }}
          >
            Send Inquiry to Matches
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // In a real app, this would navigate to create inquiry page
              alert('Navigate to create inquiry');
            }}
          >
            Create Custom Inquiry
          </Button>
        </div>
      </div>
    </div>
  );
}