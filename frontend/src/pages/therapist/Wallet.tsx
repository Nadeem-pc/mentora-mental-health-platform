import { useState, useEffect } from 'react';
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, IndianRupee, Loader2, type LucideIcon } from 'lucide-react';
import { walletService } from '@/services/shared/walletService';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  status: string;
  metadata?: unknown;
}

interface Statistics {
  totalRevenue: number;
  thisMonthRevenue: number;
  platformFee: number;
  balance: number;
}

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  amount: number;
  bgColor: string;
  textColor: string;
}

const TherapistEarnings = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalRevenue: 0,
    thisMonthRevenue: 0,
    platformFee: 0,
    balance: 0
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    totalItems: 0
  });
  const [typeFilter, setTypeFilter] = useState<'credit' | 'debit' | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = async (overrides?: {
    page?: number;
    type?: 'credit' | 'debit' | '' | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const targetPage = overrides?.page ?? pagination.currentPage;
      const resolvedType = overrides?.type ?? typeFilter;
      const resolvedStartDate = overrides?.startDate ?? startDate;
      const resolvedEndDate = overrides?.endDate ?? endDate;
      const data = await walletService.getUserWallet({
        page: targetPage,
        limit: pagination.limit,
        type: resolvedType || undefined,
        startDate: resolvedStartDate || undefined,
        endDate: resolvedEndDate || undefined
      });

      setStatistics(data.statistics);
      setTransactions(data.transactions);
      setPagination(prev => ({
        ...prev,
        currentPage: data.pagination.currentPage,
        totalPages: data.pagination.totalPages,
        totalItems: data.pagination.totalItems
      }));
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: unknown } } }).response?.data?.message === 'string'
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message as string)
          : 'Failed to fetch wallet data';
      setError(message);
      console.error('Error fetching wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = () => {
    fetchWalletData({ page: 1 });
  };

  const handleClearFilters = () => {
    setTypeFilter('');
    setStartDate('');
    setEndDate('');
    fetchWalletData({ page: 1, type: '', startDate: '', endDate: '' });
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    const targetPage = direction === 'next' ? pagination.currentPage + 1 : pagination.currentPage - 1;
    if (targetPage < 1 || targetPage > pagination.totalPages) return;
    fetchWalletData({ page: targetPage });
  };

  const StatCard = ({ icon: Icon, title, amount, bgColor, textColor }: StatCardProps) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">₹{amount.toLocaleString()}</p>
        </div>
        <div className={`${bgColor} p-3 rounded-full`}>
          <Icon className={`w-6 h-6 ${textColor}`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading wallet data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Wallet</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchWalletData()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Earnings Dashboard</h1>
          <p className="text-gray-600">Track your revenue and transaction history</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={IndianRupee}
            title="Total Revenue"
            amount={statistics.totalRevenue}
            bgColor="bg-blue-100"
            textColor="text-blue-600"
          />
          <StatCard
            icon={TrendingUp}
            title="This Month"
            amount={statistics.thisMonthRevenue}
            bgColor="bg-green-100"
            textColor="text-green-600"
          />
          <StatCard
            icon={Wallet}
            title="Balance"
            amount={statistics.balance}
            bgColor="bg-purple-100"
            textColor="text-purple-600"
          />
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
              <p className="text-gray-600 text-sm mt-1">Your recent credits and debits</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'credit' | 'debit' | '')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Types</option>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={handleApplyFilters}
                className="bg-blue-600 text-white rounded-lg px-3 py-2 text-sm hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClearFilters}
                className="bg-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h3>
              <p className="text-gray-500">Your transaction history will appear here</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(txn.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {txn.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                          <span className={txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                            {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            txn.status === 'completed' ? 'bg-green-100 text-green-800' :
                            txn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {txn.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {txn.type === 'credit' ? (
                              <ArrowUpRight className="w-4 h-4 text-green-600 mr-2" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 text-red-600 mr-2" />
                            )}
                            <span className={`text-sm font-medium ${
                              txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {txn.type === 'credit' ? 'Credit' : 'Debit'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-gray-200">
                {transactions.map((txn) => (
                  <div key={txn.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {txn.type === 'credit' ? (
                          <ArrowUpRight className="w-5 h-5 text-green-600 mr-2" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-red-600 mr-2" />
                        )}
                        <span className="font-medium text-gray-900">{txn.description}</span>
                      </div>
                      <span className={`text-lg font-bold ${
                        txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {new Date(txn.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        txn.status === 'completed' ? 'bg-green-100 text-green-800' :
                        txn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {txn.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
                <span>
                  Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} of {pagination.totalItems} transactions
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.currentPage <= 1}
                    onClick={() => handlePageChange('prev')}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm font-medium">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    disabled={pagination.currentPage >= pagination.totalPages}
                    onClick={() => handlePageChange('next')}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TherapistEarnings;