import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, Menu, BarChart3, ClipboardList } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { format } from 'date-fns';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { analytics, loading } = useAnalytics();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">
              Welcome, {user.email}
            </h1>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/edit-menu')}>
            <CardContent className="p-6 text-center">
              <Menu className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-medium mb-1">Edit Menu</h3>
              <p className="text-sm text-muted-foreground">Add or update menu items</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/orders')}>
            <CardContent className="p-6 text-center">
              <ClipboardList className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-medium mb-1">View Orders</h3>
              <p className="text-sm text-muted-foreground">Manage incoming orders</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/analytics')}>
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-medium mb-1">Analytics</h3>
              <p className="text-sm text-muted-foreground">View sales reports</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/qr-code')}>
            <CardContent className="p-6 text-center">
              <QrCode className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-medium mb-1">QR Code</h3>
              <p className="text-sm text-muted-foreground">Download menu QR code</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Overview */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Analytics Overview</h2>

          {loading ? (
            <div className="text-center">Loading analytics...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold">{analytics.totalOrders}</h3>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold">KSh {analytics.totalRevenue.toFixed(2)}</h3>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold">KSh {analytics.averageOrderValue.toFixed(2)}</h3>
                  <p className="text-sm text-muted-foreground">Average Order Value</p>
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        {/* Sales Trends */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Sales Trends</h2>

          {loading ? (
            <div className="text-center">Loading sales trends...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium mb-4">Daily Orders (Last 7 Days)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left">
                          <th className="py-2">Date</th>
                          <th className="py-2">Orders</th>
                          <th className="py-2">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.dailyOrders.map((day) => (
                          <tr key={day.date}>
                            <td className="py-2">{format(new Date(day.date), 'MMM dd')}</td>
                            <td className="py-2">{day.orders}</td>
                            <td className="py-2">KSh {day.revenue.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium mb-4">Monthly Revenue (Last 6 Months)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left">
                          <th className="py-2">Month</th>
                          <th className="py-2">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.monthlyRevenue.map((month) => (
                          <tr key={month.month}>
                            <td className="py-2">{month.month}</td>
                            <td className="py-2">KSh {month.revenue.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        {/* Popular Items */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Popular Items</h2>

          {loading ? (
            <div className="text-center">Loading popular items...</div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">Top 5 Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left">
                        <th className="py-2">Item</th>
                        <th className="py-2">Orders</th>
                        <th className="py-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.popularItems.map((item) => (
                        <tr key={item.name}>
                          <td className="py-2">{item.name}</td>
                          <td className="py-2">{item.orders}</td>
                          <td className="py-2">KSh {item.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
