import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './app/App'
import './styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000 },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1c2128',
              color: '#e6edf3',
              border: '1px solid #30363d',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
