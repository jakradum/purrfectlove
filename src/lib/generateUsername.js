const ADJECTIVES = [
  'Bold','Tiny','Fluffy','Velvet','Silver','Golden','Misty','Sleepy','Grumpy','Fuzzy',
  'Nimble','Dainty','Cozy','Frisky','Gentle','Lazy','Lofty','Moody','Nosy','Plump',
  'Proud','Quirky','Rowdy','Rusty','Sassy','Silky','Sneaky','Soft','Spry','Swift',
  'Tabby','Tawny','Tender','Timid','Wispy','Woolly','Zesty','Calm','Clever','Cranky',
  'Dreamy','Dusty','Fancy','Feisty','Ginger','Hazel','Inky','Jumpy','Lanky','Mellow',
]

const CAT_NOUNS = [
  'Whisker','Mitten','Paw','Tail','Claw','Purr','Tabby','Fang','Fur','Snout',
  'Kitten','Tomcat','Muzzle','Napper','Rambler','Mouser','Prowler','Fluffer','Scratcher','Lounger',
  'Biscuit','Pouncer','Tumbler','Nibbler','Nuzzler','Dozer','Slinker','Stalker','Yowler','Trotter',
  'Chirper','Rumbler','Curler','Twirler','Stretcher','Kneader','Percher','Dasher','Leaper','Creeper',
  'Sniffer','Bumper','Flopper','Bolter','Roller','Wriggler','Peeker','Sitter','Dreamer','Lounger',
]

const VERBS = [
  'Purrs','Naps','Dozes','Prowls','Leaps','Pounces','Stretches','Yawns','Loafs','Kneads',
  'Chirps','Rumbles','Slinks','Twitches','Curls','Perches','Bolts','Creeps','Flops','Peeks',
]

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateUsername() {
  return `${pick(ADJECTIVES)}${pick(CAT_NOUNS)}${pick(VERBS)}`
}

// Generates a unique username not already taken in Sanity
export async function generateUniqueUsername(sanityClient) {
  const MAX_TRIES = 20
  for (let i = 0; i < MAX_TRIES; i++) {
    const candidate = generateUsername()
    const existing = await sanityClient.fetch(
      `*[_type == "catSitter" && username == $u][0]{ _id }`,
      { u: candidate }
    )
    if (!existing) return candidate
  }
  // Fallback: append random 4-digit suffix
  return `${generateUsername()}${Math.floor(1000 + Math.random() * 9000)}`
}
