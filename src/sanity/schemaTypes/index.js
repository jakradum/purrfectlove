import cat from './cat'
import faq from './faq'
import successStory from './successStory'
import teamMember from './teamMember'
import application from './application'
import processStep from './processStep'
import blogPost from './blogPost'
import contactMessage from './contactMessage'
import siteSettings from './siteSettings'
import catSitter from './catSitter'
import message from './message'
import blockedUser from './blockedUser'
import contactShare from './contactShare'
import sittingFeedback from './sittingFeedback'
import deletedAccount from './deletedAccount'
import notification from './notification'
import sitRecord from './sitRecord'
import memberReport from './memberReport'
import broadcastMessage from './broadcastMessage'
import portalFeedback from './portalFeedback'
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
    contactMessage,
    siteSettings,
    catSitter,
    message,
    blockedUser,
    contactShare,
    sittingFeedback,
    deletedAccount,
    notification,
    sitRecord,
    memberReport,
    broadcastMessage,
    portalFeedback,
  ]
}