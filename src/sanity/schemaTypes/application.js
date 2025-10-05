export default {
  name: 'application',
  title: 'Adoption Application',
  type: 'document',
  fields: [
    // Applicant Information
    {
      name: 'applicantName',
      title: 'Applicant Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: Rule => Rule.required().email()
    },
    {
      name: 'phone',
      title: 'Phone',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'address',
      title: 'Address',
      type: 'text'
    },
    
    // Cat Reference
    {
      name: 'cat',
      title: 'Interested in Cat',
      type: 'reference',
      to: [{type: 'cat'}],
      validation: Rule => Rule.required()
    },
    
    // Application Details
    {
      name: 'housingType',
      title: 'Housing Type',
      type: 'string',
      options: {
        list: [
          {title: 'Own House', value: 'own'},
          {title: 'Rented Apartment', value: 'rent'},
          {title: 'Other', value: 'other'}
        ]
      }
    },
    {
      name: 'hasOtherPets',
      title: 'Has Other Pets',
      type: 'boolean'
    },
    {
      name: 'otherPetsDetails',
      title: 'Other Pets Details',
      type: 'text',
      hidden: ({parent}) => !parent?.hasOtherPets
    },
    {
      name: 'whyAdopt',
      title: 'Why Do You Want to Adopt?',
      type: 'text',
      validation: Rule => Rule.required().min(50)
    },
    {
      name: 'experience',
      title: 'Experience with Cats',
      type: 'text'
    },
    
    // Pipeline Status
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: '🆕 New', value: 'new'},
          {title: '👀 Under Review', value: 'review'},
          {title: '📞 Interview Scheduled', value: 'interview'},
          {title: '🏠 Home Visit Pending', value: 'homeVisit'},
          {title: '✅ Approved', value: 'approved'},
          {title: '❌ Rejected', value: 'rejected'},
          {title: '🎉 Adopted', value: 'adopted'}
        ]
      },
      initialValue: 'new'
    },
    
    // Team Collaboration
    {
      name: 'assignedTo',
      title: 'Assigned To',
      type: 'string',
      options: {
        list: [
          {title: 'Lucia', value: 'lucia'},
          {title: 'Besly', value: 'besly'},
          {title: 'Devraj', value: 'devraj'}
        ]
      }
    },
    {
      name: 'teamNotes',
      title: 'Team Notes',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          {name: 'author', type: 'string', title: 'Team Member'},
          {name: 'note', type: 'text', title: 'Note'},
          {name: 'timestamp', type: 'datetime', title: 'Date'},
          {
            name: 'vote',
            type: 'string',
            title: 'Vote',
            options: {
              list: ['Approve', 'Reject', 'Needs Discussion']
            }
          }
        ]
      }]
    },
    
    // Scheduling
    {
      name: 'interviewDate',
      title: 'Interview Date',
      type: 'datetime'
    },
    {
      name: 'homeVisitDate',
      title: 'Home Visit Date',
      type: 'datetime'
    },
    
    // Decision
    {
      name: 'decision',
      title: 'Final Decision',
      type: 'text'
    },
    
    // Metadata
    {
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
      initialValue: () => new Date().toISOString()
    }
  ],
  
  preview: {
    select: {
      name: 'applicantName',
      cat: 'cat.name',
      status: 'status',
      date: 'submittedAt'
    },
    prepare({name, cat, status, date}) {
      return {
        title: name,
        subtitle: `${cat} - ${status} - ${new Date(date).toLocaleDateString()}`
      }
    }
  }
}