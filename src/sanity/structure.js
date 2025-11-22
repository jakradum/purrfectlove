import {StructureBuilder as S} from 'sanity/desk'

export const structure = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Cats')
        .icon(() => '🐱')
        .child(S.documentTypeList('cat')),
      S.listItem()
        .title('Applications')
        .icon(() => '📋')
        .child(S.documentTypeList('application')),
      S.listItem()
        .title('Team')
        .icon(() => '👥')
        .child(S.documentTypeList('teamMember')),
      S.listItem()
        .title('Success Stories')
        .icon(() => '💚')
        .child(S.documentTypeList('successStory')),
      S.listItem()
        .title('FAQs')
        .icon(() => '❓')
        .child(S.documentTypeList('faq')),
      S.listItem()
        .title('Process Steps')
        .icon(() => '📝')
        .child(S.documentTypeList('processStep')),
      S.listItem()
        .title('Blog Posts')
        .icon(() => '✍️')
        .child(S.documentTypeList('blogPost')),
    ])