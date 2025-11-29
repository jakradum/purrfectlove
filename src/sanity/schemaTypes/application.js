export default {
  name: 'application',
  title: 'Adoption Application',
  type: 'document',
  fields: [
    // === APPLICATION ID ===
    {
      name: 'applicationId',
      title: 'Application ID',
      type: 'string',
      readOnly: true,
      hidden: true
    },
    // === APPLICANT INFORMATION (hidden in form, shown in custom view) ===
    {
      name: 'applicantName',
      title: 'Applicant Name',
      type: 'string',
      validation: Rule => Rule.required(),
      readOnly: true,
      hidden: true
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: Rule => Rule.required().email(),
      readOnly: true,
      hidden: true
    },
    {
      name: 'phone',
      title: 'Phone',
      type: 'string',
      validation: Rule => Rule.required(),
      readOnly: true,
      hidden: true
    },
    {
      name: 'address',
      title: 'Address',
      type: 'text',
      readOnly: true,
      hidden: true
    },
    {
      name: 'cat',
      title: 'Interested in Cat',
      type: 'reference',
      to: [{type: 'cat'}],
      validation: Rule => Rule.required(),
      readOnly: true,
      hidden: true
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
      },
      readOnly: true,
      hidden: true
    },
    {
      name: 'hasOtherPets',
      title: 'Has Other Pets',
      type: 'boolean',
      readOnly: true,
      hidden: true
    },
    {
      name: 'otherPetsDetails',
      title: 'Other Pets Details',
      type: 'text',
      readOnly: true,
      hidden: true
    },
    {
      name: 'whyAdopt',
      title: 'Why Do You Want to Adopt?',
      type: 'text',
      validation: Rule => Rule.required().min(50),
      readOnly: true,
      hidden: true
    },
    {
      name: 'experience',
      title: 'Experience with Cats',
      type: 'text',
      readOnly: true,
      hidden: true
    },
    {
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true,
      hidden: true
    },

    // === FOR OFFICIAL USE ONLY ===
    // Status colors: new=#3b82f6 (blue), evaluation=#f59e0b (amber), adopted=#22c55e (green), rejected=#ef4444 (red), returned=#8b5cf6 (purple)
    {
      name: 'status',
      title: 'Current Status',
      type: 'string',
      fieldset: 'officialUse',
      options: {
        list: [
          {title: 'New', value: 'new'},
          {title: 'Interview / Evaluation', value: 'evaluation'},
          {title: 'Adopted', value: 'adopted'},
          {title: 'Rejected', value: 'rejected'},
          {title: 'Returned Cat', value: 'returned'}
        ]
      },
      initialValue: 'new'
    },
    {
      name: 'assignedTo',
      title: 'Assigned To',
      type: 'string',
      fieldset: 'officialUse',
      options: {
        list: [
          {title: 'Lucia', value: 'lucia'},
          {title: 'Besly', value: 'besly'},
          {title: 'Devraj', value: 'devraj'}
        ]
      }
    },

    // DUPLICATE DETECTION
    {
      name: 'isDuplicateOf',
      title: 'Mark as Duplicate Of',
      description: 'Link to earlier application(s) from the same person. This will automatically set status to "Repeat Applicant".',
      type: 'array',
      fieldset: 'officialUse',
      of: [{
        type: 'reference',
        to: [{type: 'application'}],
        options: {
          filter: ({document}) => {
            // Only show applications submitted before this one
            return {
              filter: '_type == "application" && _id != $currentId && submittedAt < $currentDate',
              params: {
                currentId: document._id,
                currentDate: document.submittedAt || new Date().toISOString()
              }
            }
          }
        }
      }]
    },

    // INTERVIEW SECTION
    {
      name: 'interviewCompleted',
      title: 'Interview Completed?',
      type: 'boolean',
      fieldset: 'officialUse',
      initialValue: false
    },
    {
      name: 'interviewedBy',
      title: 'Interviewed By',
      type: 'string',
      fieldset: 'officialUse',
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
      fieldset: 'officialUse',
      hidden: ({parent}) => !parent?.interviewCompleted
    },
    {
      name: 'interviewNotes',
      title: 'Interview Notes',
      type: 'text',
      fieldset: 'officialUse',
      hidden: ({parent}) => !parent?.interviewCompleted
    },

    // HOME VISIT SECTION
    {
      name: 'homeVisitCompleted',
      title: 'Home Visit Completed?',
      type: 'boolean',
      fieldset: 'officialUse',
      initialValue: false
    },
    {
      name: 'homeVisitBy',
      title: 'Home Visit Conducted By',
      type: 'string',
      fieldset: 'officialUse',
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
      fieldset: 'officialUse',
      hidden: ({parent}) => !parent?.homeVisitCompleted
    },
    {
      name: 'homeVisitNotes',
      title: 'Home Visit Notes',
      type: 'text',
      fieldset: 'officialUse',
      hidden: ({parent}) => !parent?.homeVisitCompleted
    },

    // TEAM FEEDBACK
    {
      name: 'teamFeedback',
      title: 'Team Decision',
      type: 'string',
      fieldset: 'officialUse',
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
      fieldset: 'officialUse',
      rows: 5
    },

    // FINAL DECISION
    {
      name: 'finalDecision',
      title: 'Final Decision',
      type: 'string',
      fieldset: 'officialUse',
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
      fieldset: 'officialUse',
      hidden: ({parent}) => parent?.finalDecision !== 'rejected'
    },
    {
      name: 'decisionDate',
      title: 'Decision Date',
      type: 'datetime',
      fieldset: 'officialUse'
    },
    {
      name: 'adoptionDate',
      title: 'Adoption Date',
      type: 'datetime',
      fieldset: 'officialUse',
      hidden: ({parent}) => parent?.status !== 'adopted' && parent?.status !== 'returned'
    },
    {
      name: 'returnedDate',
      title: 'Returned Date',
      type: 'datetime',
      fieldset: 'officialUse',
      hidden: ({parent}) => parent?.status !== 'returned'
    },
    {
      name: 'returnReason',
      title: 'Reason for Return',
      type: 'text',
      fieldset: 'officialUse',
      hidden: ({parent}) => parent?.status !== 'returned'
    },

    // FOLLOW UP
    {
      name: 'followUpRequired',
      title: 'Follow-up Required?',
      type: 'boolean',
      fieldset: 'officialUse'
    },
    {
      name: 'followUpDate',
      title: 'Follow-up Date',
      type: 'datetime',
      fieldset: 'officialUse',
      hidden: ({parent}) => !parent?.followUpRequired
    },
    {
      name: 'followUpNotes',
      title: 'Follow-up Notes',
      type: 'text',
      fieldset: 'officialUse',
      hidden: ({parent}) => !parent?.followUpRequired
    }
  ],

  fieldsets: [
  {
    name: 'officialUse',
    title: 'For Official Use',
    description: 'Please leave your feedback and update status below here.',
    options: {
      collapsible: true,
      collapsed: false
    }
  }
],

