import { getSupabaseUser } from '@/lib/supabaseServer'

export async function GET(request) {
  const user = await getSupabaseUser(request)
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  if (!q) return Response.json([])

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`,
      { headers: { 'User-Agent': 'purrfectlove-community (support@purrfectlove.org)' } }
    )
    if (!res.ok) return Response.json([], { status: 200 })
    const data = await res.json()
    const results = data.map((item) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }))
    return Response.json(results)
  } catch {
    return Response.json([], { status: 200 })
  }
}
