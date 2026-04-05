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

  // ── TITLE ───────────────────────────────────────────────
  docTitle: {
    fontFamily: 'Helvetica-Bold', fontSize: 18, color: DK,
    textAlign: 'center', letterSpacing: 0.5,
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1.5, borderBottomColor: DK,
  },

  // ── PREAMBLE ────────────────────────────────────────────
  preamble: { fontSize: 10, lineHeight: 1.8, color: DK, marginBottom: 20 },
  preambleHL: { fontFamily: 'Helvetica-Bold' },

  // ── SECTION HEADER ──────────────────────────────────────
  sectionHead: {
    fontFamily: 'Helvetica-Bold', fontSize: 11, color: DK,
    textTransform: 'uppercase', letterSpacing: 0.3,
    paddingBottom: 4,
    borderBottomWidth: 1, borderBottomColor: DK,
    marginTop: 18, marginBottom: 10,
  },

  // ── SUB-SECTION HEADER ──────────────────────────────────
  subHead: {
    fontFamily: 'Helvetica-Bold', fontSize: 10, color: DK,
    marginTop: 10, marginBottom: 4,
  },

  // ── BODY TEXT ───────────────────────────────────────────
  body: { fontSize: 10, lineHeight: 1.7, color: '#333', marginBottom: 5 },

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
  fieldMultiLine: {
    flex: 1, height: 36,
    borderBottomWidth: 0.75, borderBottomColor: DK,
    marginBottom: 0,
  },

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
})

