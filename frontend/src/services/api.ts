import axios from 'axios'
import type {
  RepairRequest, RepairResponse, RunDetail, RunSummary,
  MemoryRecord, AnalyticsSummary, DemoCase, SettingsData,
} from '../types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

// Repair
export const repairService = {
  submit: (req: RepairRequest) => api.post<RepairResponse>('/repair', req).then(r => r.data),
  getResult: (runId: string) => api.get<RunDetail>(`/repair/${runId}`).then(r => r.data),
  streamEvents: (runId: string) => new EventSource(`${BASE_URL}/api/v1/repair/${runId}/events`),
}

// Runs
export const runService = {
  list: (params?: { limit?: number; offset?: number; language?: string; status?: string; passed?: boolean }) =>
    api.get<RunSummary[]>('/runs', { params }).then(r => r.data),
  get: (runId: string) => api.get<RunDetail>(`/runs/${runId}`).then(r => r.data),
}

// Memory
export const memoryService = {
  search: (query: string, language?: string, error_type?: string, limit = 10) =>
    api.post<MemoryRecord[]>('/memory/search', { query, language, error_type, limit }).then(r => r.data),
}

// Analytics
export const analyticsService = {
  summary: () => api.get<AnalyticsSummary>('/analytics/summary').then(r => r.data),
  trends: (days = 30) => api.get('/analytics/repair-trends', { params: { days } }).then(r => r.data),
  errorDistribution: () => api.get('/analytics/error-distribution').then(r => r.data),
  languageUsage: () => api.get('/analytics/language-usage').then(r => r.data),
  confidenceTrend: (days = 30) => api.get('/analytics/confidence-trend', { params: { days } }).then(r => r.data),
}

// Demo Cases
export const demoCaseService = {
  list: () => api.get<DemoCase[]>('/demo-cases').then(r => r.data),
  get: (id: string) => api.get<DemoCase>(`/demo-cases/${id}`).then(r => r.data),
}

// Settings
export const settingsService = {
  get: () => api.get<SettingsData>('/settings').then(r => r.data),
}

// Health
export const healthCheck = () =>
  axios.get(`${BASE_URL}/health`).then(r => r.data).catch(() => null)
