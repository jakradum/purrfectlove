// src/lib/sanity.js
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true, // Use CDN for faster response times
})

// Helper function to generate image URLs
const builder = imageUrlBuilder(client)

export function urlFor(source) {
  return builder.image(source)
}

// Common queries
export const queries = {
  // Get all available cats
  availableCats: `*[_type == "cat" && status == "available"] | order(_createdAt desc) {
    _id,
    name,
    slug,
    photos,
    age,
    gender,
    description,
    healthStatus,
    specialNeeds,
    goodWith,
    featured
  }`,

  // Get single cat by slug
  catBySlug: (slug) => `*[_type == "cat" && slug.current == "${slug}"][0] {
    _id,
    name,
    slug,
    photos,
    age,
    ageMonths,
    gender,
    description,
    healthStatus,
    specialNeeds,
    goodWith,
    status,
    adoptionDate
  }`,

  // Get featured cats for homepage
  featuredCats: `*[_type == "cat" && featured == true && status == "available"] | order(_createdAt desc)[0...3] {
    _id,
    name,
    slug,
    photos,
    age,
    gender,
    description
  }`,

  // Get team members
  teamMembers: `*[_type == "teamMember"] | order(order asc) {
    _id,
    name,
    role,
    location,
    photo,
    bio,
    email
  }`,

  // Get FAQs by category
  faqsByCategory: `*[_type == "faq"] | order(category asc, order asc) {
    _id,
    question,
    answer,
    category
  }`,

  // Get success stories
  successStories: `*[_type == "successStory" && consentGiven == true] | order(adoptionDate desc) {
    _id,
    "catName": cat->name,
    adopterName,
    adoptionDate,
    testimonial,
    photos,
    featured
  }`,

  // Get featured success stories for homepage
  featuredSuccessStories: `*[_type == "successStory" && featured == true && consentGiven == true] | order(adoptionDate desc)[0...3] {
    _id,
    "catName": cat->name,
    adopterName,
    testimonial,
    photos
  }`
}