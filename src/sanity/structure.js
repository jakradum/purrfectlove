export const structure = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('📋 Applications')
        .child(
          S.documentTypeList('application')
            .title('Adoption Applications')
        ),
      S.divider(),
      S.listItem()
        .title('🐱 Cats')
        .child(
          S.documentTypeList('cat')
            .title('All Cats')
        ),
      S.divider(),
      S.listItem()
        .title('👥 Team Members')
        .child(S.documentTypeList('teamMember').title('Team')),
      S.listItem()
        .title('❓ FAQs')
        .child(S.documentTypeList('faq').title('FAQs')),
      S.listItem()
        .title('🎉 Success Stories')
        .child(S.documentTypeList('successStory').title('Success Stories')),
    ])