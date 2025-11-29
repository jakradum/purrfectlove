import cat from './cat'
import faq from './faq'
import successStory from './successStory'
import teamMember from './teamMember'
import application from './application'
import processStep from './processStep'
import blogPost from './blogPost'
import contactMessage from './contactMessage'
import { localeString, localeText, localeBlock } from './localeFields'

export const schema = {
  types: [
    localeString,
    localeText,
    localeBlock,
    cat,
    faq,
    successStory,
    teamMember,
    application,
    processStep,
    blogPost,
    contactMessage
  ]
}