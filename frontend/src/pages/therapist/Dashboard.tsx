import React, { useEffect, useState } from 'react';
import { Calendar, Users, DollarSign, Clock, User, Star, Phone, Video, ChevronRight, MessageSquare, TrendingUp, Bell } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { appointmentService } from '@/services/therapist/appointmentService';
import { walletService } from '@/services/shared/walletService';
import { notificationService } from '@/services/shared/notificationService';
import type { INotification } from '@/types/dtos/notification.dto';

interface Appointment {
  id: string;
  clientName: string;
  time: string;
  date: string;
  type: 'video' | 'phone';
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface Notification {
  id: string;
  type: 'appointment' | 'payment' | 'message' | 'review';
  message: string;
  time: string;
  read: boolean;
}

const TherapistDashboard: React.FC = () => {
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState([
    { label: 'Total Clients', value: '-', icon: Users, bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
    { label: 'Total Revenue', value: '-', icon: DollarSign, bgColor: 'bg-green-100', textColor: 'text-green-600' },
    { label: 'Total Sessions', value: '-', icon: Calendar, bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
    { label: 'This Month Revenue', value: '-', icon: TrendingUp, bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const earningsData = [
    { month: 'Jul', earnings: 6200 },
    { month: 'Aug', earnings: 7100 },
    { month: 'Sep', earnings: 7800 },
    { month: 'Oct', earnings: 8200 },
    { month: 'Nov', earnings: 8450 },
    { month: 'Dec', earnings: 9100 },
  ];

  const sessionStats = [
    { day: 'Mon', sessions: 6 },
    { day: 'Tue', sessions: 8 },
    { day: 'Wed', sessions: 5 },
    { day: 'Thu', sessions: 7 },
    { day: 'Fri', sessions: 9 },
    { day: 'Sat', sessions: 4 },
    { day: 'Sun', sessions: 2 },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'payment': return <DollarSign className="w-4 h-4" />;
      case 'message': return <MessageSquare className="w-4 h-4" />;
      case 'review': return <Star className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} h ago`;
    if (diffDays < 7) return `${diffDays} d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [appointmentsData, walletData, notificationsData] = await Promise.all([
          appointmentService.getAppointments(1, 50, 'all'),
          walletService.getUserWallet({ page: 1, limit: 50 }),
          notificationService.getNotifications(10),
        ]);

        const appointments = appointmentsData?.appointments ?? [];
        const todayIso = new Date().toISOString().split('T')[0];

        const mapAppointment = (apt: {
          id: string;
          clientName: string;
          sessionDate: string;
          sessionTime: string;
          status: string;
          sessionMode: string;
        }): Appointment => ({
          id: apt.id,
          clientName: apt.clientName,
          time: apt.sessionTime,
          date: apt.sessionDate,
          type: apt.sessionMode === 'phone' ? 'phone' : 'video',
          status: apt.status as 'scheduled' | 'completed' | 'cancelled',
        });

        const todays = appointments
          .filter((apt: { sessionDate: string }) => apt.sessionDate === todayIso)
          .map(mapAppointment);

        const upcoming = appointments
          .filter((apt: { sessionDate: string }) => apt.sessionDate > todayIso)
          .sort(
            (
              a: { sessionDate: string; sessionTime: string },
              b: { sessionDate: string; sessionTime: string }
            ) => {
            if (a.sessionDate === b.sessionDate) {
              return a.sessionTime.localeCompare(b.sessionTime);
            }
            return a.sessionDate.localeCompare(b.sessionDate);
          }
          )
          .slice(0, 3)
          .map(mapAppointment);

        setTodayAppointments(todays);
        setUpcomingSessions(upcoming);

        const statusCounts = appointmentsData?.statusCounts ?? {
          all: appointments.length,
          scheduled: 0,
          completed: 0,
          cancelled: 0,
        };

        const totalSessions = statusCounts.all;
        const totalRevenue = walletData?.statistics?.totalRevenue ?? 0;
        const thisMonthRevenue = walletData?.statistics?.thisMonthRevenue ?? 0;

        const uniqueClients = new Set(appointments.map((apt: { clientName?: string }) => apt.clientName || ''));
        const totalClients = uniqueClients.has('') ? uniqueClients.size - 1 : uniqueClients.size;

        setStats([
          {
            label: 'Total Clients',
            value: totalClients.toString(),
            icon: Users,
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-600',
          },
          {
            label: 'Total Revenue',
            value: `₹${totalRevenue.toLocaleString('en-IN')}`,
            icon: DollarSign,
            bgColor: 'bg-green-100',
            textColor: 'text-green-600',
          },
          {
            label: 'Total Sessions',
            value: totalSessions.toString(),
            icon: Calendar,
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-600',
          },
          {
            label: 'This Month Revenue',
            value: `₹${thisMonthRevenue.toLocaleString('en-IN')}`,
            icon: TrendingUp,
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-600',
          },
        ]);

        const mappedNotifications: Notification[] = (notificationsData ?? [])
          .map((n: INotification) => ({
            id: n._id,
            type: n.type === 'system' ? 'message' : n.type,
            message: n.content,
            time: formatRelativeTime(n.timestamp),
            read: n.isRead,
          }))
          .slice(0, 4);

        setNotifications(mappedNotifications);
      } catch (err) {
        console.error('Error loading therapist dashboard data:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Therapist Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Welcome back, Dr. Smith</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-600">
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header> */}

      <main className="p-4 lg:p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && !error && (
          <div className="mb-4 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Today's Appointments */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Today's Appointments</h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {todayAppointments.length === 0 ? (
                <div className="py-10 text-center text-gray-500">
                  <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <Calendar className="h-6 w-6 text-gray-400" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-900">No appointments for today</h4>
                  <p className="mt-1 text-xs text-gray-500">New bookings will appear here when scheduled for today.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                          appointment.type === 'video' ? 'bg-blue-100 text-blue-600' :
                          appointment.type === 'phone' ? 'bg-green-100 text-green-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          {getTypeIcon(appointment.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{appointment.clientName}</h4>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-1" />
                            {appointment.time}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                          Start
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Sessions & Recent Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Upcoming Sessions */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h3>
            </div>
            <div className="p-6">
              {upcomingSessions.length === 0 ? (
                <div className="py-10 text-center text-gray-500">
                  <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <Calendar className="h-6 w-6 text-gray-400" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-900">No upcoming sessions</h4>
                  <p className="mt-1 text-xs text-gray-500">Once new sessions are booked, you'll see them listed here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          session.type === 'video' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {getTypeIcon(session.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{session.clientName}</h4>
                          <p className="text-sm text-gray-600">
                            {formatDate(session.date)} 
                            <span className="mx-1">•</span>
                            {session.time}
                          </p>
                          <p className="text-xs text-gray-500">
                            {session.type === 'video' ? 'Video session' : 'Audio session'}
                          </p>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Mark all read
              </button>
            </div>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div key={notification.id} className={`flex items-start space-x-3 p-3 rounded-lg ${
                  notification.read ? 'bg-white' : 'bg-blue-50'
                }`}>
                  <div className={`p-2 rounded-lg ${
                    notification.type === 'appointment' ? 'bg-blue-100 text-blue-600' :
                    notification.type === 'payment' ? 'bg-green-100 text-green-600' :
                    notification.type === 'review' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Earnings Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Earnings Overview</h3>
              <p className="text-sm text-gray-600">Monthly earnings trend</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="earnings" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sessions Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Weekly Sessions</h3>
              <p className="text-sm text-gray-600">Sessions completed this week</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sessionStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sessions" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TherapistDashboard;