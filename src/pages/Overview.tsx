"use client";

import { useMemo, useState, useEffect } from "react";
import { Activity, AlertTriangle, Clock, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import DomainFilter from "@/components/DomainFilter";
import { StatusBadge } from "@/components/StatusBadge";
import { getAnalytics, getLogs, getDomains, type AnalyticEntry, type LogEntry } from "@/lib/mock-data";

export default function Overview() {
  const [domain, setDomain] = useState("all");
  const [analytics, setAnalytics] = useState<AnalyticEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load(showLoading = false) {
      if (showLoading) setLoading(true);
      try {
        const [aData, lData, dData] = await Promise.all([
          getAnalytics(domain === "all" ? "All" : domain),
          getLogs(domain === "all" ? "All" : domain),
          getDomains(),
        ]);
        if (!cancelled) {
          setAnalytics(aData);
          setLogs(lData);
          setDomains(dData);
        }
      } catch (err) {
        if (!cancelled) console.error("Failed to fetch dashboard data:", err);
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

  console.log(analytics)
  console.log(logs)
  const filtered = useMemo(
    () => (domain === "all" ? analytics : analytics.filter((a) => a.domain_name === domain)),
    [domain, analytics]
  );

  const latestByDomain = useMemo(() => {
    const map = new Map<string, AnalyticEntry>();
    for (const entry of filtered) {
      const existing = map.get(entry.domain_name);
      if (!existing || new Date(entry.date) > new Date(existing.date)) {
        map.set(entry.domain_name, entry);
      }
    }
    return Array.from(map.values());
  }, [filtered]);

  const totalIncidents = useMemo(() => filtered.reduce((acc, a) => acc + a.incidents.length, 0), [filtered]);
  const avgLatency = useMemo(() => Math.round(filtered.reduce((acc, a) => acc + a.avg_latency, 0) / (filtered.length || 1)), [filtered]);
  const uptimePercent = useMemo(() => ((filtered.filter((a) => a.status === "healthy").length / (filtered.length || 1)) * 100).toFixed(1), [filtered]);
  const errorLogs = useMemo(() => logs.filter((l) => l.status_code >= 500).length, [logs]);

  const chartData = useMemo(() => {
    const hourMap = new Map<string, { hour: string; avg: number; max: number; count: number }>();
    for (const entry of filtered) {
      const hour = new Date(entry.date).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: false });
      const existing = hourMap.get(hour);
      if (existing) {
        existing.avg += entry.avg_latency;
        existing.max = Math.max(existing.max, entry.max_latency);
        existing.count++;
      } else {
        hourMap.set(hour, { hour, avg: entry.avg_latency, max: entry.max_latency, count: 1 });
      }
    }
    return Array.from(hourMap.values()).map((h) => ({ ...h, avg: Math.round(h.avg / h.count) }));
  }, [filtered]);

  if (loading) return <DashboardLayout><div>Loading dashboard...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time uptime monitoring overview</p>
        </div>

        <DomainFilter selected={domain} onChange={setDomain} domains={domains} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Uptime" value={`${uptimePercent}%`} subtitle="Last 24h" icon={Activity} variant="success" />
          <StatCard title="Avg Latency" value={`${avgLatency}ms`} subtitle="Across all endpoints" icon={Zap} />
          <StatCard title="Incidents" value={totalIncidents} subtitle="Last 24h" icon={AlertTriangle} variant={totalIncidents > 0 ? "danger" : "default"} />
          <StatCard title="5xx Errors" value={errorLogs} subtitle="Last 60 min" icon={Clock} variant={errorLogs > 5 ? "warning" : "default"} />
        </div>

        <div className="glass rounded-xl p-6">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Latency Over Time (24h)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 14%)" />
                <XAxis dataKey="hour" tick={{ fill: "hsl(0,0%,50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(0,0%,50%)", fontSize: 11 }} axisLine={false} tickLine={false} unit="ms" />
                <Tooltip contentStyle={{ background: "hsl(0,0%,7%)", border: "1px solid hsl(0,0%,14%)", borderRadius: 8, color: "hsl(0,0%,92%)" }} />
                <Area type="monotone" dataKey="avg" stroke="hsl(142, 71%, 45%)" fill="url(#avgGrad)" strokeWidth={2} name="Avg Latency" />
                <Area type="monotone" dataKey="max" stroke="hsl(0,0%,40%)" fill="transparent" strokeWidth={1} strokeDasharray="4 4" name="Max Latency" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Domain Status</h2>
          <div className="space-y-3">
            {latestByDomain.map((entry) => (
              <div key={entry.domain_name} className="flex items-center justify-between rounded-lg bg-accent/50 px-4 py-3">
                <span className="font-mono text-sm">{entry.domain_name}</span>
                <div className="flex items-center gap-6">
                  <span className="text-xs text-muted-foreground">{entry.avg_latency}ms avg</span>
                  <StatusBadge status={entry.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}