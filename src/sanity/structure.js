import {ApplicantInfoDisplay} from './components/ApplicantInfoDisplay'
import {ContactMessageDisplay} from './components/ContactMessageDisplay'
import {MemberMessageLog} from './components/MemberMessageLog'

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
                .child(
                  S.list()
                    .title('Cats')
                    .items([
                      S.listItem()
                        .title('Available Cats')
                        .icon(() => '🐱')
                        .child(
                          S.documentTypeList('cat')
                            .title('Available Cats')
                            .filter('_type == "cat" && adoptedOverride != true && count(*[_type == "application" && cat._ref == ^._id && status == "adopted"]) == 0')
                        ),
                      S.listItem()
                        .title('Adopted Cats')
                        .icon(() => '💚')
                        .child(
                          S.documentTypeList('cat')
                            .title('Adopted Cats')
                            .filter('_type == "cat" && (adoptedOverride == true || count(*[_type == "application" && cat._ref == ^._id && status == "adopted"]) > 0)')
                        ),
                      S.listItem()
                        .title('All Cats')
                        .icon(() => '📋')
                        .child(S.documentTypeList('cat').title('All Cats')),
                    ])
                ),
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

      // === CAT SITTING PORTAL ===
      S.listItem()
        .title('Cat Sitting Portal')
        .icon(() => '🏠')
        .child(
          S.list()
            .title('Cat Sitting Portal')
            .items([
              S.listItem()
                .title('All Members')
                .icon(() => '👤')
                .child(
                  S.documentTypeList('catSitter')
                    .title('All Members')
                    .defaultOrdering([{ field: 'name', direction: 'asc' }])
                    .child((documentId) =>
                      S.document()
                        .documentId(documentId)
                        .schemaType('catSitter')
                        .views([
                          S.view.form().title('Profile'),
                          S.view.component(MemberMessageLog).title('Messages'),
                        ])
                    )
                ),
              S.listItem()
                .title('Verified Members')
                .icon(() => '✅')
                .child(
                  S.documentTypeList('catSitter')
                    .title('Verified Members')
                    .filter('_type == "catSitter" && memberVerified == true')
                    .defaultOrdering([{ field: 'name', direction: 'asc' }])
                    .child((documentId) =>
                      S.document()
                        .documentId(documentId)
                        .schemaType('catSitter')
                        .views([
                          S.view.form().title('Profile'),
                          S.view.component(MemberMessageLog).title('Messages'),
                        ])
                    )
                ),
              S.listItem()
                .title('Pending Verification')
                .icon(() => '⏳')
                .child(
                  S.documentTypeList('catSitter')
                    .title('Pending Verification')
                    .filter('_type == "catSitter" && (memberVerified == false || !defined(memberVerified))')
                    .defaultOrdering([{ field: '_createdAt', direction: 'desc' }])
                    .child((documentId) =>
                      S.document()
                        .documentId(documentId)
                        .schemaType('catSitter')
                        .views([
                          S.view.form().title('Profile'),
                          S.view.component(MemberMessageLog).title('Messages'),
                        ])
                    )
                ),
            ])
        ),

      // === MESSAGING ===
      S.listItem()
        .title('Messaging')
        .icon(() => '💬')
        .child(
          S.list()
            .title('Messaging')
            .items([
              S.listItem()
                .title('Spam Reports')
                .icon(() => '🚩')
                .child(
                  S.documentTypeList('message')
                    .title('Spam Reports')
                    .filter('_type == "message" && markedAsSpam == true')
                    .defaultOrdering([{ field: 'createdAt', direction: 'desc' }])
                ),
              S.listItem()
                .title('Blocked Users')
                .icon(() => '🚫')
                .child(
                  S.documentTypeList('blockedUser')
                    .title('Blocked Users')
                    .defaultOrdering([{ field: 'createdAt', direction: 'desc' }])
                ),
              S.listItem()
                .title('Contact Shares')
                .icon(() => '📇')
                .child(
                  S.documentTypeList('contactShare')
                    .title('Contact Shares')
                    .defaultOrdering([{ field: 'sharedAt', direction: 'desc' }])
                ),
              S.listItem()
                .title('Feedback')
                .icon(() => '⭐')
                .child(
                  S.documentTypeList('sittingFeedback')
                    .title('Feedback')
                    .defaultOrdering([{ field: 'createdAt', direction: 'desc' }])
                ),
            ])
        ),

      // === CARE — MEMBERSHIP REQUESTS ===
      S.listItem()
        .title('Care — Membership Requests')
        .icon(() => '🐾')
        .child(
          S.documentTypeList('membershipRequest')
            .title('Membership Requests')
            .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }])
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
