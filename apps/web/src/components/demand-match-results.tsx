import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BarChart3, MapPin, ShieldCheck } from 'lucide-react';

interface MatchResult {
  fpoId: string;
  fpoName: string;
  matchScore: number;
  quantityMatch: number;
  locationMatch: number;
  qualityMatch: number;
  availableQuantity: number;
  expectedQuality: string;
  distanceKm: number | null;
}

export function DemandMatchResults({
  demandId,
  limit = 10,
  minScore = 60
}: {
  demandId: string;
  limit?: number;
  minScore?: number
}) {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [savedMatchCount, setSavedMatchCount] = useState<number>(0);

  useEffect(() => {
    const loadMatches = async () => {
      if (!demandId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch matches from backend
        const response = await api.demandMatching.getMatches(demandId, {
          limit,
          minScore
        });

        setMatches(response || []);

        // Also get count of saved matches
        const saved = await api.demandMatching.getSavedMatches(demandId);
        setSavedMatchCount(saved.length);
      } catch (err: any) {
        console.error('Failed to load demand matches:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load matches');
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [demandId, limit, minScore]);

  const handleRefreshMatches = async () => {
    try {
      await api.demandMatching.saveMatches(demandId, {
        limit,
        minScore
      });
      // Refresh the matches after saving
      const response = await api.demandMatching.getMatches(demandId, {
        limit,
        minScore
      });
      setMatches(response || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to refresh matches');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full border-4 border-indigo-500 border-t-transparent h-12 w-12"></div>
        <p className="mt-4 text-gray-600">Finding matching FPOs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => {
            setError(null);
            loadMatches();
          }}
          className="mt-2 btn btn-outline btn-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8">
        <ShieldCheck className="mx-auto h-10 w-10 text-gray-400" />
        <p className="mt-4 text-gray-500">
          No matching FPOs found with score above {minScore}%
        </p>
        <button
          onClick={handleRefreshMatches}
          className="mt-4 btn btn-outline btn-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center space-x-3">
          <MapPin className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-medium text-gray-900">
            Matching FPOs
          </h2>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-500">
            {savedMatchCount} saved matches
          </span>
          <button
            onClick={handleRefreshMatches}
            className="btn btn-ghost btn-sm hover:bg-indigo-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {matches.map((match) => (
          <div
            key={match.fpoId}
            className="border border-gray-200 rounded-lg p-5 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
          >
            {/* Match Score Badge */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {match.fpoName}
                </h3>
                <p className="text-sm text-gray-600 truncate">
                  FPO ID: {match.fpoId}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-1 ${
                  match.matchScore >= 80 ? 'bg-green-50 text-green-800' :
                  match.matchScore >= 60 ? 'bg-yellow-50 text-yellow-800' :
                  'bg-red-50 text-red-800'
                } px-3 py-1 rounded text-sm font-medium`}
                >
                  {match.matchScore}%
                </div>
                <BarChart3 className={`h-4 w-4 ${
                  match.matchScore >= 80 ? 'text-green-600' :
                  match.matchScore >= 60 ? 'text-yellow-600' :
                  'text-red-600'
                }`} />
              </div>
            </div>

            {/* Match Breakdown */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">Quantity Match</p>
                <p className="text-lg font-medium text-gray-900">
                  {match.quantityMatch}%
                </p>
                <p className="text-xs text-gray-500">
                  {match.availableQuantity.toLocaleString()} Qtl available
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">Location Match</p>
                <p className="text-lg font-medium text-gray-900">
                  {match.locationMatch}%
                </p>
                <p className="text-xs text-gray-500">
                  {match.distanceKm !== null
                    ? `${match.distanceKm} km away`
                    : 'Same region'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">Quality Match</p>
                <p className="text-lg font-medium text-gray-900">
                  {match.qualityMatch}%
                </p>
                <p className="text-xs text-gray-500">
                  Expected: {match.expectedQuality}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">Overall Score</p>
                <div className="flex items-center">
                  <div className="w-3/4 bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        match.matchScore >= 80 ? 'bg-green-600' :
                        match.matchScore >= 60 ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}
                      style={{ width: `${match.matchScore}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-xs font-medium text-gray-900">
                    {match.matchScore}%
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  // In a real app, this would navigate to FPO detail or initiate inquiry
                  alert(`Viewing FPO: ${match.fpoName}`);
                }}
                className="btn btn-outline btn-sm"
              >
                View FPO
              </button>
              <button
                onClick={() => {
                  // In a real app, this would open inquiry form or start negotiation
                  alert(`Sending inquiry to: ${match.fpoName}`);
                }}
                className="btn btn-primary btn-sm"
              >
                Send Inquiry
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer with stats */}
      <div className="text-center pt-4 border-t border-gray-200 text-sm text-gray-500">
        Showing {matches.length} of {matches.length}+ potential matches
        {/* In a real app, you'd get total count from API */}
        <br />
        Matches ranked by composite score (Quantity 40%, Location 30%, Quality 30%)
      </div>
    </div>
  );
}