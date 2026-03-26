import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const G = '#2C5F4F'   // hunterGreen
const B = '#C85C3F'   // tabbyBrown
const CR = '#F6F4F0'  // whiskerCream
const DK = '#2A2A2A'
const MT = '#6B6B6B'
const RU = '#CCCCCC'

const s = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 72,
    paddingHorizontal: 50,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: DK,
    backgroundColor: CR,
  },

  // ── HEADER ──────────────────────────────────────────────
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  logo: { width: 90, height: 90, objectFit: 'contain' },
  contactBlock: { alignItems: 'flex-end', paddingTop: 8 },
  contactRow: { flexDirection: 'row', marginBottom: 4 },
  contactLabel: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: DK },
  contactVal: { fontSize: 9.5, color: B, marginLeft: 4 },

  // ── COVER ───────────────────────────────────────────────
  cover: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  coverLeft: { flex: 1, paddingRight: 20 },
  coverDoc: { fontFamily: 'Helvetica-Bold', fontSize: 13, letterSpacing: 0.4, color: DK, marginBottom: 10 },
  coverOrg: { fontFamily: 'Helvetica-Bold', fontSize: 13, color: G, marginBottom: 8 },
  coverInsta: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: DK, lineHeight: 1.5 },
  catImg: { width: 180, height: 180, borderRadius: 90 },
  catImgPlaceholder: { width: 180, height: 180, borderRadius: 90, backgroundColor: CR },

  // ── PREAMBLE ────────────────────────────────────────────
  preamble: { fontFamily: 'Helvetica-Bold', fontSize: 10.5, lineHeight: 1.8, color: DK, textTransform: 'uppercase', marginBottom: 24 },
  preambleHL: { color: B },

  // ── SECTION HEADER ──────────────────────────────────────
  sectionHead: {
    fontFamily: 'Helvetica-Bold', fontSize: 12.5, color: DK,
    textTransform: 'uppercase', letterSpacing: 0.4,
    paddingBottom: 5,
    borderBottomWidth: 2, borderBottomColor: DK, borderBottomStyle: 'solid',
    marginTop: 18, marginBottom: 10,
  },

  // ── SUB-SECTION HEADER ──────────────────────────────────
  subHead: {
    fontFamily: 'Helvetica-Bold', fontSize: 10.5, color: DK,
    marginTop: 11, marginBottom: 5,
  },

  // ── BODY TEXT ───────────────────────────────────────────
  body: { fontSize: 10, lineHeight: 1.7, color: '#333', marginBottom: 6 },

  // ── BULLET ──────────────────────────────────────────────
  bulletRow: { flexDirection: 'row', marginBottom: 5, paddingLeft: 6 },
  bulletDot: { width: 14, fontSize: 10.5, color: B, marginTop: 0.5 },
  bulletText: { flex: 1, fontSize: 10, lineHeight: 1.65, color: '#333' },

  // ── IDENTIFICATION FIELDS ───────────────────────────────
  fieldRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 9 },
  fieldLabel: { width: 160, fontSize: 10, fontFamily: 'Helvetica-Bold', color: DK },
  fieldFilled: {
    flex: 1, fontSize: 10, fontFamily: 'Helvetica-Bold', color: B,
    borderBottomWidth: 0.75, borderBottomColor: DK, paddingBottom: 2,
  },
  fieldBlank: {
    flex: 1, height: 15,
    borderBottomWidth: 0.75, borderBottomColor: DK,
  },

  // ── CALLOUT ─────────────────────────────────────────────
  callout: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 3, borderLeftColor: G, borderLeftStyle: 'solid',
    padding: 10, marginTop: 6, marginBottom: 6,
    fontSize: 10, lineHeight: 1.65, color: DK,
  },
  calloutBold: { fontFamily: 'Helvetica-Bold', color: B },

  // ── SIGNATURES ──────────────────────────────────────────
  sigGrid: { flexDirection: 'row', marginTop: 14 },
  sigBox: { flex: 1 },
  sigBoxR: { flex: 1, marginLeft: 36 },
  sigTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: G, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.3 },
  sigField: { marginBottom: 13 },
  sigLbl: { fontSize: 8.5, color: MT, marginBottom: 3 },
  sigLine: { borderBottomWidth: 0.75, borderBottomColor: DK, height: 18 },
  sigFilled: { borderBottomWidth: 0.75, borderBottomColor: DK, paddingBottom: 2, fontSize: 10, fontFamily: 'Helvetica-Bold', color: DK },

  // ── FOOTER ──────────────────────────────────────────────
  footer: {
    position: 'absolute', bottom: 26, left: 50, right: 50,
    textAlign: 'center', fontSize: 7.5, color: '#AAAAAA',
    borderTopWidth: 0.5, borderTopColor: RU, paddingTop: 7,
  },
  pageNum: {
    position: 'absolute', bottom: 26, right: 50,
    fontSize: 8, color: MT,
  },
})

