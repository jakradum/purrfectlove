import React, { useEffect, useState } from 'react'
import { Card, Stack, Text, Flex, Box } from '@sanity/ui'
import { client } from '../lib/client'

export function BlogOverview() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const query = `{
          "totalPublished": count(*[_type == "blogPost" && !(_id in path("drafts.**"))]),
          "totalDrafts": count(*[_type == "blogPost" && _id in path("drafts.**")]),
          "featuredEn": count(*[_type == "blogPost" && !(_id in path("drafts.**")) && featuredOnHomePageEn == true]),
          "featuredDe": count(*[_type == "blogPost" && !(_id in path("drafts.**")) && featuredOnHomePageDe == true])
        }`

        const data = await client.fetch(query)
        setStats(data)
      } catch (error) {
        console.error('Error fetching blog stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <Card padding={4} radius={2} shadow={1}>
        <Text size={1}>Loading blog statistics...</Text>
      </Card>
    )
  }

  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={4}>
        <Text size={3} weight="bold">Blog Articles</Text>

        <Flex gap={3} wrap="wrap">
          <Box flex={1} style={{ minWidth: '120px' }}>
            <Card padding={3} radius={2} tone="primary">
              <Stack space={2}>
                <Text size={4} weight="bold">{stats?.totalPublished || 0}</Text>
                <Text size={1} muted>Published</Text>
              </Stack>
            </Card>
          </Box>

          <Box flex={1} style={{ minWidth: '120px' }}>
            <Card padding={3} radius={2} tone="caution">
              <Stack space={2}>
                <Text size={4} weight="bold">{stats?.totalDrafts || 0}</Text>
                <Text size={1} muted>Drafts</Text>
              </Stack>
            </Card>
          </Box>
        </Flex>

        <Text size={2} weight="semibold" style={{ marginTop: '8px' }}>Featured on Homepage</Text>

        <Flex gap={3} wrap="wrap">
          <Box flex={1} style={{ minWidth: '120px' }}>
            <Card padding={3} radius={2} tone="positive">
              <Stack space={2}>
                <Flex align="center" gap={2}>
                  <Text size={4} weight="bold">{stats?.featuredEn || 0}</Text>
                  <Text size={1}>🇬🇧</Text>
                </Flex>
                <Text size={1} muted>English</Text>
              </Stack>
            </Card>
          </Box>

          <Box flex={1} style={{ minWidth: '120px' }}>
            <Card padding={3} radius={2} tone="positive">
              <Stack space={2}>
                <Flex align="center" gap={2}>
                  <Text size={4} weight="bold">{stats?.featuredDe || 0}</Text>
                  <Text size={1}>🇩🇪</Text>
                </Flex>
                <Text size={1} muted>German</Text>
              </Stack>
            </Card>
          </Box>
        </Flex>

        <Box marginTop={3}>
          <a
            href="structure/coreSiteUpdates;blogPosts"
            style={{
              fontSize: '13px',
              color: '#2276FC',
              textDecoration: 'none'
            }}
          >
            View all blog posts →
          </a>
        </Box>
      </Stack>
    </Card>
  )
}
