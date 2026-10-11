"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TEAL = "#2c6e6a";
const NAVY = "#1e3a57";
const LEAF = "#3c7a4c";
const ROSE = "#a3271f";
const GRID = "#d9e3e2";
const AXIS = { fontSize: 12, fill: "#52657a" };

function Frame({ title, empty, children, height = 240 }: { title: string; empty: boolean; children: React.ReactElement; height?: number }) {
  return (
    <figure className="rounded-[var(--radius-panel)] border border-line bg-paper p-4">
      <figcaption className="mb-3 text-sm font-semibold text-navy-900">{title}</figcaption>
      {empty ? (
        <div className="grid place-items-center rounded-[var(--radius-control)] bg-mist text-sm text-muted" style={{ height }}>
          No records in this period yet
        </div>
      ) : (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
        </div>
      )}
    </figure>
  );
}

const inr = (v: number) => `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(v)}`;
const allZero = (rows: Record<string, unknown>[], keys: string[]) => rows.every((r) => keys.every((k) => !r[k]));

export function LeadsByMonthChart({ data }: { data: { month: string; leads: number }[] }) {
  return (
    <Frame title="Monthly lead volume" empty={allZero(data, ["leads"])}>
      <BarChart data={data} margin={{ left: -20 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="month" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: "#eaf4f2" }} />
        <Bar dataKey="leads" name="Leads" fill={TEAL} radius={[4, 4, 0, 0]} />
      </BarChart>
    </Frame>
  );
}

export function CategoryBarChart({ title, data, color = NAVY }: { title: string; data: { name: string; value: number }[]; color?: string }) {
  return (
    <Frame title={title} empty={allZero(data, ["value"])} height={Math.max(160, data.length * 38)}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 16 }}>
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis type="number" allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" width={150} tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: "#eaf4f2" }} />
        <Bar dataKey="value" name="Leads" fill={color} radius={[0, 4, 4, 0]} />
      </BarChart>
    </Frame>
  );
}

export function ConversionChart({ data }: { data: { stage: string; value: number }[] }) {
  return (
    <Frame title="Lead to assignment conversion" empty={allZero(data, ["value"])}>
      <BarChart data={data} margin={{ left: -20 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="stage" tick={AXIS} tickLine={false} axisLine={false} interval={0} />
        <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: "#eaf4f2" }} />
        <Bar dataKey="value" name="Leads" fill={TEAL} radius={[4, 4, 0, 0]} />
      </BarChart>
    </Frame>
  );
}

export function OutcomesChart({ data }: { data: { month: string; completed: number; cancelled: number }[] }) {
  return (
    <Frame title="Completed and cancelled assignments" empty={allZero(data, ["completed", "cancelled"])}>
      <BarChart data={data} margin={{ left: -20 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="month" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: "#eaf4f2" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="completed" name="Completed" fill={LEAF} radius={[4, 4, 0, 0]} />
        <Bar dataKey="cancelled" name="Cancelled" fill={ROSE} radius={[4, 4, 0, 0]} />
      </BarChart>
    </Frame>
  );
}

export function MoneyChart({ data }: { data: { month: string; collections: number; commission: number }[] }) {
  return (
    <Frame title="Customer collections and commission" empty={allZero(data, ["collections", "commission"])}>
      <LineChart data={data} margin={{ left: 10, right: 10 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="month" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={inr} tick={AXIS} tickLine={false} axisLine={false} width={80} />
        <Tooltip formatter={(v) => inr(Number(v))} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="linear" dataKey="collections" name="Collections" stroke={TEAL} strokeWidth={2} dot={{ r: 3 }} />
        <Line type="linear" dataKey="commission" name="Commission" stroke={NAVY} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </Frame>
  );
}
