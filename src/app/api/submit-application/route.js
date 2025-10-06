// src/app/api/submit-application/route.js
import { createClient } from '@sanity/client'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false
})

export async function POST(request) {
  try {
    const body = await request.json()
    
    console.log('Received application data:', body)
    
    if (!body.applicantName || !body.email || !body.phone || !body.whyAdopt) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    if (!body.catId) {
      return Response.json(
        { error: 'Cat ID is required' },
        { status: 400 }
      )
    }

    const result = await serverClient.create({
      _type: 'application',
      cat: {
        _type: 'reference',
        _ref: body.catId
      },
      applicantName: body.applicantName,
      email: body.email,
      phone: body.phone,
      address: body.address || '',
      housingType: body.housingType || '',
      hasOtherPets: body.hasOtherPets || false,
      otherPetsDetails: body.otherPetsDetails || '',
      whyAdopt: body.whyAdopt,
      experience: body.experience || '',
      submittedAt: new Date().toISOString(),
      status: 'new',
      finalDecision: 'pending'
    })

    console.log('Application created:', result._id)

    return Response.json({ 
      success: true, 
      applicationId: result._id,
      message: 'Application submitted successfully!'
    })

  } catch (error) {
    console.error('Error creating application:', error)
    return Response.json(
      { 
        error: 'Failed to submit application',
        details: error.message 
      },
      { status: 500 }
    )
  }
}