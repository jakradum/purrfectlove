import {StructureBuilder as S} from 'sanity/desk'

export const structure = (S) =>
  S.list()
    .title('Content')
    .items([
      // Applications with custom view
      S.listItem()
        .title('📋 Applications')
        .child(
          S.documentTypeList('application')
            .title('All Applications')
            .defaultOrdering([{field: 'submittedAt', direction: 'desc'}])
            .child(documentId =>
              S.document()
                .documentId(documentId)
                .schemaType('application')
            )
        ),
      
      // Other content
      S.documentTypeListItem('cat').title('🐱 Cats'),
      S.documentTypeListItem('teamMember').title('👥 Team'),
      S.documentTypeListItem('successStory').title('💚 Success Stories'),
      S.documentTypeListItem('faq').title('❓ FAQs'),
    ])