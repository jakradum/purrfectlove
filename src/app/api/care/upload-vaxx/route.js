import { createClient } from '@sanity/client'
import { getSupabaseUser } from '@/lib/supabaseServer'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_SIZE = 15 * 1024 * 1024 // 15 MB

export async function POST(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file    = formData.get('file')
    const catKey  = formData.get('catKey')
    const date    = formData.get('date') || null

    if (!file)   return Response.json({ error: 'No file provided' }, { status: 400 })
    if (!catKey) return Response.json({ error: 'catKey is required' }, { status: 400 })

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: 'Only JPEG, PNG, and PDF files are accepted' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return Response.json({ error: 'File is too large to upload.' }, { status: 400 })
    }

    // Verify the cat _key belongs to this sitter
    const sitter = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]{ "catKey": cats[_key == $key][0]._key }`,
      { id: user.sitterId, key: catKey }
    )
    if (!sitter?.catKey) {
      return Response.json({ error: 'Cat not found on your profile' }, { status: 404 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const asset  = await serverClient.assets.upload('file', buffer, {
      filename:    file.name,
      contentType: file.type,
    })

    await serverClient
      .patch(user.sitterId)
      .set({
        [`cats[_key=="${catKey}"].vaccinationRecord`]: {
          _type: 'object',
          file: { _type: 'file', asset: { _type: 'reference', _ref: asset._id } },
          ...(date ? { date } : {}),
        },
      })
      .commit()

    return Response.json({
      fileUrl:  asset.url,
      fileName: asset.originalFilename || file.name,
      date:     date || null,
    })
  } catch (error) {
    console.error('upload-vaxx POST error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const catKey = searchParams.get('catKey')
    if (!catKey) return Response.json({ error: 'catKey is required' }, { status: 400 })

    // Verify ownership
    const sitter = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]{ "catKey": cats[_key == $key][0]._key }`,
      { id: user.sitterId, key: catKey }
    )
    if (!sitter?.catKey) {
      return Response.json({ error: 'Cat not found on your profile' }, { status: 404 })
    }

    await serverClient
      .patch(user.sitterId)
      .unset([`cats[_key=="${catKey}"].vaccinationRecord`])
      .commit()

    return Response.json({ success: true })
  } catch (error) {
    console.error('upload-vaxx DELETE error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
