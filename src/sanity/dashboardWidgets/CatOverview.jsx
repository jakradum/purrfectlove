import React, { useEffect, useState } from 'react'
import { Card, Stack, Text, Flex, Box } from '@sanity/ui'
import { client } from '../lib/client'

export function CatOverview() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const query = `{
          "total": count(*[_type == "cat"]),
          "adopted": count(*[_type == "cat" && (adoptedOverride == true || count(*[_type == "application" && references(^._id) && finalDecision == "approved"]) > 0)]),
          "withApplicants": count(*[_type == "cat" && count(*[_type == "application" && references(^._id)]) > 0])
        }`

        const data = await client.fetch(query)
        setStats(data)
      } catch (error) {
        console.error('Error fetching cat stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <Card padding={4} radius={2} shadow={1}>
        <Text size={1}>Loading cat statistics...</Text>
      </Card>
    )
  }

  const unadoptedWithApplicants = (stats?.withApplicants || 0) - (stats?.adopted || 0)

  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={4}>
        <Text size={3} weight="bold">Cats</Text>

        <Flex gap={3} wrap="wrap">
          <Box flex={1} style={{ minWidth: '120px' }}>
            <Card padding={3} radius={2} tone="primary">
              <Stack space={2}>
                <Text size={4} weight="bold">{stats?.total || 0}</Text>
                <Text size={1} muted>Total</Text>
              </Stack>
            </Card>
          </Box>

          <Box flex={1} style={{ minWidth: '120px' }}>
            <Card padding={3} radius={2} tone="positive">
              <Stack space={2}>
                <Text size={4} weight="bold">{stats?.adopted || 0}</Text>
                <Text size={1} muted>Adopted</Text>
              </Stack>
            </Card>
          </Box>

          <Box flex={1} style={{ minWidth: '120px' }}>
            <Card padding={3} radius={2} tone="caution">
              <Stack space={2}>
                <Text size={4} weight="bold">{unadoptedWithApplicants}</Text>
                <Text size={1} muted>With Applicants</Text>
              </Stack>
            </Card>
          </Box>
        </Flex>

        <Box marginTop={3}>
          <a
            href="/studio/structure/cat"
            style={{
              fontSize: '13px',
              color: '#2276FC',
              textDecoration: 'none'
            }}
          >
            View all cats →
          </a>
        </Box>
      </Stack>
    </Card>
  )
}
