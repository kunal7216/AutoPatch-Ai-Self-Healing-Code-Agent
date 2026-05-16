import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { HomePage } from '../features/home/HomePage'
import { RepairPage } from '../features/repair/RepairPage'
import { RunsPage } from '../features/runs/RunsPage'
import { RunDetailPage } from '../features/runs/RunDetailPage'
import { MemoryPage } from '../features/memory/MemoryPage'
import { AnalyticsPage } from '../features/analytics/AnalyticsPage'
import { DemoCasesPage } from '../features/demoCases/DemoCasesPage'
import { ArchitecturePage } from '../features/architecture/ArchitecturePage'
import { SettingsPage } from '../features/settings/SettingsPage'

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/repair" element={<RepairPage />} />
        <Route path="/runs" element={<RunsPage />} />
        <Route path="/runs/:runId" element={<RunDetailPage />} />
        <Route path="/memory" element={<MemoryPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/demo-cases" element={<DemoCasesPage />} />
        <Route path="/architecture" element={<ArchitecturePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}
