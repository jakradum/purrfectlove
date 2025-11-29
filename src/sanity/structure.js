import {StructureBuilder as S} from 'sanity/desk'
import {ApplicantInfoDisplay} from './components/ApplicantInfoDisplay'

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
        .child(
          S.documentTypeList('application')
            .child((documentId) =>
              S.document()
                .documentId(documentId)
                .schemaType('application')
                .views([
                  S.view.component(ApplicantInfoDisplay).title('Applicant Info'),
                  S.view.form().title('Review & Status')
                ])
            )
        ),
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