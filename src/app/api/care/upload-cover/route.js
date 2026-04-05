import { createClient } from '@sanity/client'
import { getSupabaseUser } from '@/lib/supabaseServer'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export async function POST(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('cover')
    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: 'Only JPG, PNG, and WebP images are accepted' }, { status: 400 })
    }

    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_SIZE) {
      return Response.json({ error: 'Image must be under 5MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const asset = await serverClient.assets.upload('image', buffer, {
      filename: file.name,
      contentType: file.type,
    })

    await serverClient
      .patch(user.sitterId)
      .set({
        coverImage: {
          _type: 'image',
          asset: { _type: 'reference', _ref: asset._id },
        },
      })
      .commit()

    return Response.json({ coverImageUrl: asset.url })
  } catch (error) {
    console.error('upload-cover error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
