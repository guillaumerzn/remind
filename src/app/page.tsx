'use client'

import { Suspense } from 'react'
import DashboardContent from '../components/DashboardContent'

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
} 