import {ApplicantInfoDisplay} from './components/ApplicantInfoDisplay'

export const structure = (S) =>
  S.list()
    .title('Purrfect Love')
    .items([
      // === CATS + APPLICATIONS ===
      S.listItem()
        .title('Cats + Applications')
        .icon(() => '🐱')
        .child(
          S.list()
            .title('Cats + Applications')
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
                .title('Success Stories')
                .icon(() => '💚')
                .child(S.documentTypeList('successStory')),
            ])
        ),

      // === CORE SITE UPDATES ===
      S.listItem()
        .title('Core Site Updates')
        .icon(() => '🌐')
        .child(
          S.list()
            .title('Core Site Updates')
            .items([
              S.listItem()
                .title('Team Members')
                .icon(() => '👥')
                .child(S.documentTypeList('teamMember')),
              S.listItem()
                .title('Blog Posts')
                .icon(() => '✍️')
                .child(S.documentTypeList('blogPost')),
              S.listItem()
                .title('FAQs')
                .icon(() => '❓')
                .child(S.documentTypeList('faq')),
              S.listItem()
                .title('Process Steps')
                .icon(() => '📝')
                .child(S.documentTypeList('processStep')),
            ])
        ),
    ])