// ── Helpers ────────────────────────────────────────────────────────────────────

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
function FieldRow({ label, value, multiLine }) {
  return (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>{label}</Text>
      {value
        ? <Text style={s.fieldFilled}>{value}</Text>
        : <View style={multiLine ? s.fieldMultiLine : s.fieldBlank} />}
    </View>
  )
}
function Footer() {
  return (
    <Text style={s.footer} fixed>
      Purrfect Love e.V. · Heusteigstraße 99, 70180 Stuttgart · support@purrfectlove.org · www.purrfectlove.org
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

        {/* ── TITLE ──────────────────────────────────────────────────── */}
        <Text style={s.docTitle}>ADOPTION AGREEMENT</Text>

        {/* ── PREAMBLE ───────────────────────────────────────────────── */}
        <Text style={s.preamble}>
          {'This Adoption Agreement ("Agreement") is entered into on the ___ day of ________ 20__, between '}
          <Text style={s.preambleHL}>Purrfect Love e.V.</Text>
          {', represented by ________________________ (hereinafter referred to as the "Original Caregiver"), and '}
          <Text style={s.preambleHL}>{applicantName}</Text>
          {' (hereinafter referred to as the "Adopter").'}
        </Text>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 1. PURPOSE                                                  */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionHead>1. Purpose</SectionHead>
        <Body>
          This Agreement sets forth the responsibilities and obligations of the adopting person to provide a safe and suitable environment for the adopted cat. The adopting person agrees to comply with the following conditions in order to ensure the cat's well-being and safety.
        </Body>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 2. IDENTIFICATION OF THE CAT                               */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionHead>2. Identification of the Cat</SectionHead>
        <Body>The adopted cat is identified as follows:</Body>

        <FieldRow label="Name:" value={catName} />
        <FieldRow label="Breed:" />
        <FieldRow label="Color / Markings:" />
        <FieldRow label="Age / Date of Birth:" value={catAge} />
        <FieldRow label="Microchip Number (if available):" />
        <FieldRow label="Sex:" value={genderLabel} />
        <FieldRow label="Spayed / Neutered (Yes/No):" />

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 3. HEALTH CONDITION                                         */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionHead>3. Health Condition</SectionHead>
        <Body>The health condition of the cat at the time of adoption:</Body>

        <FieldRow label="Vaccination status:" />
        <FieldRow label="Last veterinary examination:" />
        <FieldRow label="Known illnesses / special conditions:" multiLine />

        <Body>
          The adopting person confirms that they have been informed about the known health condition of the cat.
        </Body>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 4. TRANSFER OF OWNERSHIP                                   */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionHead>4. Transfer of Ownership</SectionHead>
        <Body>Ownership of the cat is transferred to the adopting person upon handover.</Body>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 5. ADOPTION CONDITIONS                                      */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionHead>5. Adoption Conditions</SectionHead>
        <Body>The adopting person agrees to the following conditions:</Body>

        <SubHead>5.1 Living Environment – Hygiene and Air Quality</SubHead>
        <Bullet>The cat shall be kept as a pet in a private apartment (strictly indoor, no outdoor access).</Bullet>
        <Bullet>Windows and balconies must be secured with stable cat netting or protective barriers before the cat's arrival.</Bullet>
        <Bullet>The adopting person undertakes to regularly clean the apartment thoroughly, keep all surfaces clean, and ventilate the premises sufficiently several times a day. This is particularly intended to prevent health issues in the animal such as allergic reactions, skin diseases, and respiratory illnesses. In indoor environments, dust, allergens (e.g. dust mites, mold spores, skin flakes), and pollutants can accumulate significantly more than outdoors. Insufficient cleaning and ventilation may promote the accumulation of such substances and thereby increase the risk of illness in the animal.</Bullet>
        <Bullet>The adopting person is therefore responsible for ensuring a healthy environment for the animal through appropriate hygiene measures and regular air exchange.</Bullet>

        <SubHead>5.2 Nutrition</SubHead>
        <Bullet>The cat shall receive sufficient high-quality wet and dry food daily, as well as fresh water.</Bullet>
        <Bullet>As obligate carnivores, cats require animal protein and fat.</Bullet>
        <Bullet>Rice and cow's milk intended for human consumption (i.e. standard commercial milk) are not suitable for animals, as they may be poorly tolerated and cause health problems. Therefore, they should not be fed.</Bullet>

        <SubHead>5.3 Handling & Behavior</SubHead>
        <Bullet>The adopting person shall speak calmly and gently to the cat.</Bullet>
        <Bullet>Violence, abuse, or any form of harm is strictly prohibited. This includes, in particular, physical punishment, shouting at or punishing the animal, as well as rubbing the cat's face in urine or feces if the cat urinates outside the litter box.</Bullet>

        <SubHead>5.4 Declawing</SubHead>
        <Body>Declawing is strictly prohibited under all circumstances.</Body>

        <SubHead>5.5 Spaying / Neutering</SubHead>
        <Bullet>The young cat must be spayed/neutered no later than six (6) months of age.</Bullet>
        <Bullet>If this has not yet been done at the time of adoption, proof must be provided within 30 days.</Bullet>

        <SubHead>5.6 Veterinary Care</SubHead>
        <Bullet>In case of illness or injury, a veterinarian must be consulted immediately.</Bullet>

        <SubHead>5.7 Right of Visit</SubHead>
        <Body>The original caregiver reserves the right to visit the cat upon prior agreement in order to verify compliance with this Agreement.</Body>

        <SubHead>5.8 Scratching Behavior</SubHead>
        <Bullet>The cat must be provided with appropriate scratching options (scratching post, board, etc.).</Bullet>
        <Bullet>In case of problems, the original caregiver will provide advice.</Bullet>

        <SubHead>5.9 Interaction with Children</SubHead>
        <Bullet>The adopting person shall carefully supervise all interactions with children and assumes full responsibility for any incidents.</Bullet>

        <SubHead>5.10 Adjustment Period</SubHead>
        <Bullet>The adopting person must show patience during the adjustment period, which may take several weeks.</Bullet>
        <Bullet>In case of behavioral issues or uncertainties, the original caregiver must be contacted immediately.</Bullet>

        <SubHead>5.11 Change of Residence</SubHead>
        <Bullet>Any change of residence (apartment, city, country) must be communicated to the original caregiver.</Bullet>

        <SubHead>5.12 Transfer of the Cat</SubHead>
        <Bullet>The cat may not be surrendered to shelters, third parties, or organizations.</Bullet>
        <Bullet>The cat must be returned exclusively to the original caregiver or a person designated by them.</Bullet>
        <Bullet>If contact cannot be established, a demonstrably serious effort to make contact is required.</Bullet>

        <SubHead>5.13 Distinction Between Short-Term Pet Care and Long-Term Care</SubHead>
        <Bullet>Pet care refers to the temporary care of the cat during a short-term absence of the adopting person (e.g. vacation, illness, business trip). In such cases, it is the responsibility of the adopting person to independently arrange a suitable care solution (e.g. cat sitter or foster care).</Bullet>
        <Bullet>Long-term care needs resulting from permanent life changes (e.g. relocation abroad or health limitations of the adopting person) are considered a return of the cat in accordance with Clause 5.12. In such cases, the cat must be returned to the original caregiver. Any other transfer is not permitted.</Bullet>

        <SubHead>5.14 Disclaimer for Future Veterinary Costs</SubHead>
        <Bullet>After adoption, the original caregiver assumes no responsibility for veterinary costs, even if a pre-existing condition may have existed prior to adoption.</Bullet>

        <SubHead>5.15 Microchip & Registration</SubHead>
        <Bullet>If a microchip is present, the adopting person undertakes to register the cat in a pet registry and keep the data up to date.</Bullet>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 6. LIABILITY                                                */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionHead>6. Liability</SectionHead>
        <Bullet>Upon handover, full responsibility for the cat passes to the adopting person.</Bullet>
        <Bullet>The adopting person is liable for any damage caused by the cat.</Bullet>
        <Bullet>It is recommended to take out pet liability insurance.</Bullet>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 7. BREACH OF AGREEMENT                                     */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionHead>7. Breach of Agreement</SectionHead>
        <Body>
          Any violation of these conditions shall be considered a breach of contract. In such a case, the original caregiver reserves the right to reclaim the cat.
        </Body>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 8. NON-REMUNERATIVE ADOPTION                               */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionHead>8. Non-Remunerative Adoption</SectionHead>
        <Body>
          The adoption of the cat is free of charge; no financial compensation or other monetary transaction has taken place between the adopting person and the original caregiver.
        </Body>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 9. DATA PROTECTION                                         */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionHead>9. Data Protection</SectionHead>
        <Body>
          The collected personal data shall be used exclusively within the framework of this Agreement and will not be shared with third parties.
        </Body>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 10. SEVERABILITY CLAUSE                                    */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionHead>10. Severability Clause</SectionHead>
        <Body>
          Should any provision of this Agreement be invalid, the validity of the remaining provisions shall remain unaffected.
        </Body>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 11. SIGNATURE                                              */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionHead>11. Signature of the Agreement</SectionHead>

        <View style={{ flexDirection: 'row', marginBottom: 20, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 10, color: DK, marginRight: 4 }}>This Agreement was concluded in</Text>
          <View style={{ width: 130, borderBottomWidth: 0.75, borderBottomColor: DK, height: 16, marginRight: 4 }} />
          <Text style={{ fontSize: 10, color: DK, marginRight: 4 }}>on</Text>
          <View style={{ width: 100, borderBottomWidth: 0.75, borderBottomColor: DK, height: 16 }} />
        </View>

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
            <Text style={s.sigTitle}>Adopting Person</Text>
            <View style={s.sigField}>
              <Text style={s.sigLbl}>Name</Text>
              <Text style={s.sigFilled}>{applicantName}</Text>
            </View>
            <View style={s.sigField}>
              <Text style={s.sigLbl}>ID Number</Text>
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