// ── Small helpers ──────────────────────────────────────────────────────────────

function SectionHead({ children }) {
  return <Text style={s.sectionHead}>{children}</Text>
}

function SubHead({ children }) {
  return <Text style={s.subHead}>{children}</Text>
}

function Body({ children }) {
  return <Text style={s.body}>{children}</Text>
}

function Bullet({ children }) {
  return (
    <View style={s.bulletRow}>
      <Text style={s.bulletDot}>•</Text>
      <Text style={s.bulletText}>{children}</Text>
    </View>
  )
}

function FieldRow({ label, value }) {
  return (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>{label}</Text>
      {value
        ? <Text style={s.fieldFilled}>{value}</Text>
        : <View style={s.fieldBlank} />}
    </View>
  )
}

function Footer() {
  return (
    <Text style={s.footer} fixed>
      Purrfect Love e.V. · Heusteigstraße 99, 70180 Stuttgart · VR 727528 · support@purrfectlove.org · www.purrfectlove.org
    </Text>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AdoptionContractPDF({
  applicantName,
  catName,
  applicationId,
  date,
  catPhotoUrl,
  logoDataUrl,
  catAge,
  catGender,
  applicantPhone,
  applicantAddress,
  applicantEmail,
}) {
  const ageLabel = catAge || null
  const genderLabel = catGender ? (catGender === 'male' ? 'Male' : 'Female') : null

  return (
    <Document title={`Adoption Agreement – ${catName}`} author="Purrfect Love e.V.">
      <Page size="A4" style={s.page} wrap>

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <View style={s.header} fixed>
          {logoDataUrl
            ? <Image src={logoDataUrl} style={s.logo} />
            : <View style={{ width: 90, height: 90 }} />}

          <View style={s.contactBlock}>
            <View style={s.contactRow}>
              <Text style={s.contactLabel}>Telefon:</Text>
              <Text style={s.contactVal}>+49 (0) 15253432348</Text>
            </View>
            <View style={s.contactRow}>
              <Text style={s.contactLabel}>E-Mail:</Text>
              <Text style={s.contactVal}>support@purrfectlove.org</Text>
            </View>
            <View style={s.contactRow}>
              <Text style={s.contactLabel}>Website:</Text>
              <Text style={s.contactVal}>www.purrfectlove.org</Text>
            </View>
          </View>
        </View>

        {/* ── COVER ──────────────────────────────────────────────────── */}
        <View style={s.cover}>
          <View style={s.coverLeft}>
            <Text style={s.coverDoc}>ADOPTION AGREEMENT</Text>
            <Text style={s.coverOrg}>PURRFECT LOVE</Text>
            <Text style={s.coverInsta}>{'ON INSTAGRAM\n@PURRFECTLOVE.BANGALORE'}</Text>
          </View>
          {catPhotoUrl
            ? <Image src={catPhotoUrl} style={s.catImg} />
            : <View style={s.catImgPlaceholder} />}
        </View>

        {/* ── PREAMBLE ───────────────────────────────────────────────── */}
        <Text style={s.preamble}>
          {'THIS CAT ADOPTION AGREEMENT ("AGREEMENT") IS ENTERED INTO ON THIS ___ DAY OF ________, 20__, BY AND BETWEEN '}
          <Text style={s.preambleHL}>PURRFECT LOVE</Text>
          {' (THE "ORIGINAL CAREGIVER") AND '}
          <Text style={s.preambleHL}>{applicantName.toUpperCase()}</Text>
          {' (THE "ADOPTER").'}
        </Text>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 1. PURPOSE                                                  */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionHead>1. Purpose</SectionHead>
        <Body>
          This Agreement outlines the responsibilities and commitments of the Adopter in providing a safe and suitable home for the adopted cat. The Adopter agrees to abide by the terms outlined below to ensure the cat's well-being and safety.
        </Body>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 2. IDENTIFICATION OF THE CAT                               */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionHead>2. Identification of the Cat</SectionHead>
        <Body>The adopted cat is identified as follows:</Body>

        <FieldRow label="Name:" value={catName} />
        <FieldRow label="Breed:" />
        <FieldRow label="Color / Markings:" />
        <FieldRow label="Age / DOB:" value={ageLabel} />
        <FieldRow label="Microchip Number:" />
        <FieldRow label="Gender:" value={genderLabel} />
        <FieldRow label="Spayed / Neutered:" />

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 3. ADOPTION TERMS                                          */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionHead>3. Adoption Terms</SectionHead>
        <Body>The Adopter agrees to the following conditions:</Body>

        {/* 3.1 */}
        <SubHead>3.1  Living Environment</SubHead>
        <Bullet>The cat will reside in a private home as a companion animal.</Bullet>
        <Bullet>Windows and balconies must be securely cat-proofed with rigid or strong mesh or netting before the cat's arrival.</Bullet>

        {/* 3.2 */}
        <SubHead>3.2  Nutrition</SubHead>
        <Bullet>The cat will be provided with sufficient quantities of nutritious wet and dry food and fresh water daily.</Bullet>
        <Bullet>As obligate carnivores, cats require meat-based proteins and fats.</Bullet>
        <Bullet>Rice and cow's milk must not be fed to the cat, as rice provides no nutritional value and most cats are lactose intolerant, which may cause significant health issues.</Bullet>

        {/* 3.3 */}
        <SubHead>3.3  Interaction and Handling</SubHead>
        <Bullet>The Adopter agrees to speak gently and softly to the cat, as cats are highly sensitive to tone and volume.</Bullet>
        <Bullet>The Adopter will never strike, mistreat, punish, or otherwise harm the cat.</Bullet>

        {/* 3.4 */}
        <SubHead>3.4  Declawing Prohibition</SubHead>
        <Body>The Adopter will never declaw the cat under any circumstances.</Body>

        {/* 3.5 */}
        <SubHead>3.5  Spaying / Neutering</SubHead>
        <Bullet>A cat younger than 5 months must be spayed or neutered before their first heat cycle, by five (5) months of age.</Bullet>
        <Bullet>If the cat is not spayed or neutered prior to adoption, the Adopter must provide proof of the procedure within 30 days of completion.</Bullet>

        {/* 3.6 */}
        <SubHead>3.6  Veterinary Care</SubHead>
        <Bullet>The Adopter agrees to keep the cat's vaccinations for rabies and distemper up to date (boosted every 3 years in accordance with WSAVA recommendations).</Bullet>
        <Bullet>The Adopter will provide prompt veterinary care in case of sickness, disease, or injury.</Bullet>

        {/* 3.7 */}
        <SubHead>3.7  Visitation Rights</SubHead>
        <Body>The Original Caregiver retains the right to visit the cat at a reasonable time to ensure compliance with this Agreement.</Body>

        {/* 3.8 */}
        <SubHead>3.8  Scratching Behavior</SubHead>
        <Bullet>Scratching is a natural feline behavior. The Adopter will provide appropriate scratching outlets such as cat trees and scratching posts.</Bullet>
        <Bullet>The Adopter agrees to contact the Original Caregiver for advice on managing inappropriate scratching behavior if needed.</Bullet>

        {/* 3.9 */}
        <SubHead>3.9  Interaction with Children</SubHead>
        <Bullet>The Adopter will take particular care when allowing children to interact with the cat, recognizing that some animals may feel frightened or uncomfortable around children.</Bullet>
        <Bullet>The Adopter accepts full responsibility for any incidents that may occur involving children and the cat.</Bullet>

        {/* 3.10 */}
        <SubHead>3.10  Adjustment Period</SubHead>
        <Bullet>The Adopter will exercise patience and caution when introducing the cat to a new environment, understanding that adjustment may take weeks.</Bullet>
        <Bullet>The Original Caregiver is available to provide guidance during the transition period.</Bullet>
        <View style={s.callout}>
          <Text>
            {'If you observe any behavioral issues or have any concerns — even beyond the initial adjustment period — please '}
            <Text style={s.calloutBold}>CONTACT US IMMEDIATELY</Text>
            {' so we can address them promptly and prevent escalation.'}
          </Text>
        </View>

        {/* 3.11 */}
        <SubHead>3.11  Change of Residence</SubHead>
        <Body>The Adopter must inform the Original Caregiver before moving to a new apartment, house, city, or country.</Body>

        {/* 3.12 */}
        <SubHead>3.12  Rehoming the Cat</SubHead>
        <Bullet>If, for any reason, the Adopter can no longer care for the cat, the cat must not be surrendered to a shelter, humane society, or any third party.</Bullet>
        <Bullet>The cat must be returned to the Original Caregiver or their designated representative.</Bullet>
        <Bullet>If the Original Caregiver's contact information is no longer valid, the Adopter must make a good-faith effort to locate and notify them.</Bullet>

        {/* Pet-sitting vs Fostering */}
        <SubHead>Differentiation Between Pet-Sitting and Fostering</SubHead>
        <Body>
          Pet-sitting is a short-term arrangement with a predetermined end date. It is defined as providing a temporary caregiver when needed, ensuring the cat's well-being while the Adopter is unavailable due to vacations, business trips, or temporary absence. In such cases, the cat must not be returned to Purrfect Love, the Original Caregiver, or their representative(s). However, the Original Caregiver can be notified to ensure the cat's welfare.
        </Body>
        <Body>
          If the Adopter requires a longer-term solution such as fostering due to circumstances like illness, relocation, or other life changes, this will be considered a relinquishment of the cat and will be subject to Clause 3.12 (Rehoming the Cat).
        </Body>
        <Body>
          The fundamental understanding in adopting a cat is that the cat remains with the Adopter as a permanent companion through all life changes and circumstances.
        </Body>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 4. BREACH OF AGREEMENT                                     */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionHead>4. Breach of Agreement</SectionHead>
        <Body>
          Failure to adhere to the terms outlined in this Agreement constitutes a breach of contract. In such an event, the Adopter agrees that the Original Caregiver has the right to reclaim possession of the cat.
        </Body>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 5. EXECUTION                                               */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionHead>5. Execution of Agreement</SectionHead>

        {/* Execution line */}
        <View style={{ flexDirection: 'row', marginBottom: 20, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 10, color: DK, marginRight: 4 }}>This Agreement was executed at</Text>
          <View style={{ width: 160, borderBottomWidth: 0.75, borderBottomColor: DK, height: 16, marginRight: 4 }} />
          <Text style={{ fontSize: 10, color: DK, marginRight: 4 }}>on</Text>
          <View style={{ width: 100, borderBottomWidth: 0.75, borderBottomColor: DK, height: 16 }} />
        </View>

        {/* Signature blocks */}
        <View style={s.sigGrid}>

          {/* Original Caregiver */}
          <View style={s.sigBox}>
            <Text style={s.sigTitle}>Original Caregiver</Text>

            <View style={s.sigField}>
              <Text style={s.sigLbl}>Name</Text>
              <View style={s.sigLine} />
            </View>
            <View style={s.sigField}>
              <Text style={s.sigLbl}>Signature</Text>
              <View style={s.sigLine} />
            </View>
            <View style={s.sigField}>
              <Text style={s.sigLbl}>Date</Text>
              <View style={s.sigLine} />
            </View>
          </View>

          {/* Adopter */}
          <View style={s.sigBoxR}>
            <Text style={s.sigTitle}>Adopter</Text>

            <View style={s.sigField}>
              <Text style={s.sigLbl}>Name</Text>
              <Text style={s.sigFilled}>{applicantName}</Text>
            </View>
            <View style={s.sigField}>
              <Text style={s.sigLbl}>Passport / ID Card Number</Text>
              <View style={s.sigLine} />
            </View>
            <View style={s.sigField}>
              <Text style={s.sigLbl}>Address</Text>
              <Text style={s.sigFilled}>{applicantAddress || ' '}</Text>
            </View>
            <View style={s.sigField}>
              <Text style={s.sigLbl}>Phone</Text>
              <Text style={s.sigFilled}>{applicantPhone || ' '}</Text>
            </View>
            <View style={s.sigField}>
              <Text style={s.sigLbl}>Email</Text>
              <Text style={s.sigFilled}>{applicantEmail || ' '}</Text>
            </View>
            <View style={s.sigField}>
              <Text style={s.sigLbl}>Signature</Text>
              <View style={s.sigLine} />
            </View>
            <View style={s.sigField}>
              <Text style={s.sigLbl}>Date</Text>
              <View style={s.sigLine} />
            </View>
          </View>
        </View>

        <Footer />
      </Page>
    </Document>
  )
}
