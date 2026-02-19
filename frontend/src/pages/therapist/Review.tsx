import React, { useEffect, useState } from 'react';
import { Star, TrendingUp, Search, Calendar, MessageCircle } from 'lucide-react';
import { therapistProfileService } from '@/services/therapist/profileService';

interface Review {
  id: string;
  patientName: string;
  rating: number;
  date: string;
  session: string;
  comment: string;
  responseTime: string;
  verified: boolean;
}

interface BackendReview {
  _id: string;
  rating: number;
  review: string;
  createdAt: string;
  clientId?: {
    firstName?: string;
    lastName?: string;
  };
  appointmentId?: {
    appointmentDate?: string;
    issue?: string;
  };
}

const TherapistReviewsDashboard: React.FC = () => {
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await therapistProfileService.getReviews();
        const raw = (response as { data?: BackendReview[] }).data || (response as BackendReview[]);

        const mapped: Review[] = raw.map((item) => {
          const client = item.clientId || {};
          const appointment = item.appointmentId || {};

          const firstName = (client.firstName as string) || '';
          const lastName = (client.lastName as string) || '';
          const patientName = `${firstName} ${lastName}`.trim() || 'Client';

          const createdAt = item.createdAt ? new Date(item.createdAt as string) : new Date();
          const now = new Date();
          const diffDays = Math.round((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
          const responseTime =
            diffDays <= 0 ? 'Today' : diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;

          const appointmentDate = appointment.appointmentDate
            ? new Date(appointment.appointmentDate as string).toISOString().split('T')[0]
            : createdAt.toISOString().split('T')[0];

          return {
            id: String(item._id),
            patientName,
            rating: Number(item.rating) || 0,
            date: appointmentDate,
            session: (appointment.issue as string) || 'Therapy Session',
            comment: (item.review as string) || '',
            responseTime,
          } as Review;
        });

        setReviews(mapped);
      } catch (err) {
        console.error('Error loading therapist reviews:', err);
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const stats = {
    avgRating: reviews.length
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : 0,
    totalReviews: reviews.length,
    fiveStarCount: reviews.filter(r => r.rating === 5).length,
    responseRate: 100,
    trend: '+0%'
  };

  const filteredReviews = reviews
    .filter(review => 
      (filterRating === null || review.rating === filterRating) &&
      (searchTerm === '' || 
        review.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.session.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    const count = reviews.filter(r => r.rating === rating).length;
    const percentage = reviews.length ? (count / reviews.length) * 100 : 0;
    return { rating, count, percentage };
  });

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };
    
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
          </div>
        )}

        {!loading && error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
              Patient Reviews
            </h1>
          </div>
          <p className="text-slate-600 ml-7">Monitor and manage your patient feedback</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm font-medium">Average Rating</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-slate-800">{stats.avgRating}</span>
              <span className="text-sm text-green-600 font-medium mb-1">{stats.trend}</span>
            </div>
            <div className="mt-2">{renderStars(5, 'sm')}</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm font-medium">Total Reviews</span>
              <MessageCircle className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-4xl font-bold text-slate-800">{stats.totalReviews}</div>
            <div className="mt-2 text-sm text-slate-500">All time</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm font-medium">5-Star Reviews</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div className="text-4xl font-bold text-slate-800">{stats.fiveStarCount}</div>
            <div className="mt-2 text-sm text-slate-500">
              {((stats.fiveStarCount / stats.totalReviews) * 100).toFixed(0)}% of total
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rating Distribution */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Rating Distribution</h3>
            <div className="space-y-3">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium text-slate-700">{rating}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-slate-600 w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search reviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'recent' | 'rating')}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="rating">Highest Rating</option>
                  </select>
                  <select
                    value={filterRating || ''}
                    onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all hover:border-blue-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                        {review.patientName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-800">{review.patientName}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="w-3 h-3" />
                          <span>{review.responseTime}</span>
                          <span>•</span>
                          <span className="text-blue-600 font-medium">{review.session}</span>
                        </div>
                      </div>
                    </div>
                    {renderStars(review.rating, 'md')}
                  </div>
                  <p className="text-slate-700 leading-relaxed">{review.comment}</p>
                </div>
              ))}

              {filteredReviews.length === 0 && (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
                  <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No reviews match your filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapistReviewsDashboard;