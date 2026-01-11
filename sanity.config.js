'use client'

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {languageFilter} from '@sanity/language-filter'
import {dashboardTool} from '@sanity/dashboard'

import {apiVersion, dataset, projectId} from './src/sanity/env'
import {schema} from './src/sanity/schemaTypes'
import {structure} from './src/sanity/structure'
import {BlogOverview} from './src/sanity/dashboardWidgets/BlogOverview'
import {CatOverview} from './src/sanity/dashboardWidgets/CatOverview'
import {ApplicationsStats} from './src/sanity/dashboardWidgets/ApplicationsStats'

// Initial value templates for language-specific FAQs
const initialValueTemplates = [
  {
    id: 'faq-en',
    title: 'FAQ (English)',
    schemaType: 'faq',
    value: {
      language: 'en'
    }
  },
  {
    id: 'faq-de',
    title: 'FAQ (German)',
    schemaType: 'faq',
    value: {
      language: 'de'
    }
  }
]

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  schema: {
    ...schema,
    templates: (prev) => [...prev, ...initialValueTemplates]
  },
  plugins: [
    dashboardTool({
      widgets: [
        {
          name: 'blog-overview',
          component: BlogOverview,
          layout: { width: 'medium' }
        },
        {
          name: 'cat-overview',
          component: CatOverview,
          layout: { width: 'medium' }
        },
        {
          name: 'applications-stats',
          component: ApplicationsStats,
          layout: { width: 'full' }
        }
      ]
    }),
    structureTool({ structure }),
    visionTool({ defaultApiVersion: apiVersion }),
    languageFilter({
      supportedLanguages: [
        { id: 'en', title: 'English' },
        { id: 'de', title: 'German' },
      ],
      defaultLanguages: ['en'],
      documentTypes: ['faq', 'processStep', 'teamMember'],
    }),
  ],
  documentTypes: ['faq', 'processStep', 'teamMember', 'blogPost', 'successStory'],
  form: {
    file: {
      assetSources: (previousAssetSources) => {
        return previousAssetSources.map((assetSource) => {
          if (assetSource.name === 'file') {
            return {
              ...assetSource,
              component: (props) => {
                // Intercept file uploads to check size
                const originalOnSelect = props.onSelect
                return assetSource.component({
                  ...props,
                  onSelect: (files) => {
                    const validFiles = files.filter((file) => {
                      if (file.size > 204800) { // 200KB in bytes
                        alert(`File "${file.name}" is too large. Maximum file size is 200KB.`)
                        return false
                      }
                      return true
                    })
                    if (validFiles.length > 0) {
                      originalOnSelect(validFiles)
                    }
                  }
                })
              }
            }
          }
          return assetSource
        })
      }
    }
  }
});