import {ApplicantInfoDisplay} from './components/ApplicantInfoDisplay'
import {ContactMessageDisplay} from './components/ContactMessageDisplay'
import {MemberMessageLog} from './components/MemberMessageLog'
import {DeletionRequestedActions} from './components/DeletionRequestedActions'
import {CommunityMetrics} from './components/CommunityMetrics'
import {BroadcastSender} from './components/BroadcastSender'
import {MembershipRequestActions} from './components/MembershipRequestActions'

export const structure = (S) =>
  S.list()
    .title('Purrfect Love')
    .items([

      // ══════════════════════════════════════════
      // PURRFECT LOVE WEBSITE
      // ══════════════════════════════════════════
      S.listItem()
        .title('Purrfect Love Website')
        .icon(() => '🌐')
        .child(
          S.list()
            .title('Purrfect Love Website')
            .items([

              // Cats + Applications
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

              // Team Members
              S.listItem()
                .title('Team Members')
                .icon(() => '👥')
                .child(S.documentTypeList('teamMember')),

              // Blog Posts
              S.listItem()
                .title('Blog Posts')
                .icon(() => '✍️')
                .child(S.documentTypeList('blogPost')),

              // FAQs
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

              // Process Steps
              S.listItem()
                .title('Process Steps')
                .icon(() => '📝')
                .child(S.documentTypeList('processStep')),

              // Contact Messages
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

              // Site Settings
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
        ),

      S.divider(),

      // ══════════════════════════════════════════
      // COMMUNITY PORTAL
      // ══════════════════════════════════════════
      S.listItem()
        .title('Community Portal')
        .icon(() => '🏠')
        .child(
          S.list()
            .title('Community Portal')
            .items([

              // Members
              S.listItem()
                .title('Members')
                .icon(() => '👤')
                .child(
                  S.list()
                    .title('Members')
                    .items([
                      S.listItem()
                        .title('Requests')
                        .icon(() => '📥')
                        .child(
                          S.list()
                            .title('Requests')
                            .items([
                              S.listItem()
                                .title('Pending')
                                .icon(() => '⏳')
                                .child(
                                  S.documentTypeList('membershipRequest')
                                    .title('Pending Requests')
                                    .filter('_type == "membershipRequest" && status == "pending"')
                                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }])
                                    .child((documentId) =>
                                      S.document()
                                        .documentId(documentId)
                                        .schemaType('membershipRequest')
                                        .views([
                                          S.view.component(MembershipRequestActions).title('Review & Action'),
                                          S.view.form().title('Raw Data'),
                                        ])
                                    )
                                ),
                              S.listItem()
                                .title('All Requests')
                                .icon(() => '📋')
                                .child(
                                  S.documentTypeList('membershipRequest')
                                    .title('All Requests')
                                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }])
                                    .child((documentId) =>
                                      S.document()
                                        .documentId(documentId)
                                        .schemaType('membershipRequest')
                                        .views([
                                          S.view.component(MembershipRequestActions).title('Review & Action'),
                                          S.view.form().title('Raw Data'),
                                        ])
                                    )
                                ),
                            ])
                        ),
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
                      S.listItem()
                        .title('Deletion Requested')
                        .icon(() => '🔴')
                        .child(
                          S.documentTypeList('catSitter')
                            .title('Deletion Requested')
                            .filter('_type == "catSitter" && deletionRequested == true')
                            .defaultOrdering([{ field: 'deletionRequestedAt', direction: 'desc' }])
                            .child((documentId) =>
                              S.document()
                                .documentId(documentId)
                                .schemaType('catSitter')
                                .views([
                                  S.view.form().title('Profile (read-only)'),
                                  S.view.component(DeletionRequestedActions).title('Deletion Actions'),
                                ])
                            )
                        ),
                    ])
                ),


              // Messaging
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

              // Portal Feedback (bug reports + suggestions)
              S.listItem()
                .title('Portal Feedback')
                .icon(() => '🐛')
                .child(
                  S.documentTypeList('portalFeedback')
                    .title('Portal Feedback')
                    .defaultOrdering([{ field: 'date', direction: 'desc' }])
                ),

              // Member Reports
              S.listItem()
                .title('Member Reports')
                .icon(() => '🚩')
                .child(
                  S.documentTypeList('memberReport')
                    .title('Member Reports')
                    .defaultOrdering([{ field: '_createdAt', direction: 'desc' }])
                ),


              // Sit Records
              S.listItem()
                .title('Sit Records')
                .icon(() => '🏠')
                .child(
                  S.documentTypeList('sitRecord')
                    .title('Sit Records')
                    .defaultOrdering([{ field: 'createdAt', direction: 'desc' }])
                ),

              // Broadcast Messages
              S.listItem()
                .title('Broadcast Messages')
                .icon(() => '📢')
                .child(
                  S.documentTypeList('broadcastMessage')
                    .title('Broadcast Messages')
                    .defaultOrdering([{ field: '_createdAt', direction: 'desc' }])
                    .child((documentId) =>
                      S.document()
                        .documentId(documentId)
                        .schemaType('broadcastMessage')
                        .views([
                          S.view.form().title('Edit'),
                          S.view.component(BroadcastSender).title('Send'),
                        ])
                    )
                ),

              // Community Metrics
              S.listItem()
                .title('Community Metrics')
                .icon(() => '📊')
                .child(
                  S.component(CommunityMetrics)
                    .title('Community Metrics')
                    .id('community-metrics')
                ),

              // Deleted Accounts
              S.listItem()
                .title('Deleted Accounts')
                .icon(() => '🗑️')
                .child(
                  S.documentTypeList('deletedAccount')
                    .title('Deleted Accounts')
                    .defaultOrdering([{ field: '_createdAt', direction: 'desc' }])
                ),
            ])
        ),
    ])
