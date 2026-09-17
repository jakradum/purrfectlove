// Calendar-based theme assignment for the newsletter cron. The AI never
// picks its own theme - this script does, by finding every theme eligible
// for the current calendar month and choosing randomly among them (never
// outside a theme's declared months, so a summer theme can't fire in
// winter). Evergreen themes are eligible in all 12 months, so every month
// always has at least one candidate.
//
// The caller (the send cron) is responsible for only calling
// commitThemeSent() AFTER the newsletter actually sends successfully -
// advancing the state on a failed send would lose track of what was
// actually sent.

const CYCLE_STATE_ID = 'newsletterCycleState'

// Picks a theme for `forDate` (defaults to now). Eligible = eligibleMonths
// includes that month. If more than one theme is eligible, the last-sent
// theme is excluded first (avoid an immediate repeat) before picking
// randomly - unless excluding it would leave nothing, in which case it's
// allowed back in (better a repeat than nothing eligible).
export async function getNextTheme(client, forDate = new Date()) {
  const month = forDate.getUTCMonth() + 1 // 1-12

  const themes = await client.fetch(
    `*[_type == "newsletterTheme" && $month in eligibleMonths]{ _id, name, eligibleMonths, knowledge }`,
    { month }
  )

  if (themes.length === 0) {
    throw new Error(`newsletterCycle: no newsletterTheme is eligible for month ${month}`)
  }

  const state = await client.fetch(`*[_id == $id][0]{ "lastThemeId": lastTheme._ref }`, { id: CYCLE_STATE_ID })
  const lastThemeId = state?.lastThemeId

  let pool = themes
  if (themes.length > 1 && lastThemeId) {
    const withoutLast = themes.filter(t => t._id !== lastThemeId)
    if (withoutLast.length > 0) pool = withoutLast
  }

  return pool[Math.floor(Math.random() * pool.length)]
}

// Call only after a successful send. Records which theme was sent and when.
export async function commitThemeSent(client, theme) {
  await client
    .createIfNotExists({ _id: CYCLE_STATE_ID, _type: 'newsletterCycleState' })
  await client
    .patch(CYCLE_STATE_ID)
    .set({
      lastTheme: { _type: 'reference', _ref: theme._id },
      lastSentAt: new Date().toISOString(),
    })
    .commit()
}

// True if at least 42 days (6 weeks) have passed since the last send, or if
// no send has ever happened. The send cron should only actually send when
// this is true - see the file header for the "always call on a Saturday,
// gate on 6 weeks" reasoning.
export async function isDueForNextSend(client) {
  const state = await client.fetch(`*[_id == $id][0]{ lastSentAt }`, { id: CYCLE_STATE_ID })
  if (!state?.lastSentAt) return true

  const DAY_MS = 24 * 60 * 60 * 1000
  const daysSinceLastSend = (Date.now() - new Date(state.lastSentAt).getTime()) / DAY_MS
  return daysSinceLastSend >= 42
}
