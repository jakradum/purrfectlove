import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'kbircpfo',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: 'skwZHlp9lkh7xJr1Dj8xcokKpsYtsCBiBsh6Zbjvtba5FLEu07U8CiImW3qxhIVFxekeMBmPygIiv366pTjPsQPJE9tTaP5GfiVLWuSUuiYZkAgQgTynzZ1chVThss3LKuSFNEfXcpMnMopvCm8HyMxBpy05pdAEWTIEeDhWO4GVF6txptJH',
  useCdn: false,
})

const DRY_RUN = process.argv.includes('--dry-run')

// Post ID → new tags. tagsDe: null means "leave empty / don't set".
// Only posts with existing DE translations get tagsDe applied.
const RETAG_MAP = [
  { id: '7173df0a-c5df-4f86-844d-53da472fe81d', tags: ['cats-101'],                       tagsDe: null },
  { id: '7695fc9f-b32b-4ca7-bbf9-2425ab84b112', tags: ['adoption', 'cats-101'],           tagsDe: null },
  { id: '2e84ac3f-e33f-463e-ad85-87b6bba57ee5', tags: ['adoption', 'cats-101'],           tagsDe: null },
  { id: '30a00d69-aede-42ae-9d33-c66822fb43ec', tags: ['new-cat', 'cats-101'],            tagsDe: ['neue-katze', 'katzen-101'] },
  { id: '0d5577c0-a26a-4543-aa07-b19157902fb4', tags: ['cats-101'],                       tagsDe: ['katzen-101'] },
  { id: 'ba7d86d5-67cc-4915-95a0-3e5cbcc37667', tags: [],                                 tagsDe: ['katzensicherheit', 'adoption'] },
  { id: '7ca8f73b-ca70-4771-a392-a6d363926700', tags: ['nutrition'],                      tagsDe: ['ernaehrung'] },
  { id: 'ba1d4dac-8b32-49d2-b957-4f07192b3807', tags: ['grief-and-loss', 'adoption'],     tagsDe: ['trauer-und-verlust', 'adoption'] },
  { id: 'b5a31e55-87ba-4a1f-899a-28ddf83bbe41', tags: ['cats-101'],                       tagsDe: ['katzen-101'] },
  { id: '364f064f-cb46-4116-ae6e-b9b361bc078f', tags: ['cat-safety'],                     tagsDe: ['katzensicherheit'] },
  { id: '186c344f-d813-4e36-9813-e89e4649de7b', tags: ['multi-cat-homes', 'new-cat'],     tagsDe: ['mehrkatzenhaltung', 'neue-katze'] },
  { id: '93ae2503-bf07-472f-9ca4-f2b0195c9873', tags: ['multi-cat-homes', 'new-cat'],     tagsDe: ['mehrkatzenhaltung', 'neue-katze'] },
  { id: 'e8d855e2-7d82-458f-a2c3-8aceeca07946', tags: ['adoption', 'new-cat'],            tagsDe: ['adoption', 'neue-katze'] },
  { id: 'ec5007eb-fc12-442f-95aa-81e48a2c6821', tags: [],                                 tagsDe: ['katzensicherheit'] },
  { id: '2a3b9425-4e93-4a3c-b26c-7eb3017cfebe', tags: ['adoption', 'cats-101'],           tagsDe: ['adoption', 'katzen-101'] },
  { id: 'fc104a9e-08ab-43b6-b9ac-04f2cce6cc31', tags: ['health-and-vet', 'new-cat'],      tagsDe: null },
  { id: '4fa8f0b0-897c-4c1a-850f-c4a29c3e1a84', tags: ['cats-101'],                       tagsDe: ['katzen-101'] },
  { id: '8a075099-9657-44f9-afa0-51804468dfeb', tags: ['health-and-vet', 'cats-101'],     tagsDe: null },
  { id: '63ff71b1-171a-4d9b-809f-af29818ddc3c', tags: ['new-cat', 'cat-safety'],          tagsDe: null },
  { id: '466cc087-54a0-4ea4-b85e-3e3db1e5d27d', tags: ['cats-101'],                       tagsDe: null },
  { id: '3c570f7f-f1bd-49ca-8f53-9ec9a42e9732', tags: ['cats-101', 'cat-safety'],         tagsDe: null },
  { id: '1c62781f-9633-49fc-9235-160bee17f444', tags: ['health-and-vet', 'cat-safety'],   tagsDe: null },
  { id: 'af816e77-7e13-443e-b6c7-f3f409f9a58f', tags: ['cat-safety'],                     tagsDe: null },
  { id: '0bb9f6f9-4cc3-41a9-af6d-e2cd55008cf7', tags: ['multi-cat-homes', 'cat-safety'],  tagsDe: null },
  { id: '264bc28a-5919-47dc-bb9e-908e3e5672c7', tags: ['adoption', 'health-and-vet'],     tagsDe: null },
  { id: '6046db19-f3f2-4574-ae9f-c4da1670ee63', tags: ['health-and-vet'],                 tagsDe: null },
]

// Fetch current state for comparison
const ids = RETAG_MAP.map(r => r.id)
const existing = await client.fetch(
  `*[_type == "blogPost" && _id in $ids]{ _id, "titleEn": title.en, "titleDe": title.de, tags, tagsDe }`,
  { ids }
)
const existingMap = Object.fromEntries(existing.map(p => [p._id, p]))

console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Retagging ${RETAG_MAP.length} posts\n`)
console.log('─'.repeat(72))

let updated = 0
let notFound = 0

for (const entry of RETAG_MAP) {
  const current = existingMap[entry.id]
  if (!current) {
    console.log(`NOT FOUND  ${entry.id}`)
    notFound++
    continue
  }

  const title = current.titleEn || current.titleDe || '(untitled)'
  const patch = {}

  if (entry.tags.length > 0) {
    patch.tags = entry.tags
  } else {
    patch.tags = []
  }

  if (entry.tagsDe !== null) {
    patch.tagsDe = entry.tagsDe
  } else {
    patch.tagsDe = []
  }

  const oldTags = (current.tags || []).join(', ') || 'none'
  const oldTagsDe = (current.tagsDe || []).join(', ') || 'none'
  const newTags = patch.tags.join(', ') || 'none'
  const newTagsDe = patch.tagsDe.join(', ') || 'none'

  console.log(`\n"${title.slice(0, 60)}"`)
  console.log(`  tags:   ${oldTags} → ${newTags}`)
  console.log(`  tagsDe: ${oldTagsDe} → ${newTagsDe}`)

  if (!DRY_RUN) {
    await client.patch(entry.id).set(patch).commit()
  }

  updated++
}

console.log('\n' + '─'.repeat(72))
console.log(`\nSummary: ${updated} posts ${DRY_RUN ? 'would be' : ''} updated, ${notFound} not found`)
if (DRY_RUN) console.log('Run without --dry-run to apply changes.')
