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

// Note: teamMember.name is a plain string field (not localized)
const coreTeamPhones = [
  { name: 'Lucia Flamini',         phone: '+4915253432348' },
  { name: 'Anushka Bhattacharya',  phone: '+918971264636'  },
  { name: 'Besly Anu Varghese',    phone: '+447360057361'  },
  { name: 'Alma Francis',          phone: '+919916122979'  },
  { name: 'Lavanya Jayashankar',   phone: '+917045357021'  },
  // Devraj and Devyani not yet in Sanity — add their teamMember records first
  // { name: 'Devraj ???',   phone: '+919632351325' },
  // { name: 'Devyani ???',  phone: '+917259046945' },
];

async function addPhoneNumbers() {
  console.log('Adding phone numbers to team members...\n');

  for (const member of coreTeamPhones) {
    try {
      const teamMember = await client.fetch(
        `*[_type == "teamMember" && name == $name][0]{ _id, name }`,
        { name: member.name }
      );

      if (!teamMember) {
        console.log(`⚠️  ${member.name} — not found in Sanity (check exact name spelling)`);
        continue;
      }

      await client.patch(teamMember._id).set({ phone: member.phone }).commit();
      console.log(`✅ ${member.name} — ${member.phone}`);
    } catch (error) {
      console.error(`❌ ${member.name} — ${error.message}`);
    }
  }

  console.log('\nDone.');
}

addPhoneNumbers();
