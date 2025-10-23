import React, { useState, useEffect, useCallback } from 'react';

interface Feed {
  url: string;
  title: string;
}

interface FeedDetails {
  articleCount: number;
}

interface RefetchHistory {
  id: number;
  timestamp: string;
  status: string;
  details: string;
}

interface FeedSettingsProps {
  feed: Feed;
  onBack: () => void;
  onFeedDeleted: () => void;
}

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const FeedSettings: React.FC<FeedSettingsProps> = ({ feed, onBack, onFeedDeleted }) => {
  const [details, setDetails] = useState<FeedDetails | null>(null);
  const [history, setHistory] = useState<RefetchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [detailsResponse, historyResponse] = await Promise.all([
        fetch(`${apiUrl}/feeds/${encodeURIComponent(feed.url)}/details`),
        fetch(`${apiUrl}/feeds/${encodeURIComponent(feed.url)}/history`),
      ]);
      const detailsData = await detailsResponse.json();
      const historyData = await historyResponse.json();
      setDetails(detailsData);
      setHistory(historyData);
    } catch (error) {
      console.error('Error fetching feed data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [feed.url]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleRefetch = async () => {
    setIsRefetching(true);
    try {
      await fetch(`${apiUrl}/feeds/${encodeURIComponent(feed.url)}/refetch`, {
        method: 'POST',
      });
      await fetchAllData(); // Refresh data after refetch
    } catch (error) {
      console.error('Error re-fetching feed:', error);
    } finally {
      setIsRefetching(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this feed? This action cannot be undone.')) {
      try {
        await fetch(`${apiUrl}/feeds/${encodeURIComponent(feed.url)}`, {
          method: 'DELETE',
        });
        onFeedDeleted();
      } catch (error) {
        console.error('Error deleting feed:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
        >
          &larr; Back to Feeds
        </button>

        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-3xl font-bold mb-2">{feed.title}</h2>
          <p className="text-gray-600 break-all">{feed.url}</p>
          {isLoading ? (
            <p className="text-gray-500 mt-4">Loading stats...</p>
          ) : details ? (
            <div className="mt-4 text-lg">
              <span className="font-semibold">Total Articles:</span> {details.articleCount}
            </div>
          ) : (
            <p className="text-gray-500 mt-4">Could not load feed stats.</p>
          )}
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h3 className="text-2xl font-bold mb-4">Refetch History</h3>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan={3} className="text-center py-4">Loading history...</td></tr>
                ) : history.length > 0 ? (
                  history.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(entry.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">{entry.details}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} className="text-center py-4">No refetch history available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-2xl font-bold mb-4">Manage Feed</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={handleRefetch}
              disabled={isRefetching}
              className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50"
            >
              {isRefetching ? 'Re-fetching...' : 'Re-fetch Now'}
            </button>
            <button
              onClick={handleDelete}
              className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              Delete Feed
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">Manually re-fetch the feed to check for new articles, or permanently remove the feed and all its articles.</p>
        </div>
      </div>
    </div>
  );
};

export default FeedSettings;
