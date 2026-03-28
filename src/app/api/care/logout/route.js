export async function POST() {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'care-auth=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0',
    },
  })
}
