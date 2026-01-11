import React, { useEffect, useState } from 'react'
import { Card, Stack, Text, Box, Button } from '@sanity/ui'

export function LatestUpdates() {
  const [commits, setCommits] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        const response = await fetch(
          'https://api.github.com/repos/jakradum/purrfectlove/commits?per_page=5'
        )
        const data = await response.json()
        setCommits(data)
      } catch (error) {
        console.error('Error fetching commits:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCommits()
  }, [])

  if (loading) {
    return null
  }

  if (!commits || commits.length === 0) {
    return null
  }

  const displayedCommits = expanded ? commits : commits.slice(0, 1)

  return (
    <Card padding={3} radius={2} shadow={1} tone="transparent">
      <Stack space={2}>
        <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text size={0} muted style={{ fontFamily: 'monospace', opacity: 0.6 }}>
            Latest Updates
          </Text>
          {commits.length > 1 && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2276FC',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '11px',
                padding: '4px 8px',
                textDecoration: 'underline'
              }}
            >
              {expanded ? 'Show less' : `Show all ${commits.length}`}
            </button>
          )}
        </Box>
        <Stack space={1}>
          {displayedCommits.map((commit) => {
            const shortSha = commit.sha.substring(0, 7)
            const message = commit.commit.message.split('\n')[0] // First line only
            const date = new Date(commit.commit.author.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })

            return (
              <Box key={commit.sha}>
                <Text size={0} muted style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                  <span style={{ color: '#6B6B6B' }}>{date}</span>
                  {' • '}
                  <a
                    href={commit.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#2276FC', textDecoration: 'none' }}
                  >
                    {shortSha}
                  </a>
                  {' • '}
                  <span style={{ color: '#2A2A2A' }}>{message}</span>
                </Text>
              </Box>
            )
          })}
        </Stack>
      </Stack>
    </Card>
  )
}
