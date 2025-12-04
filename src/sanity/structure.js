import {ApplicantInfoDisplay} from './components/ApplicantInfoDisplay'
import {ContactMessageDisplay} from './components/ContactMessageDisplay'

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
                .child(
                  S.list()
                    .title('FAQs by Language')
                    .items([
                      S.listItem()
                        .title('English FAQs')
                        .icon(() => '🇮🇳')
                        .child(
                          S.documentTypeList('faq')
                            .title('English FAQs')
                            .filter('_type == "faq" && language == "en"')
                            .defaultOrdering([{field: 'category', direction: 'asc'}, {field: 'order', direction: 'asc'}])
                            .initialValueTemplates([
                              S.initialValueTemplateItem('faq-en')
                            ])
                        ),
                      S.listItem()
                        .title('German FAQs (Deutsch)')
                        .icon(() => '🇩🇪')
                        .child(
                          S.documentTypeList('faq')
                            .title('German FAQs')
                            .filter('_type == "faq" && language == "de"')
                            .defaultOrdering([{field: 'category', direction: 'asc'}, {field: 'order', direction: 'asc'}])
                            .initialValueTemplates([
                              S.initialValueTemplateItem('faq-de')
                            ])
                        ),
                    ])
                ),
              S.listItem()
                .title('Process Steps')
                .icon(() => '📝')
                .child(S.documentTypeList('processStep')),
            ])
        ),

      // === CONTACT MESSAGES ===
      S.listItem()
        .title('Contact Messages')
        .icon(() => '📬')
        .child(
          S.documentTypeList('contactMessage')
            .title('Contact Messages')
            .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }])
            .child((documentId) =>
              S.document()
                .documentId(documentId)
                .schemaType('contactMessage')
                .views([
                  S.view.component(ContactMessageDisplay).title('Message'),
                  S.view.form().title('Status & Notes')
                ])
            )
        ),

      // === SITE SETTINGS ===
      S.listItem()
        .title('Site Settings')
        .icon(() => '⚙️')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Site Settings')
        ),
    ])
