import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  delay?: number;
}

export function StatsCard({ label, value, icon: Icon, trend, delay = 0 }: StatsCardProps) {
  return (
    <div 
      className="bg-card border border-border rounded-xl p-6 shadow-lg relative overflow-hidden group hover:border-primary/50 transition-colors duration-300 animate-grid-fade"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-24 h-24 text-primary" />
      </div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <h3 className="text-3xl font-bold font-mono mt-2 text-foreground">{value}</h3>
          {trend && (
            <p className="text-xs text-primary mt-1 font-medium bg-primary/10 inline-block px-2 py-0.5 rounded">
              {trend}
            </p>
          )}
        </div>
        <div className="bg-primary/10 p-3 rounded-lg text-primary">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
