export default {
  name: 'application',
  title: 'Adoption Application',
  type: 'document',
  fields: [
    // === APPLICANT INFORMATION ===
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
    {
      name: 'cat',
      title: 'Interested in Cat',
      type: 'reference',
      to: [{type: 'cat'}],
      validation: Rule => Rule.required()
    },
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
    {
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true
    },

    // === FOR OFFICIAL USE ONLY ===
    {
      name: 'status',
      title: '📌 Current Status',
      type: 'string',
      options: {
        list: [
          {title: '🆕 New', value: 'new'},
          {title: '👀 Under Review', value: 'review'},
          {title: '📞 Interview Scheduled', value: 'interviewScheduled'},
          {title: '✅ Interview Complete', value: 'interviewComplete'},
          {title: '🏠 Home Visit Scheduled', value: 'homeVisitScheduled'},
          {title: '✅ Home Visit Complete', value: 'homeVisitComplete'},
          {title: '✅ Approved', value: 'approved'},
          {title: '❌ Rejected', value: 'rejected'},
          {title: '🎉 Adopted', value: 'adopted'}
        ]
      },
      initialValue: 'new'
    },
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

    // INTERVIEW SECTION
    {
      name: 'interviewCompleted',
      title: 'Interview Completed?',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'interviewedBy',
      title: 'Interviewed By',
      type: 'string',
      options: {
        list: [
          {title: 'Lucia', value: 'lucia'},
          {title: 'Besly', value: 'besly'},
          {title: 'Devraj', value: 'devraj'}
        ]
      },
      hidden: ({parent}) => !parent?.interviewCompleted
    },
    {
      name: 'interviewDate',
      title: 'Interview Date',
      type: 'datetime',
      hidden: ({parent}) => !parent?.interviewCompleted
    },
    {
      name: 'interviewNotes',
      title: 'Interview Notes',
      type: 'text',
      hidden: ({parent}) => !parent?.interviewCompleted
    },

    // HOME VISIT SECTION
    {
      name: 'homeVisitCompleted',
      title: 'Home Visit Completed?',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'homeVisitBy',
      title: 'Home Visit Conducted By',
      type: 'string',
      options: {
        list: [
          {title: 'Lucia', value: 'lucia'},
          {title: 'Besly', value: 'besly'},
          {title: 'Devraj', value: 'devraj'}
        ]
      },
      hidden: ({parent}) => !parent?.homeVisitCompleted
    },
    {
      name: 'homeVisitDate',
      title: 'Home Visit Date',
      type: 'datetime',
      hidden: ({parent}) => !parent?.homeVisitCompleted
    },
    {
      name: 'homeVisitNotes',
      title: 'Home Visit Notes',
      type: 'text',
      hidden: ({parent}) => !parent?.homeVisitCompleted
    },

    // TEAM FEEDBACK
    {
      name: 'teamFeedback',
      title: 'Team Decision',
      type: 'string',
      options: {
        list: [
          {title: '✅ Approve', value: 'approve'},
          {title: '💬 Needs Discussion', value: 'discuss'},
          {title: '❌ Reject', value: 'reject'}
        ]
      }
    },
    {
      name: 'feedbackNotes',
      title: 'Detailed Feedback',
      type: 'text',
      rows: 5
    },

    // FINAL DECISION
    {
      name: 'finalDecision',
      title: 'Final Decision',
      type: 'string',
      options: {
        list: [
          {title: 'Approved', value: 'approved'},
          {title: 'Rejected', value: 'rejected'},
          {title: 'Pending', value: 'pending'}
        ]
      },
      initialValue: 'pending'
    },
    {
      name: 'rejectionReason',
      title: 'Rejection Reason',
      type: 'text',
      hidden: ({parent}) => parent?.finalDecision !== 'rejected'
    },
    {
      name: 'decisionDate',
      title: 'Decision Date',
      type: 'datetime'
    },
    {
      name: 'adoptionDate',
      title: 'Adoption Date',
      type: 'datetime',
      hidden: ({parent}) => parent?.status !== 'adopted'
    },

    // FOLLOW UP
    {
      name: 'followUpRequired',
      title: 'Follow-up Required?',
      type: 'boolean'
    },
    {
      name: 'followUpDate',
      title: 'Follow-up Date',
      type: 'datetime',
      hidden: ({parent}) => !parent?.followUpRequired
    },
    {
      name: 'followUpNotes',
      title: 'Follow-up Notes',
      type: 'text',
      hidden: ({parent}) => !parent?.followUpRequired
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
      const statusEmoji = {
        new: '🆕',
        review: '👀',
        interviewScheduled: '📞',
        interviewComplete: '✅',
        homeVisitScheduled: '🏠',
        homeVisitComplete: '✅',
        approved: '✅',
        rejected: '❌',
        adopted: '🎉'
      }
      return {
        title: `${statusEmoji[status]} ${name}`,
        subtitle: `${cat} - ${new Date(date).toLocaleDateString()}`
      }
    }
  }
}