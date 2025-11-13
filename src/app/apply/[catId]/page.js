'use client'
import { createClient } from '@sanity/client'
import Turnstile from '@marsidev/react-turnstile'
import { useState, useRef } from 'react'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: true
})

export default async function ApplyPage({ params }) {
  const cat = await client.fetch(
    `*[_type == "cat" && _id == $catId][0]{
      _id,
      name,
      age,
      gender,
      description,
      "imageUrl": image.asset->url
    }`,
    { catId: params.catId }
  )

  if (!cat) {
    return <div className="min-h-screen flex items-center justify-center">
      <p className="text-xl">Cat not found</p>
    </div>
  }

  return <ApplicationForm cat={cat} />
}

function ApplicationForm({ cat }) {
  const [formData, setFormData] = useState({
    applicantName: '',
    email: '',
    phone: '',
    address: '',
    housingType: '',
    hasOtherPets: false,
    otherPetsDetails: '',
    whyAdopt: '',
    experience: '',
    website: '' // Honeypot field
  })

  const [turnstileToken, setTurnstileToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const turnstileRef = useRef()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (!turnstileToken) {
      setError('Please complete the verification')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/submit-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          catId: cat._id,
          turnstileToken
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err.message)
      turnstileRef.current?.reset()
      setTurnstileToken('')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-4">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your interest in adopting {cat.name}. We'll review your application and get back to you within 24-48 hours.
          </p>
          <a href="/" className="text-blue-600 hover:underline">
            Return to Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold mb-4">Adopt {cat.name}</h1>
          {cat.imageUrl && (
            <img 
              src={cat.imageUrl} 
              alt={cat.name}
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
          )}
          <p className="text-gray-600 mb-2">{cat.age} • {cat.gender}</p>
          <p className="text-gray-700">{cat.description}</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Adoption Application</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="applicantName"
                value={formData.applicantName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="10-digit mobile number"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Housing Type
              </label>
              <select
                name="housingType"
                value={formData.housingType}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="own">Own House</option>
                <option value="rent">Rented Apartment</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="hasOtherPets"
                  checked={formData.hasOtherPets}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">I have other pets</span>
              </label>
            </div>

            {formData.hasOtherPets && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tell us about your other pets
                </label>
                <textarea
                  name="otherPetsDetails"
                  value={formData.otherPetsDetails}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Why do you want to adopt? * (minimum 50 characters)
              </label>
              <textarea
                name="whyAdopt"
                value={formData.whyAdopt}
                onChange={handleChange}
                required
                minLength="50"
                rows="4"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.whyAdopt.length}/50 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Experience with cats
              </label>
              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Honeypot field - hidden from users */}
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleChange}
              style={{ position: 'absolute', left: '-9999px' }}
              tabIndex="-1"
              autoComplete="off"
              aria-hidden="true"
            />

            {/* Turnstile verification */}
            <div className="flex justify-center">
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setError('Verification failed. Please try again.')}
                onExpire={() => setTurnstileToken('')}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !turnstileToken}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}