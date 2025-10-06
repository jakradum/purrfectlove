'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { Turnstile } from '@marsidev/react-turnstile'

export default function ApplyPage({ params }) {
  const router = useRouter()
  const [cat, setCat] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [formData, setFormData] = useState({
    applicantName: '',
    email: '',
    phone: '',
    address: '',
    housingType: '',
    hasOtherPets: false,
    otherPetsDetails: '',
    whyAdopt: '',
    experience: ''
  })

  // Fetch cat data
  useEffect(() => {
    const fetchCat = async () => {
      try {
        const catData = await client.fetch(
          `*[_type == "cat" && _id == $catId][0]{_id, name, images}`,
          { catId: params.catId }
        )
        setCat(catData)
      } catch (error) {
        console.error('Error fetching cat:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCat()
  }, [params.catId])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

 const handleSubmit = async (e) => {
  e.preventDefault()
  setSubmitting(true)

  try {
    // Send to API route instead of direct Sanity call
    const response = await fetch('/api/submit-application', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...formData,
        catId: params.catId  // Add the cat ID
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to submit application')
    }

    // Success!
    alert('Application submitted successfully! We will contact you within 48 hours.')
    router.push('/')
    
  } catch (error) {
    console.error('Error submitting application:', error)
    alert(`There was an error: ${error.message}. Please try again.`)
  } finally {
    setSubmitting(false)
  }
}

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        Loading...
      </div>
    )
  }

  if (!cat) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <h1>Cat not found</h1>
        <button onClick={() => router.push('/')}>Go Home</button>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ marginBottom: '1rem' }}>Apply to Adopt {cat.name}</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Please fill out the form below. We will review your application and get back to you within 48 hours.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Applicant Information */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Full Name *
          </label>
          <input
            type="text"
            name="applicantName"
            value={formData.applicantName}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Phone Number *
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Address
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={3}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Housing Type
          </label>
          <select
            name="housingType"
            value={formData.housingType}
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          >
            <option value="">Select...</option>
            <option value="own">Own House</option>
            <option value="rent">Rented Apartment</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              name="hasOtherPets"
              checked={formData.hasOtherPets}
              onChange={handleChange}
            />
            <span style={{ fontWeight: 'bold' }}>I have other pets</span>
          </label>
        </div>

        {formData.hasOtherPets && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Tell us about your other pets
            </label>
            <textarea
              name="otherPetsDetails"
              value={formData.otherPetsDetails}
              onChange={handleChange}
              rows={3}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontFamily: 'inherit'
              }}
            />
          </div>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Why do you want to adopt a cat? * (minimum 50 characters)
          </label>
          <textarea
            name="whyAdopt"
            value={formData.whyAdopt}
            onChange={handleChange}
            required
            minLength={50}
            rows={4}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'inherit'
            }}
          />
          <small style={{ color: '#666' }}>
            {formData.whyAdopt.length}/50 characters
          </small>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Do you have experience with cats?
          </label>
          <textarea
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            rows={3}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'inherit'
            }}
          />
        </div>
<Turnstile
  siteKey="YOUR_TURNSTILE_SITE_KEY"
  onSuccess={(token) => setTurnstileToken(token)}
/>
        <button
          type="submit"
          disabled={submitting}
          style={{ 
            padding: '1rem 2rem',
            backgroundColor: submitting ? '#ccc' : '#2a4674',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: submitting ? 'not-allowed' : 'pointer'
          }}
        >
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  )
}