'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getApiHeaders, getApiUrl } from '@/lib/auth'

export default function AdminEvents() {
  const [events, setEvents] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    image_url: '',
    is_upcoming: true
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/admin/events`, {
        headers: getApiHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        setEvents(data.sort((a, b) => {
          if (a.is_upcoming === b.is_upcoming) {
            return new Date(b.event_date) - new Date(a.event_date)
          }
          return a.is_upcoming ? -1 : 1
        }))
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      setError('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      setError('Please upload a JPEG, PNG, or GIF image')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setImagePreview(event.target?.result)
    }
    reader.readAsDataURL(file)

    setUploadingImage(true)
    setError('')

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formDataUpload,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, image_url: data.url }))
        setSuccess('Image uploaded successfully!')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to upload image')
        setImagePreview(null)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      setError('An error occurred while uploading the image')
      setImagePreview(null)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const apiUrl = getApiUrl()
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId
        ? `${apiUrl}/api/admin/events/${editingId}`
        : `${apiUrl}/api/admin/events`

      const response = await fetch(url, {
        method,
        headers: getApiHeaders(),
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess(editingId ? 'Event updated successfully!' : 'Event created successfully!')
        setFormData({
          title: '',
          description: '',
          event_date: '',
          location: '',
          image_url: '',
          is_upcoming: true
        })
        setEditingId(null)
        fetchEvents()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to save event')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('An error occurred while saving')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (event) => {
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date || '',
      location: event.location || '',
      image_url: event.image_url || '',
      is_upcoming: event.is_upcoming
    })
    setImagePreview(event.image_url)
    setEditingId(event.id)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/admin/events/${id}`, {
        method: 'DELETE',
        headers: getApiHeaders(),
      })

      if (response.ok) {
        setSuccess('Event deleted successfully!')
        fetchEvents()
      } else {
        setError('Failed to delete event')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('An error occurred while deleting')
    }
  }

  const handleCancel = () => {
    setFormData({
      title: '',
      description: '',
      event_date: '',
      location: '',
      image_url: '',
      is_upcoming: true
    })
    setImagePreview(null)
    setEditingId(null)
  }

  return (
    <div className="w-full min-h-screen bg-blue-950 space-y-6 sm:space-y-8 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Manage Events</h1>
        <p className="text-sm sm:text-base text-gray-300">Create, edit, or remove events and activities</p>
      </motion.div>

      {/* Form Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8"
      >
        <h2 className="text-lg sm:text-xl font-bold text-primary mb-4 sm:mb-6">
          {editingId ? 'Edit Event' : 'Create New Event'}
        </h2>

        {error && (
          <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm sm:text-base">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm sm:text-base">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Event title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
              <input
                type="datetime-local"
                name="event_date"
                value={formData.event_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Event location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Event description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Image</label>
            <div className="space-y-3">
              {/* Image Preview */}
              {imagePreview && (
                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-primary">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null)
                      setFormData(prev => ({ ...prev, image_url: '' }))
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Upload Area */}
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-xs sm:text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </label>

              {uploadingImage && (
                <div className="text-center text-sm text-blue-600">Uploading image...</div>
              )}

              {/* Fallback URL input */}
              <div className="text-sm text-gray-500 border-t pt-3">
                <p className="mb-2">Or paste image URL:</p>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="is_upcoming"
                checked={formData.is_upcoming}
                onChange={handleChange}
                className="w-5 h-5 text-primary rounded focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700">Mark as Upcoming</span>
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingId ? 'Update Event' : 'Create Event'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </motion.div>

      {/* Events List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-lg p-8"
      >
        <h2 className="text-xl font-bold text-primary mb-6">Events ({events.length})</h2>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No events yet. Create one above!</div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <motion.div
                key={event.id}
                whileHover={{ x: 5 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {event.image_url && (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-32 object-cover rounded-lg md:col-span-1"
                    />
                  )}
                  <div className={event.image_url ? 'md:col-span-3' : 'md:col-span-4'}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-primary text-lg">{event.title}</h3>
                        <p className="text-gray-600 text-sm">{event.location}</p>
                      </div>
                      {event.is_upcoming && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          Upcoming
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm mb-2 line-clamp-2">{event.description}</p>
                    <p className="text-gray-500 text-xs mb-4">
                      📅 {new Date(event.event_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(event)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
