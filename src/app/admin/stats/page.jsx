'use client'

import { useState, useEffect } from 'react'
import { getApiHeaders, getApiUrl } from '@/lib/auth'

export default function AdminStats() {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    number: '',
    label: '',
    icon: 'users'
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/impact-stats`)

      if (response.ok) {
        const data = await response.json()
        setStats(Array.isArray(data) ? data : [])
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
        window.location.href = '/admin/login'
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error fetching stats:', errorData.message || 'Failed to load stats')
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const apiUrl = getApiUrl()
    const url = formData.id
      ? `${apiUrl}/api/admin/impact-stats/${formData.id}`
      : `${apiUrl}/api/admin/impact-stats`

    try {
      const response = await fetch(url, {
        method: formData.id ? 'PUT' : 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          number: formData.number,
          label: formData.label,
          icon: formData.icon
        }),
      })

      if (response.ok) {
        fetchStats()
        setShowForm(false)
        setFormData({ number: '', label: '', icon: 'users' })
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
        window.location.href = '/admin/login'
      }
    } catch (error) {
      console.error('Error saving stat:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this stat?')) return

    try {
      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/admin/impact-stats/${id}`, {
        method: 'DELETE',
        headers: getApiHeaders(),
      })

      if (response.ok) {
        fetchStats()
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
        window.location.href = '/admin/login'
      }
    } catch (error) {
      console.error('Error deleting stat:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="w-full min-h-screen bg-blue-950 space-y-6 sm:space-y-8 p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-heading font-bold text-white">Impact Statistics</h1>
        <button
          onClick={() => {
            setShowForm(true)
            setFormData({ number: '', label: '', icon: 'users' })
          }}
          className="btn-primary"
        >
          + Add Stat
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Stat</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number</label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                required
                placeholder="e.g., 2500+"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                required
                placeholder="e.g., Students Mentored"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="users">Users</option>
                <option value="building">Building</option>
                <option value="crown">Crown</option>
                <option value="calendar">Calendar</option>
              </select>
            </div>
            <div className="flex space-x-4">
              <button type="submit" className="btn-primary">Save</button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setFormData({ number: '', label: '', icon: 'users' })
                }}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.id} className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
            <div className="text-gray-600 mb-4">{stat.label}</div>
            <button
              onClick={() => handleDelete(stat.id)}
              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
