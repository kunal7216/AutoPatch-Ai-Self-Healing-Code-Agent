import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { analyticsService } from '../../services/api'
import { Card, StatCard, Skeleton } from '../../components/ui'

const COLORS = ['#388bfd', '#3fb950', '#f85149', '#d29922', '#bc8cff', '#f0883e']

const tooltipStyle = {
  contentStyle: { background: '#1c2128', border: '1px solid #30363d', borderRadius: 6, fontSize: 11 },
  labelStyle: { color: '#7d8590' },
}

export function AnalyticsPage() {
  const { data: summary, isLoading: sLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: analyticsService.summary,
    refetchInterval: 30_000,
  })
  const { data: trends } = useQuery({
    queryKey: ['analytics-trends'],
    queryFn: () => analyticsService.trends(30),
    refetchInterval: 60_000,
  })
  const { data: errorDist } = useQuery({
    queryKey: ['analytics-errors'],
    queryFn: analyticsService.errorDistribution,
    refetchInterval: 60_000,
  })
  const { data: langUsage } = useQuery({
    queryKey: ['analytics-language'],
    queryFn: analyticsService.languageUsage,
    refetchInterval: 60_000,
  })
  const { data: confTrend } = useQuery({
    queryKey: ['analytics-confidence'],
    queryFn: () => analyticsService.confidenceTrend(30),
    refetchInterval: 60_000,
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Analytics</h1>
        <p className="text-sm text-text-secondary mt-0.5">Repair performance and trends</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {sLoading ? (
          Array.from({ length: 9 }).map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-8 w-16" /></Card>)
        ) : summary ? (
          <>
            <StatCard label="Total Repairs" value={summary.total_repairs} />
            <StatCard label="Successful" value={summary.successful_repairs} color="text-accent-green" />
            <StatCard label="Failed" value={summary.failed_repairs} color="text-accent-red" />
            <StatCard label="Success Rate" value={`${summary.success_rate}%`} color="text-accent-blue" />
            <StatCard label="Avg Confidence" value={`${(summary.average_confidence * 100).toFixed(1)}%`} />
            <StatCard label="Avg Iterations" value={summary.average_iterations.toFixed(1)} />
            <StatCard label="Memory Hits" value={summary.memory_hits} color="text-accent-purple" />
            <StatCard label="Python" value={summary.python_repairs} color="text-accent-blue" />
            <StatCard label="Java" value={summary.java_repairs} color="text-accent-orange" />
          </>
        ) : null}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Repair trends */}
        <Card className="p-4">
          <div className="text-xs font-medium text-text-secondary mb-4">Repair Runs (30 days)</div>
          {trends && trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#7d8590' }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 9, fill: '#7d8590' }} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="total" stroke="#388bfd" dot={false} name="Total" strokeWidth={2} />
                <Line type="monotone" dataKey="successful" stroke="#3fb950" dot={false} name="Passed" strokeWidth={2} />
                <Line type="monotone" dataKey="failed" stroke="#f85149" dot={false} name="Failed" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-xs text-text-muted">
              No data yet — run some repairs first
            </div>
          )}
        </Card>

        {/* Confidence trend */}
        <Card className="p-4">
          <div className="text-xs font-medium text-text-secondary mb-4">Confidence Trend (30 days)</div>
          {confTrend && confTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={confTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#7d8590' }} tickFormatter={d => d.slice(5)} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 9, fill: '#7d8590' }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, 'Avg Confidence']} />
                <Line type="monotone" dataKey="average_confidence" stroke="#bc8cff" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-xs text-text-muted">
              No data yet
            </div>
          )}
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Error distribution */}
        <Card className="p-4">
          <div className="text-xs font-medium text-text-secondary mb-4">Error Type Distribution</div>
          {errorDist && errorDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={errorDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#7d8590' }} />
                <YAxis type="category" dataKey="error_type" tick={{ fontSize: 9, fill: '#7d8590' }} width={120} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill="#388bfd" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-text-muted">
              No error data yet
            </div>
          )}
        </Card>

        {/* Language usage */}
        <Card className="p-4">
          <div className="text-xs font-medium text-text-secondary mb-4">Language Usage</div>
          {langUsage && langUsage.length > 0 && langUsage.some((l: any) => l.count > 0) ? (
            <div className="flex gap-6 items-center justify-center h-48">
              <ResponsiveContainer width="60%" height={180}>
                <PieChart>
                  <Pie
                    data={langUsage}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    dataKey="count"
                    nameKey="language"
                    paddingAngle={3}
                  >
                    {langUsage.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {langUsage.map((l: any, i: number) => (
                  <div key={l.language}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-text-primary">{l.language}</span>
                    </div>
                    <div className="text-[10px] text-text-muted ml-4.5">{l.count} runs · {l.success_rate}% pass</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-text-muted">
              No language data yet
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
