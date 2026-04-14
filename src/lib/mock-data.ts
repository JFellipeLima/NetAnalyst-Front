// Mock data generators for analytics and logs
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function getDomains(): Promise<string[]> {
  const domains = await axios.post(
    `${API_URL}/domains`
  ).then((response) => response.data);
  return domains;
}

export async function getLogs(domain_name: string): Promise<LogEntry[]> {
  const logs = await axios.post(`${API_URL}/log`, {
    domain_name: domain_name
  }).then((response) => response.data);
  return logs;
}

export async function getAnalytics(domain_name: string): Promise<AnalyticEntry[]> {
  const analytics = await axios.post(`${API_URL}/analytic`, {
    domain_name: domain_name
  }).then((response) => response.data);
  return analytics;
}

export interface AnalyticEntry {
  domain_name: string;
  max_latency: number;
  min_latency: number;
  avg_latency: number;
  incidents: { type: string; message: string; timestamp: string }[];
  status: string;
  date: string;
}

export interface LogEntry {
  id: string;
  domain: string;
  status_code: number;
  date: string;
  latency_ms: number;
  method: string;
}

export function getStatusColor(status: string) {
  if (status === "healthy") return "text-primary";
  if (status === "degraded") return "text-warning";
  return "text-destructive";
}

export function getStatusCodeColor(code: number) {
  if (code < 300) return "text-primary";
  if (code < 400) return "text-warning";
  return "text-destructive";
}

export const DOMAINS = await getDomains();

