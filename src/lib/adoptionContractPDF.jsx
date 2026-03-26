import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const GREEN = '#2C5F4F'
const BROWN = '#C85C3F'
const LIGHT = '#F6F4F0'
const DARK = '#2A2A2A'
const MUTED = '#6B6B6B'
const RULE = '#D1D5DB'

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 80,
    paddingHorizontal: 56,
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    color: DARK,
    lineHeight: 1.5,
  },

  // Header
  header: {
    marginBottom: 28,
    paddingBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: GREEN,
    borderBottomStyle: 'solid',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  orgName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 20,
    color: GREEN,
    marginBottom: 2,
  },
  orgAddress: {
    fontSize: 8.5,
    color: MUTED,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  docLabel: {
    fontSize: 8,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  docRef: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: BROWN,
    letterSpacing: 0.5,
  },

  // Title
  title: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 15,
    color: GREEN,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.3,
  },

  // Preamble
  preamble: {
    backgroundColor: LIGHT,
    borderRadius: 5,
    padding: 14,
    marginBottom: 20,
    fontSize: 10,
    lineHeight: 1.7,
    color: '#444',
  },

  // Info grid
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: RULE,
    borderRadius: 5,
    padding: 12,
  },
  infoBoxTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
    borderBottomStyle: 'solid',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    width: 80,
    fontSize: 9,
    color: MUTED,
  },
  infoValue: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: DARK,
  },

  // Terms
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
    borderBottomStyle: 'solid',
  },
  termRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  termNum: {
    width: 20,
    fontFamily: 'Helvetica-Bold',
    color: BROWN,
    fontSize: 10,
  },
  termText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.6,
    color: '#333',
  },

  // Signature block
  sigSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: RULE,
    borderTopStyle: 'solid',
    paddingTop: 20,
  },
  sigGrid: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 8,
  },
  sigBox: {
    flex: 1,
  },
  sigLine: {
    borderBottomWidth: 0.75,
    borderBottomColor: DARK,
    borderBottomStyle: 'solid',
    marginBottom: 5,
    height: 28,
  },
  sigLabel: {
    fontSize: 8.5,
    color: MUTED,
  },
  sigName: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginTop: 2,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 56,
    right: 56,
    textAlign: 'center',
    fontSize: 7.5,
    color: '#9CA3AF',
    borderTopWidth: 0.5,
    borderTopColor: RULE,
    borderTopStyle: 'solid',
    paddingTop: 8,
  },
})

const TERMS = [
  'The adopter agrees to provide proper care, adequate nutrition, fresh water, and timely veterinary attention throughout the entire life of the animal.',
  'The adopter agrees not to abandon, sell, give away, or transfer ownership of the animal to any third party without prior written consent from Purrfect Love e.V.',
  'The adopter agrees to keep the animal in a safe environment. Cats shall not be allowed to roam unsupervised outdoors unless in a secured enclosure.',
  'If the animal is not already spayed or neutered at the time of adoption, the adopter agrees to have the procedure performed by a licensed veterinarian within 90 days.',
  'The adopter agrees to allow Purrfect Love e.V. to conduct welfare follow-up contact (by phone, video, or in-person visit) within the first year of adoption.',
  'In the event the adopter is no longer able to care for the animal for any reason, the adopter agrees to contact Purrfect Love e.V. as the first point of contact before any rehoming arrangement is made.',
  'Purrfect Love e.V. makes no warranties, express or implied, regarding the health or temperament of the animal beyond disclosures made during the adoption process.',
  'This agreement constitutes the entire understanding between the parties and may only be amended in writing, signed by both parties.',
]

export function AdoptionContractPDF({ applicantName, catName, applicationId, date }) {
  return (
    <Document
      title={`Adoption Agreement – ${catName}`}
      author="Purrfect Love e.V."
    >
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.orgName}>Purrfect Love e.V.</Text>
            <Text style={styles.orgAddress}>Heusteigstraße 99 · 70180 Stuttgart · support@purrfectlove.org</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docLabel}>Application Reference</Text>
            <Text style={styles.docRef}>#{applicationId}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>CAT ADOPTION AGREEMENT</Text>

        {/* Preamble */}
        <Text style={styles.preamble}>
          This Adoption Agreement ("Agreement") is entered into on {date} between{' '}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>Purrfect Love e.V.</Text>
          , a registered animal welfare association (VR 727528), and the adopter named below.
          By accepting this agreement, both parties commit to the welfare and safety of the animal.
        </Text>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Adopter Details</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{applicantName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Agreement Date</Text>
              <Text style={styles.infoValue}>{date}</Text>
            </View>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Animal Being Adopted</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cat Name</Text>
              <Text style={styles.infoValue}>{catName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ref. ID</Text>
              <Text style={styles.infoValue}>#{applicationId}</Text>
            </View>
          </View>
        </View>

        {/* Terms */}
        <Text style={styles.sectionTitle}>Terms and Conditions of Adoption</Text>
        {TERMS.map((term, i) => (
          <View key={i} style={styles.termRow}>
            <Text style={styles.termNum}>{i + 1}.</Text>
            <Text style={styles.termText}>{term}</Text>
          </View>
        ))}

        {/* Signatures */}
        <View style={styles.sigSection}>
          <Text style={styles.sectionTitle}>Signatures</Text>
          <Text style={{ fontSize: 9, color: MUTED, marginBottom: 16 }}>
            By signing below, both parties acknowledge they have read, understood, and agree to the terms of this Adoption Agreement.
          </Text>
          <View style={styles.sigGrid}>
            <View style={styles.sigBox}>
              <View style={styles.sigLine} />
              <Text style={styles.sigLabel}>Adopter Signature &amp; Date</Text>
              <Text style={styles.sigName}>{applicantName}</Text>
            </View>
            <View style={styles.sigBox}>
              <View style={styles.sigLine} />
              <Text style={styles.sigLabel}>Purrfect Love Representative &amp; Date</Text>
              <Text style={styles.sigName}>Purrfect Love e.V.</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Purrfect Love e.V. · Heusteigstraße 99, 70180 Stuttgart · VR 727528 · support@purrfectlove.org · www.purrfectlove.org
        </Text>

      </Page>
    </Document>
  )
}
