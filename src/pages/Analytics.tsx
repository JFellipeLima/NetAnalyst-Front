"use client";

import { useMemo, useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, LineChart, Line, Legend, PieChart, Pie, Cell 
} from "recharts";
import DashboardLayout from "@/components/DashboardLayout";
import DomainFilter from "@/components/DomainFilter";
import { StatusBadge } from "@/components/StatusBadge";
import { getAnalytics, getDomains, type AnalyticEntry } from "@/lib/mock-data";

const COLORS = ["hsl(142,71%,45%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)"];

export default function AnalyticsPage() {
  const [domain, setDomain] = useState("all");
  const [rawData, setRawData] = useState<AnalyticEntry[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load(showLoading = false) {
      if (showLoading) setLoading(true);
      try {
        const [data, dData] = await Promise.all([
          getAnalytics(domain === "all" ? "All" : domain),
          getDomains(),
        ]);

        if (!cancelled) {
          setRawData(data);
          setDomains(dData);
        }
      } catch (error) {
        if (!cancelled) console.error("Failed to fetch analytics:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load(true);
    const interval = setInterval(() => load(false), 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [domain]);

  const filtered = useMemo(() => {
    return domain === "all" ? rawData : rawData.filter((a) => a.domain_name === domain);
  }, [rawData, domain]);

  const hourlyData = useMemo(() => {
    const map = new Map<string, { hour: string; avg: number; min: number; max: number; count: number }>();
    for (const e of filtered) {
      const h = new Date(e.date).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: false });
      const ex = map.get(h);
      if (ex) { 
        ex.avg += e.avg_latency; 
        ex.min = Math.min(ex.min, e.min_latency); 
        ex.max = Math.max(ex.max, e.max_latency); 
        ex.count++; 
      } else {
        map.set(h, { hour: h, avg: e.avg_latency, min: e.min_latency, max: e.max_latency, count: 1 });
      }
    }
    return Array.from(map.values()).map((h) => ({ ...h, avg: Math.round(h.avg / h.count) }));
  }, [filtered]);

  const statusDist = useMemo(() => {
    const counts = { healthy: 0, degraded: 0, down: 0 };
    for (const e of filtered) {
      if (e.status in counts) counts[e.status as keyof typeof counts]++;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const incidentList = useMemo(() => {
    return filtered.filter((e) => e.incidents.length > 0).slice(0, 10);
  }, [filtered]);

  if (loading) {
    return <DashboardLayout><div>Loading analytics...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Hourly performance metrics from /analytic</p>
        </div>

        <DomainFilter selected={domain} onChange={setDomain} domains={domains} />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="glass rounded-xl p-6 lg:col-span-2">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Latency Breakdown (Hourly)</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,14%)" />
                  <XAxis dataKey="hour" tick={{ fill: "hsl(0,0%,50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(0,0%,50%)", fontSize: 11 }} axisLine={false} tickLine={false} unit="ms" />
                  <Tooltip contentStyle={{ background: "hsl(0,0%,7%)", border: "1px solid hsl(0,0%,14%)", borderRadius: 8, color: "hsl(0,0%,92%)" }} />
                  <Legend />
                  <Line type="monotone" dataKey="avg" stroke="hsl(142,71%,45%)" strokeWidth={2} dot={false} name="Avg" />
                  <Line type="monotone" dataKey="max" stroke="hsl(0,72%,51%)" strokeWidth={1.5} dot={false} name="Max" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="min" stroke="hsl(217,91%,60%)" strokeWidth={1.5} dot={false} name="Min" strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-xl p-6">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Status Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} strokeWidth={0}>
                    {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(0,0%,7%)", border: "1px solid hsl(0,0%,14%)", borderRadius: 8, color: "hsl(0,0%,92%)" }} />
                  <Legend formatter={(v) => <span className="capitalize text-muted-foreground text-xs">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Avg Latency by Hour</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,14%)" />
                <XAxis dataKey="hour" tick={{ fill: "hsl(0,0%,50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(0,0%,50%)", fontSize: 11 }} axisLine={false} tickLine={false} unit="ms" />
                <Tooltip contentStyle={{ background: "hsl(0,0%,7%)", border: "1px solid hsl(0,0%,14%)", borderRadius: 8, color: "hsl(0,0%,92%)" }} />
                <Bar dataKey="avg" fill="hsl(142,71%,45%)" radius={[4, 4, 0, 0]} name="Avg Latency" />
            </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {incidentList.length > 0 && (
          <div className="glass rounded-xl p-6">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Recent Incidents</h2>
            <div className="space-y-2">
              {incidentList.map((e, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-accent/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={e.status} />
                    <span className="font-mono text-sm">{e.domain_name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">{e.incidents[0]?.message}</span>
                    <span className="text-xs text-muted-foreground">{new Date(e.date).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}