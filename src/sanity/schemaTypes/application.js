import {DuplicateNotice} from '../components/DuplicateNotice'
import {CatAdoptedNotice} from '../components/CatAdoptedNotice'
import {OpenToAnyCatNotice} from '../components/OpenToAnyCatNotice'

// Helper to check if application is marked as duplicate
const isMarkedAsDuplicate = ({parent}) => parent?.isDuplicateOf && parent.isDuplicateOf.length > 0

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
      validation: Rule => Rule.custom((cat, context) => {
        // Cat is required unless isOpenToAnyCat is true
        if (!cat && !context.parent?.isOpenToAnyCat) {
          return 'Cat is required unless applicant is open to any cat'
        }
        return true
      }),
      readOnly: true,
      hidden: true
    },
    {
      name: 'isOpenToAnyCat',
      title: 'Open to Any Cat',
      type: 'boolean',
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
    // DUPLICATE DETECTION - At the top so it's the first thing team sees
    {
      name: 'isDuplicateOf',
      title: 'Mark as Duplicate Of',
      description: 'Link to the original application from this person. Only shows applications that are not already marked as duplicates.',
      type: 'array',
      fieldset: 'officialUse',
      of: [{
        type: 'reference',
        to: [{type: 'application'}],
        options: {
          filter: ({document}) => {
            // Only show applications that:
            // 1. Are submitted before this one
            // 2. Are NOT already marked as duplicates (no isDuplicateOf references)
            return {
              filter: '_type == "application" && _id != $currentId && submittedAt < $currentDate && (!defined(isDuplicateOf) || count(isDuplicateOf) == 0)',
              params: {
                currentId: document._id,
                currentDate: document.submittedAt || new Date().toISOString()
              }
            }
          }
        }
      }]
    },
    // Notice shown when marked as duplicate
    {
      name: 'duplicateNotice',
      title: ' ',
      type: 'string',
      fieldset: 'officialUse',
      readOnly: true,
      hidden: ({parent}) => !parent?.isDuplicateOf || parent.isDuplicateOf.length === 0,
      components: {
        field: DuplicateNotice
      }
    },

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
      initialValue: 'new',
      readOnly: isMarkedAsDuplicate
    },

    // Cat adopted notice - shows when the original cat is already adopted
    {
      name: 'catAdoptedNotice',
      title: ' ',
      type: 'string',
      fieldset: 'officialUse',
      readOnly: true,
      hidden: ({parent}) => parent?.isOpenToAnyCat,
      components: {
        field: CatAdoptedNotice
      }
    },

    // Open to any cat notice - shows when applicant didn't select a specific cat
    {
      name: 'openToAnyCatNotice',
      title: ' ',
      type: 'string',
      fieldset: 'officialUse',
      readOnly: true,
      hidden: ({parent}) => !parent?.isOpenToAnyCat,
      components: {
        field: OpenToAnyCatNotice
      }
    },

    // Reassign to different cat
    {
      name: 'reassignToCat',
      title: 'Redirect to New Cat',
      type: 'reference',
      fieldset: 'officialUse',
      to: [{type: 'cat'}],
      description: 'Assign this applicant to a new cat if original cat is already adopted by someone else',
      options: {
        filter: ({document}) => {
          // Only show cats that are:
          // 1. Not already adopted (no application with status "adopted")
          // 2. Not the original cat this application was for
          const originalCatId = document?.cat?._ref || ''
          return {
            filter: '_type == "cat" && _id != $originalCatId && count(*[_type == "application" && cat._ref == ^._id && status == "adopted"]) == 0',
            params: {
              originalCatId
            }
          }
        }
      },
      readOnly: isMarkedAsDuplicate
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
      },
      readOnly: isMarkedAsDuplicate
    },

    // INTERVIEW SECTION
    {
      name: 'interviewCompleted',
      title: 'Interview Completed?',
      type: 'boolean',
      fieldset: 'officialUse',
      initialValue: false,
      readOnly: isMarkedAsDuplicate
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
      hidden: ({parent}) => !parent?.interviewCompleted,
      readOnly: isMarkedAsDuplicate
    },
    {
      name: 'interviewDate',
      title: 'Interview Date',
      type: 'datetime',
      fieldset: 'officialUse',
      hidden: ({parent}) => !parent?.interviewCompleted,
      readOnly: isMarkedAsDuplicate
    },
    {
      name: 'interviewNotes',
      title: 'Interview Notes',
      type: 'text',
      fieldset: 'officialUse',
      hidden: ({parent}) => !parent?.interviewCompleted,
      readOnly: isMarkedAsDuplicate
    },

    // HOME VISIT SECTION
    {
      name: 'homeVisitCompleted',
      title: 'Home Visit Completed?',
      type: 'boolean',
      fieldset: 'officialUse',
      initialValue: false,
      readOnly: isMarkedAsDuplicate
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
      hidden: ({parent}) => !parent?.homeVisitCompleted,
      readOnly: isMarkedAsDuplicate
    },
    {
      name: 'homeVisitDate',
      title: 'Home Visit Date',
      type: 'datetime',
      fieldset: 'officialUse',
      hidden: ({parent}) => !parent?.homeVisitCompleted,
      readOnly: isMarkedAsDuplicate
    },
    {
      name: 'homeVisitNotes',
      title: 'Home Visit Notes',
      type: 'text',
      fieldset: 'officialUse',
      hidden: ({parent}) => !parent?.homeVisitCompleted,
      readOnly: isMarkedAsDuplicate
    },

    // NOTES
    {
      name: 'notes',
      title: 'Notes',
      type: 'text',
      fieldset: 'officialUse',
      rows: 5,
      description: 'Any additional notes about this application',
      readOnly: isMarkedAsDuplicate
    },
    {
      name: 'adoptionDate',
      title: 'Adoption Date',
      type: 'datetime',
      fieldset: 'officialUse',
      hidden: ({parent}) => parent?.status !== 'adopted' && parent?.status !== 'returned',
      readOnly: isMarkedAsDuplicate
    },
    {
      name: 'returnedDate',
      title: 'Returned Date',
      type: 'datetime',
      fieldset: 'officialUse',
      hidden: ({parent}) => parent?.status !== 'returned',
      readOnly: isMarkedAsDuplicate
    },
    {
      name: 'returnReason',
      title: 'Reason for Return',
      type: 'text',
      fieldset: 'officialUse',
      hidden: ({parent}) => parent?.status !== 'returned',
      readOnly: isMarkedAsDuplicate
    },

    // FOLLOW UP
    {
      name: 'followUpRequired',
      title: 'Follow-up Required?',
      type: 'boolean',
      fieldset: 'officialUse',
      readOnly: isMarkedAsDuplicate
    },
    {
      name: 'followUpDate',
      title: 'Follow-up Date',
      type: 'datetime',
      fieldset: 'officialUse',
      hidden: ({parent}) => !parent?.followUpRequired,
      readOnly: isMarkedAsDuplicate
    },
    {
      name: 'followUpNotes',
      title: 'Follow-up Notes',
      type: 'text',
      fieldset: 'officialUse',
      hidden: ({parent}) => !parent?.followUpRequired,
      readOnly: isMarkedAsDuplicate
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
    title: 'Location (Germany first)',
    name: 'locationDeFirst',
    by: [{field: 'cat.locationDe', direction: 'desc'}]
  },
  {
    title: 'Location (India first)',
    name: 'locationEnFirst',
    by: [{field: 'cat.locationEn', direction: 'desc'}]
  }
],

  preview: {
    select: {
      applicationId: 'applicationId',
      name: 'applicantName',
      cat: 'cat.name',
      catLocationEn: 'cat.locationEn',
      catLocationDe: 'cat.locationDe',
      isOpenToAnyCat: 'isOpenToAnyCat',
      reassignedCat: 'reassignToCat.name',
      status: 'status',
      assignedTo: 'assignedTo',
      date: 'submittedAt',
      isDuplicateOf: 'isDuplicateOf'
    },
    prepare({applicationId, name, cat, catLocationEn, catLocationDe, isOpenToAnyCat, reassignedCat, status, assignedTo, date, isDuplicateOf}) {
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

      // Determine country flag based on cat location (empty for "any cat" applications)
      const countryFlag = catLocationDe ? '🇩🇪' : catLocationEn ? '🇮🇳' : ''

      const idPrefix = applicationId ? `#${applicationId} ` : ''
      const hasDuplicates = isDuplicateOf && isDuplicateOf.length > 0
      const repeatLabel = hasDuplicates ? ' [REPEAT]' : ''

      // Show "Any Cat -> {assigned cat}" if applicant is open to any cat
      let catDisplay = cat
      if (isOpenToAnyCat) {
        catDisplay = reassignedCat
          ? `🐱 Any → ${reassignedCat}`
          : '🐱 Any Cat'
      }

      return {
        title: `${countryFlag} ${idPrefix}${name}${repeatLabel}`,
        subtitle: `${catDisplay} • ${statusLabels[status] || status} • ${assignedLabels[assignedTo] || 'Unassigned'} • ${new Date(date).toLocaleDateString()}`
      }
    }
  }
}