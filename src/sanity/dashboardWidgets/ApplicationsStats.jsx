import React, { useEffect, useState } from 'react'
import { Card, Stack, Text, Flex, Box, Grid } from '@sanity/ui'
import { client } from '../lib/client'

export function ApplicationsStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const query = `{
          "total": count(*[_type == "application"]),
          "new": count(*[_type == "application" && status == "new"]),
          "underReview": count(*[_type == "application" && status == "under_review"]),
          "approved": count(*[_type == "application" && finalDecision == "approved"]),
          "rejected": count(*[_type == "application" && finalDecision == "rejected"]),
          "pending": count(*[_type == "application" && finalDecision == "pending"])
        }`

        const data = await client.fetch(query)
        setStats(data)
      } catch (error) {
        console.error('Error fetching application stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <Card padding={4} radius={2} shadow={1}>
        <Text size={1}>Loading application statistics...</Text>
      </Card>
    )
  }

  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={4}>
        <Text size={3} weight="bold">Adoption Applications</Text>

        <Box>
          <Card padding={3} radius={2} tone="primary">
            <Stack space={2}>
              <Text size={5} weight="bold">{stats?.total || 0}</Text>
              <Text size={1} muted>Total Applications</Text>
            </Stack>
          </Card>
        </Box>

        <Text size={2} weight="semibold" style={{ marginTop: '8px' }}>By Status</Text>

        <Grid columns={2} gap={3}>
          <Card padding={3} radius={2} tone="caution" style={{ border: '2px solid #F59E0B' }}>
            <Stack space={2}>
              <Text size={4} weight="bold">{stats?.new || 0}</Text>
              <Text size={1} muted>New</Text>
            </Stack>
          </Card>

          <Card padding={3} radius={2} tone="primary" style={{ border: '2px solid #2276FC' }}>
            <Stack space={2}>
              <Text size={4} weight="bold">{stats?.underReview || 0}</Text>
              <Text size={1} muted>Under Review</Text>
            </Stack>
          </Card>
        </Grid>

        <Text size={2} weight="semibold" style={{ marginTop: '8px' }}>Final Decision</Text>

        <Grid columns={3} gap={3}>
          <Card padding={3} radius={2} tone="positive" style={{ border: '2px solid #10B981' }}>
            <Stack space={2}>
              <Text size={4} weight="bold">{stats?.approved || 0}</Text>
              <Text size={1} muted>Approved</Text>
            </Stack>
          </Card>

          <Card padding={3} radius={2} tone="critical" style={{ border: '2px solid #EF4444' }}>
            <Stack space={2}>
              <Text size={4} weight="bold">{stats?.rejected || 0}</Text>
              <Text size={1} muted>Rejected</Text>
            </Stack>
          </Card>

          <Card padding={3} radius={2} style={{ border: '2px solid #94A3B8' }}>
            <Stack space={2}>
              <Text size={4} weight="bold">{stats?.pending || 0}</Text>
              <Text size={1} muted>Pending</Text>
            </Stack>
          </Card>
        </Grid>

        <Box marginTop={3}>
          <a
            href="/studio/structure/application"
            style={{
              fontSize: '13px',
              color: '#2276FC',
              textDecoration: 'none'
            }}
          >
            View all applications →
          </a>
        </Box>
      </Stack>
    </Card>
  )
}
