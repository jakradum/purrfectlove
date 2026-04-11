import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export function GET() {
  try {
    const buildId = readFileSync(join(process.cwd(), '.next/BUILD_ID'), 'utf-8').trim()
    return Response.json({ buildId })
  } catch {
    return Response.json({ buildId: 'unknown' })
  }
}
