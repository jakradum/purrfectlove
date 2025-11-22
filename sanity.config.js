'use client'

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {languageFilter} from '@sanity/language-filter'

import {apiVersion, dataset, projectId} from './src/sanity/env'
import {schema} from './src/sanity/schemaTypes'
import {structure} from './src/sanity/structure'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  schema,
  plugins: [
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
});