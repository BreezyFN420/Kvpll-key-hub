import { Sidebar } from "@/components/Sidebar";
import { StatsCard } from "@/components/StatsCard";
import { useStats } from "@/hooks/use-admin";
import { Key, ShieldBan, CheckCircle2, Users } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area
} from "recharts";

export default function Dashboard() {
  const { data: stats, isLoading } = useStats();

  // Mock data for charts since we don't have historical data endpoint yet
  // In a real app, this would come from the API
  const activityData = [
    { name: 'Mon', validations: 40 },
    { name: 'Tue', validations: 30 },
    { name: 'Wed', validations: 20 },
    { name: 'Thu', validations: 27 },
    { name: 'Fri', validations: 18 },
    { name: 'Sat', validations: 23 },
    { name: 'Sun', validations: 34 },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      <div className="ml-64 flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
          <p className="text-muted-foreground mt-2">Real-time monitoring of key usage and security.</p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-card rounded-xl border border-border" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                label="Total Keys"
                value={stats?.totalKeys || 0}
                icon={Key}
                trend="+12% this week"
                delay={0}
              />
              <StatsCard
                label="Active Keys"
                value={stats?.activeKeys || 0}
                icon={CheckCircle2}
                trend="94% active rate"
                delay={100}
              />
              <StatsCard
                label="Total Validations"
                value={stats?.totalValidations || 0}
                icon={Users}
                trend="Usage spiking"
                delay={200}
              />
              <StatsCard
                label="Banned Users"
                value={stats?.bannedUsers || 0}
                icon={ShieldBan}
                trend="2 new today"
                delay={300}
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-grid-fade" style={{ animationDelay: '400ms' }}>
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-6">Validation Activity</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px' 
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="validations" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorVal)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-6">Key Distribution</h3>
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-muted-foreground">Detailed analytics coming in v2.0</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
