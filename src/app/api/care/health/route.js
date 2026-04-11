import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { client as sanityClient } from '@/sanity/lib/client'

export async function GET() {
  const [supabaseResult, sanityResult] = await Promise.allSettled([
    checkSupabase(),
    checkSanity(),
  ])

  const supabase = supabaseResult.status === 'fulfilled' ? 'ok' : 'error'
  const sanity   = sanityResult.status  === 'fulfilled' ? 'ok' : 'error'
  const allOk    = supabase === 'ok' && sanity === 'ok'

  return Response.json(
    { status: allOk ? 'ok' : 'error', supabase, sanity, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  )
}

async function checkSupabase() {
  const db = createSupabaseAdminClient()
  const { error } = await db
    .from('membership_requests')
    .select('id', { count: 'exact', head: true })
    .limit(1)
  if (error) throw new Error(error.message)
}

async function checkSanity() {
  const count = await sanityClient.fetch('count(*[_type == "catSitter"])', {}, { cache: 'no-store' })
  if (typeof count !== 'number') throw new Error('unexpected response')
}
