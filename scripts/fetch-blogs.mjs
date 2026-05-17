import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'kbircpfo',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: 'skwZHlp9lkh7xJr1Dj8xcokKpsYtsCBiBsh6Zbjvtba5FLEu07U8CiImW3qxhIVFxekeMBmPygIiv366pTjPsQPJE9tTaP5GfiVLWuSUuiYZkAgQgTynzZ1chVThss3LKuSFNEfXcpMnMopvCm8HyMxBpy05pdAEWTIEeDhWO4GVF6txptJH',
  useCdn: false,
})

function extractText(blocks) {
  if (!blocks || !Array.isArray(blocks)) return ''
  return blocks
    .filter(b => b._type === 'block')
    .map(b => b.children?.map(c => c.text).join('') || '')
    .join('\n')
}

const posts = await client.fetch(`*[_type == "blogPost"] | order(_createdAt asc) {
  _id,
  "titleEn": title.en,
  "titleDe": title.de,
  "contentEn": content.en,
  "contentDe": content.de,
  tags,
  tagsDe,
  _createdAt
}`)

console.log(`Total posts: ${posts.length}\n`)
console.log('='.repeat(80))

for (const post of posts) {
  console.log(`\nID: ${post._id}`)
  console.log(`Created: ${post._createdAt?.slice(0, 10)}`)
  console.log(`Current tags: ${(post.tags || []).join(', ') || 'none'}`)
  console.log(`Current tagsDe: ${(post.tagsDe || []).join(', ') || 'none'}`)

  if (post.titleEn) {
    console.log(`\n[EN] ${post.titleEn}`)
    const en = extractText(post.contentEn)
    if (en) console.log(en)
  }

  if (post.titleDe) {
    console.log(`\n[DE] ${post.titleDe}`)
    const de = extractText(post.contentDe)
    if (de) console.log(de)
  }

  console.log('\n' + '='.repeat(80))
}
