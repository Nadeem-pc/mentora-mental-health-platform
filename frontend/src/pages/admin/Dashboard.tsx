import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, UserCheck, Calendar, DollarSign, TrendingUp, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { adminDashboardService, type AdminDashboardResponse, type AdminDashboardTimeframe } from '@/services/admin/dashboardService';

const AdminDashboard = () => {
  const [timeframe, setTimeframe] = useState<AdminDashboardTimeframe>('month');
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await adminDashboardService.getDashboard(timeframe);
        if (!cancelled) {
          setDashboard(data);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const err = e as { response?: { data?: { message?: string } }; message?: string };
          setError(err?.response?.data?.message || err?.message || 'Failed to load dashboard');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, [timeframe]);

  const platformMetrics = dashboard?.platformMetrics;
  const newSignupsData = dashboard?.newSignupsData ?? [];
  const consultationModeData = dashboard?.consultationModeData ?? [];
  const topTherapists = dashboard?.topTherapists ?? [];

  const issueColors = useMemo(
    () => ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'],
    []
  );

  useMemo(
    () => (dashboard?.issueData ?? []).map((d, idx) => ({ ...d, color: issueColors[idx % issueColors.length] })),
    [dashboard?.issueData, issueColors]
  );

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, iconColor }: {
    title: string;
    value: React.ReactNode;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: string;
    iconColor: string;
  }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {trend && (
          <Badge variant="secondary" className="mt-2 bg-green-50 text-green-700 hover:bg-green-100">
            <TrendingUp className="w-3 h-3 mr-1" />
            {trend}
          </Badge>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Therapy Platform Analytics</p>
            </div>
            <Select value={timeframe} onValueChange={(value) => setTimeframe(value as AdminDashboardTimeframe)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6">
            <Card>
              <CardContent className="py-4 text-sm text-red-600">
                {error}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Platform Overview */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Platform Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title="Total Clients" 
              value={loading ? '—' : (platformMetrics?.totalClients ?? 0).toLocaleString()}
              icon={Users}
              trend="+12%"
              iconColor="text-purple-600"
            />
            <MetricCard 
              title="Total Therapists" 
              value={loading ? '—' : (platformMetrics?.totalTherapists ?? 0).toLocaleString()}
              icon={UserCheck}
              trend="+5%"
              iconColor="text-blue-600"
            />
            <MetricCard 
              title="Sessions Completed" 
              value={loading ? '—' : (platformMetrics?.sessionsCompleted ?? 0).toLocaleString()}
              icon={Calendar}
              iconColor="text-green-600"
            />
            <MetricCard 
              title="Revenue" 
              value={loading ? '—' : `₹${(platformMetrics?.revenuePeriod ?? 0).toLocaleString()}`}
              icon={DollarSign}
              trend="+18%"
              iconColor="text-amber-600"
            />
          </div>
        </section>

        {/* Client Analytics */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Client Analytics</h2>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>New Client Signups (Daily)</CardTitle>
                <CardDescription>Weekly overview of new client registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={newSignupsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="signups" stroke="#8B5CF6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          {/* </div> */}

          {/* <div className="grid grid-cols-2 gap-6"> */}
            {/* <Card>
              <CardHeader>
                <CardTitle>Clients by Issue Category</CardTitle>
                <CardDescription>Distribution of client concerns</CardDescription>
              </CardHeader>
              <CardContent>
                {issueData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                    No issue category data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={issueData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {issueData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card> */}

            <Card>
              <CardHeader>
                <CardTitle>Consultation Mode Preferences</CardTitle>
                <CardDescription>How clients prefer to connect</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={consultationModeData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="value" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Therapist Analytics */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Therapist Analytics</h2>
          
          {/* <Card className="mb-6 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950">
            <CardHeader>
              <CardTitle className="text-center">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-8">
                <div className="flex items-center justify-center">
                  <Star className="w-48 h-48 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-8xl font-bold text-yellow-600">
                    {dashboard?.averageRating != null ? dashboard.averageRating.toFixed(1) : '—'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card> */}

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Therapists</CardTitle>
              <CardDescription>Highest rated therapists by performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-sm">Therapist</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Rating</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Sessions</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTherapists.map((therapist, index) => (
                      <tr key={index} className="border-b hover:bg-accent transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                              <span className="text-purple-600 dark:text-purple-300 font-semibold">
                                {(therapist.name?.split(' ')?.[1]?.[0] || therapist.name?.[0] || '?')}
                              </span>
                            </div>
                            <span className="font-medium">{therapist.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold">{therapist.rating ?? '—'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{therapist.sessions}</td>
                        <td className="py-3 px-4 text-right font-semibold text-green-600">
                          ₹{therapist.revenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;