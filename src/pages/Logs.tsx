"use client";

import { useMemo, useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, ScatterChart, Scatter, ZAxis 
} from "recharts";
import DashboardLayout from "@/components/DashboardLayout";
import { getDomains } from "@/lib/mock-data";
import { getLogs } from "@/lib/mock-data";
// Assumindo que domains viria de uma fonte de dados ou constante
const domains = await getDomains();

interface LogEntry {
  id: string;
  date: string;
  domain: string;
  method: string;
  status_code: number;
  latency_ms: number;
}

// Helper para cores de status (exemplo básico)
const getStatusCodeColor = (code: number) => {
  if (code >= 500) return "text-red-500";
  if (code >= 400) return "text-orange-500";
  return "text-green-500";
};

export default function LogsPage() {
  const [domain, setDomain] = useState("all");
  const [method, setMethod] = useState("all");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      const data = await getLogs("All");
      setLogs(data);
      setLoading(false);
    }
    loadLogs();
  }, []);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const matchesDomain = domain === "all" || l.domain === domain;
      const matchesMethod = method === "all" || l.method === method;
      return matchesDomain && matchesMethod;
    });
  }, [logs, domain, method]);

  const minuteData = useMemo(() => {
    const map = new Map<string, { time: string; total: number; errors: number; avgLatency: number }>();
    for (const l of filtered) {
      const m = new Date(l.date).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: false });
      const ex = map.get(m);
      if (ex) { 
        ex.total++; 
        if (l.status_code >= 400) ex.errors++; 
        ex.avgLatency += l.latency_ms; 
      } else {
        map.set(m, { time: m, total: 1, errors: l.status_code >= 400 ? 1 : 0, avgLatency: l.latency_ms });
      }
    }
    return Array.from(map.values()).map((d) => ({ ...d, avgLatency: Math.round(d.avgLatency / d.total) }));
  }, [filtered]);

  const scatterData = useMemo(() => {
    return filtered.slice(0, 200).map((l) => ({ 
      time: new Date(l.date).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: false }), 
      latency: l.latency_ms, 
      status: l.status_code 
    }));
  }, [filtered]);

  if (loading) return <DashboardLayout><div>Loading logs...</div></DashboardLayout>;

 return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Logs</h2>
          <p className="text-sm text-muted-foreground mt-1">Request logs from /log — updated per minute</p>
        </div>
        <div className="flex gap-2">
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Domains</option>
            {domains.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Methods</option>
            {["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Requests vs Errors (per min)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={minuteData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,18%)" />
              <XAxis dataKey="time" tick={{ fill: "hsl(0,0%,55%)", fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(0,0%,10%)", border: "1px solid hsl(0,0%,18%)", borderRadius: 8, color: "hsl(0,0%,92%)" }} />
              <Bar dataKey="total" fill="hsl(160,60%,45%)" radius={[3, 3, 0, 0]} name="Total" />
              <Bar dataKey="errors" fill="hsl(0,70%,50%)" radius={[3, 3, 0, 0]} name="Errors" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Latency Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,18%)" />
              <XAxis dataKey="time" name="Minute" tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} />
              <YAxis dataKey="latency" name="Latency" unit="ms" tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} />
              <ZAxis range={[30, 30]} />
              <Tooltip contentStyle={{ background: "hsl(0,0%,10%)", border: "1px solid hsl(0,0%,18%)", borderRadius: 8, color: "hsl(0,0%,92%)" }} />
              <Scatter data={scatterData} fill="hsl(160,60%,45%)" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Recent Logs ({filtered.length})</h3>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 pr-4">Time</th>
                <th className="pb-3 pr-4">Domain</th>
                <th className="pb-3 pr-4">Method</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Latency</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((l, i) => (
                <tr key={l.id || i} className="border-b border-border/50 hover:bg-secondary/50">
                  <td className="py-2.5 pr-4 text-muted-foreground text-xs font-mono">
                    {new Date(l.date).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 pr-4 font-medium text-foreground">{l.domain}</td>
                  <td className="py-2.5 pr-4">
                    <span className="rounded bg-secondary px-2 py-0.5 text-xs font-mono text-secondary-foreground">
                      {l.method}
                    </span>
                  </td>
                  <td className={`py-2.5 pr-4 font-semibold ${getStatusCodeColor(l.status_code)}`}>
                    {l.status_code}
                  </td>
                  <td className="py-2.5 text-muted-foreground">{l.latency_ms}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}