orderings: [
  {
    title: 'Newest First',
    name: 'submittedAtDesc',
    by: [{field: 'submittedAt', direction: 'desc'}]
  },
  {
    title: 'Oldest First',
    name: 'submittedAtAsc',
    by: [{field: 'submittedAt', direction: 'asc'}]
  },
  {
    title: 'Status',
    name: 'status',
    by: [{field: 'status', direction: 'asc'}]
  },
  {
    title: 'Assigned To',
    name: 'assignedTo',
    by: [{field: 'assignedTo', direction: 'asc'}]
  },
  {
    title: 'Final Decision',
    name: 'finalDecision',
    by: [{field: 'finalDecision', direction: 'asc'}]
  }
],

  preview: {
    select: {
      applicationId: 'applicationId',
      name: 'applicantName',
      cat: 'cat.name',
      status: 'status',
      assignedTo: 'assignedTo',
      date: 'submittedAt',
      isDuplicateOf: 'isDuplicateOf'
    },
    prepare({applicationId, name, cat, status, assignedTo, date, isDuplicateOf}) {
      // Status labels with color indicators
      const statusLabels = {
        new: '🔵 New',
        evaluation: '🟡 Evaluation',
        adopted: '🟢 Adopted',
        rejected: '🔴 Rejected',
        returned: '🟣 Returned'
      }

      const assignedLabels = {
        lucia: 'Lucia',
        besly: 'Besly',
        devraj: 'Devraj'
      }

      const idPrefix = applicationId ? `#${applicationId} ` : ''
      const hasDuplicates = isDuplicateOf && isDuplicateOf.length > 0
      const repeatLabel = hasDuplicates ? ' [REPEAT]' : ''

      return {
        title: `${idPrefix}${name}${repeatLabel}`,
        subtitle: `${cat} • ${statusLabels[status] || status} • ${assignedLabels[assignedTo] || 'Unassigned'} • ${new Date(date).toLocaleDateString()}`
      }
    }
  }
}