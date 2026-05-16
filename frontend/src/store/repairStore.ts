import { create } from 'zustand'
import type { Language, RunDetail, SSENodeEvent } from '../types'

interface RepairFormState {
  language: Language
  sourceCode: string
  testCode: string
  dependencyFile: string
  maxIterations: number
  useMemory: boolean
  useWebSearch: boolean
}

interface RepairState {
  form: RepairFormState
  runId: string | null
  isRunning: boolean
  currentNode: string | null
  currentIteration: number
  logs: string[]
  result: RunDetail | null
  events: Array<{ type: string; data: unknown; ts: number }>

  setForm: (partial: Partial<RepairFormState>) => void
  setRunId: (id: string) => void
  setRunning: (v: boolean) => void
  setCurrentNode: (node: string | null) => void
  setCurrentIteration: (n: number) => void
  addLog: (msg: string) => void
  setResult: (r: RunDetail | null) => void
  pushEvent: (type: string, data: unknown) => void
  reset: () => void
}

const defaultForm: RepairFormState = {
  language: 'PYTHON',
  sourceCode: '',
  testCode: '',
  dependencyFile: '',
  maxIterations: 5,
  useMemory: true,
  useWebSearch: true,
}

export const useRepairStore = create<RepairState>((set) => ({
  form: { ...defaultForm },
  runId: null,
  isRunning: false,
  currentNode: null,
  currentIteration: 0,
  logs: [],
  result: null,
  events: [],

  setForm: (partial) => set((s) => ({ form: { ...s.form, ...partial } })),
  setRunId: (id) => set({ runId: id }),
  setRunning: (v) => set({ isRunning: v }),
  setCurrentNode: (node) => set({ currentNode: node }),
  setCurrentIteration: (n) => set({ currentIteration: n }),
  addLog: (msg) => set((s) => ({ logs: [...s.logs.slice(-200), msg] })),
  setResult: (r) => set({ result: r }),
  pushEvent: (type, data) =>
    set((s) => ({ events: [...s.events.slice(-100), { type, data, ts: Date.now() }] })),
  reset: () =>
    set({
      runId: null,
      isRunning: false,
      currentNode: null,
      currentIteration: 0,
      logs: [],
      result: null,
      events: [],
    }),
}))
