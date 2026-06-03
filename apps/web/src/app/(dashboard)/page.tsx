import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BarChart3, Users, Truck, DollarSign, MapPin, Activity } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalFPOs: 0,
    totalFarmers: 0,
    totalBuyers: 0,
    totalTransactions: 0,
    totalVolume: 0,
    totalRevenue: 0,
    activeFPOs: 0,
    verifiedFPOs: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [dashboardStats, transactions] = await Promise.all([
          api.analytics.getDashboard(),
          api.transaction.getAll({ limit: 5, status: 'COMPLETED' }),
        ]);

        setStats(dashboardStats);
        setRecentTransactions(transactions.data || []);
      } catch (err: any) {
        console.error('Dashboard load error:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-pulse rounded bg-gray-300 h-8 w-32"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 btn btn-primary btn-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-3xl font-bold text-gray-900">
            National FPO Dashboard
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Real-time overview of the digital agriculture marketplace
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-6 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* FPOs Card */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">
                  Total FPOs
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {stats.totalFPOs.toLocaleString()}
                </p>
              </div>
              <div className="ml-4 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-green-600 font-medium">
                {stats.activeFPOs} Active
              </span>
              <span className="text-green-600 font-medium">
                {stats.verifiedFPOs} Verified
              </span>
            </div>
          </div>

          {/* Farmers Card */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">
                  Total Farmers
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {stats.totalFarmers.toLocaleString()}
                </p>
              </div>
              <div className="ml-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Buyers Card */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">
                  Total Buyers
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {stats.totalBuyers.toLocaleString()}
                </p>
              </div>
              <div className="ml-4 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Transactions Card */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">
                  Total Transactions
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {stats.totalTransactions.toLocaleString()}
                </p>
              </div>
              <div className="ml-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-indigo-600 font-medium">
                {stats.totalVolume.toLocaleString()} Qtl
              </span>
              <span className="text-indigo-600 font-medium">
                ₹{stats.totalRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-4 py-6 sm:px-6">
        <div className="bg-white rounded-lg shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Recent Transactions
              </h2>
              <Link
                href="/transactions"
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Transaction ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    FPO
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Buyer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Commodity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Value (₹)
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Status</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td className="px-6 py-4 text-center text-sm text-gray-500" colSpan="7">
                      No recent transactions found
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => (
                    <tr key={tx.id} className="bg-white hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        TXN-{tx.transactionNo?.toString().padStart(6, '0') || tx.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {tx.fpo?.name || 'Unknown FPO'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {tx.buyer?.companyName || 'Unknown Buyer'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {tx.commodity?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tx.quantity?.toLocaleString()} Qtl
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{tx.totalAmount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tx.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : tx.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-6 sm:px-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/fpo-directory"
            className="group flex items-center bg-white rounded-lg shadow hover:bg-gray-50"
          >
            <div className="flex-1 p-4">
              <div className="flex items-center">
                <div className="ml-3 w-0">
                  <h3 className="text-lg font-medium text-gray-900">
                    Browse FPOs
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Explore verified farmer organizations
                  </p>
                </div>
              </div>
            </div>
          </Link>
          <Link
            href="/demands"
            className="group flex items-center bg-white rounded-lg shadow hover:bg-gray-50"
          >
            <div className="flex-1 p-4">
              <div className="flex items-center">
                <div className="ml-3 w-0">
                  <h3 className="text-lg font-medium text-gray-900">
                    Post Demand
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Find buyers for your produce
                  </p>
                </div>
              </div>
            </div>
          </Link>
          <Link
            href="/analytics"
            className="group flex items-center bg-white rounded-lg shadow hover:bg-gray-50"
          >
            <div className="flex-1 p-4">
              <div className="flex items-center">
                <div className="ml-3 w-0">
                  <h3 className="text-lg font-medium text-gray-900">
                    View Analytics
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Deep insights and reports
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}