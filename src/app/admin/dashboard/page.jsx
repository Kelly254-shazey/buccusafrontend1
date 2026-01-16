'use client'

import { useState, useEffect } from 'react'
import { getApiHeaders, getApiUrl } from '@/lib/auth'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recentContacts, setRecentContacts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/admin/dashboard`, {
        headers: getApiHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || data)
        setRecentContacts(data.recentContacts || [])
      } else if (response.status === 401) {
        // Token expired or invalid, redirect to login
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
        window.location.href = '/admin/login'
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Dashboard error:', errorData.message || 'Failed to load dashboard')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Don't show error to user, just log it
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Contacts', value: stats?.totalContacts || 0, color: 'bg-blue-500' },
    { label: 'Total Programs', value: stats?.totalPrograms || 0, color: 'bg-green-500' },
    { label: 'Total Testimonials', value: stats?.totalTestimonials || 0, color: 'bg-purple-500' },
  ]

  return (
    <div className="w-full min-h-screen bg-blue-950 space-y-6 sm:space-y-8 p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-heading font-bold text-white mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl`}>
                📊
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Contacts */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 overflow-hidden">
        <h2 className="text-xl font-heading font-semibold text-primary mb-4">Recent Contact Submissions</h2>
        {recentContacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-gray-700">Subject</th>
                  <th className="text-left py-3 px-4 text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentContacts.map((contact) => (
                  <tr key={contact.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{contact.name}</td>
                    <td className="py-3 px-4">{contact.email}</td>
                    <td className="py-3 px-4">{contact.subject || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No recent contacts</p>
        )}
      </div>
    </div>
  )
}
