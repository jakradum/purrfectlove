import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

const ids = await client.fetch(`*[_type == "message"]._id`);
console.log(`Found ${ids.length} messages. Deleting…`);

if (ids.length === 0) {
  console.log('Nothing to delete.');
  process.exit(0);
}

// Delete in batches of 100
const BATCH = 100;
for (let i = 0; i < ids.length; i += BATCH) {
  const batch = ids.slice(i, i + BATCH);
  const tx = client.transaction();
  for (const id of batch) tx.delete(id);
  await tx.commit();
  console.log(`Deleted ${Math.min(i + BATCH, ids.length)} / ${ids.length}`);
}

console.log('Done. All inboxes cleared.');
