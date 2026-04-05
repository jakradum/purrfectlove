import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const G = '#2C5F4F'
const B = '#C85C3F'
const CR = '#F6F4F0'
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

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  logo: { width: 90, height: 90, objectFit: 'contain' },
  contactBlock: { alignItems: 'flex-end', paddingTop: 8 },
  contactRow: { flexDirection: 'row', marginBottom: 4 },
  contactLabel: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: DK },
  contactVal: { fontSize: 9.5, color: B, marginLeft: 4 },

  docTitle: {
    fontFamily: 'Helvetica-Bold', fontSize: 18, color: DK,
    textAlign: 'center', letterSpacing: 0.5,
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1.5, borderBottomColor: DK,
  },

  preamble: { fontSize: 10, lineHeight: 1.8, color: DK, marginBottom: 20 },
  preambleHL: { fontFamily: 'Helvetica-Bold' },

  sectionHead: {
    fontFamily: 'Helvetica-Bold', fontSize: 11, color: DK,
    textTransform: 'uppercase', letterSpacing: 0.3,
    paddingBottom: 4,
    borderBottomWidth: 1, borderBottomColor: DK,
    marginTop: 18, marginBottom: 10,
  },

  subHead: {
    fontFamily: 'Helvetica-Bold', fontSize: 10, color: DK,
    marginTop: 10, marginBottom: 4,
  },

  body: { fontSize: 10, lineHeight: 1.7, color: '#333', marginBottom: 5 },

  bulletRow: { flexDirection: 'row', marginBottom: 5, paddingLeft: 6 },
  bulletDot: { width: 14, fontSize: 10.5, color: B, marginTop: 0.5 },
  bulletText: { flex: 1, fontSize: 10, lineHeight: 1.65, color: '#333' },

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
    flex: 1, height: 54,
    borderBottomWidth: 0.75, borderBottomColor: DK,
  },

  sigGrid: { flexDirection: 'row', marginTop: 14 },
  sigBox: { flex: 1 },
  sigBoxR: { flex: 1, marginLeft: 36 },
  sigTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: G, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.3 },
  sigField: { marginBottom: 13 },
  sigLbl: { fontSize: 8.5, color: MT, marginBottom: 3 },
  sigLine: { borderBottomWidth: 0.75, borderBottomColor: DK, height: 18 },
  sigFilled: { borderBottomWidth: 0.75, borderBottomColor: DK, paddingBottom: 2, fontSize: 10, fontFamily: 'Helvetica-Bold', color: DK },

  footer: {
    position: 'absolute', bottom: 26, left: 50, right: 50,
    textAlign: 'center', fontSize: 7.5, color: '#AAAAAA',
    borderTopWidth: 0.5, borderTopColor: RU, paddingTop: 7,
  },
})

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
      Purrfect Love e.V. · Heusteigstrasse 99, 70180 Stuttgart · support@purrfectlove.org · www.purrfectlove.org
    </Text>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AdoptionContractPDF_DE({
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
  const genderLabel = catGender ? (catGender === 'male' ? 'Maennlich' : 'Weiblich') : null

  return (
    <Document title={`Adoptionsvereinbarung - ${catName}`} author="Purrfect Love e.V.">
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
        <Text style={s.docTitle}>ADOPTIONSVEREINBARUNG</Text>

        {/* ── PREAMBLE ───────────────────────────────────────────────── */}
        <Text style={s.preamble}>
          {'Diese Adoptionsvereinbarung ("Vereinbarung") wird am ___ Tag des Monats ________ 20__ zwischen '}
          <Text style={s.preambleHL}>Purrfect Love e.V.</Text>
          {', vertreten durch ________________________ (im Folgenden "urspruengliche Pflegeperson") und '}
          <Text style={s.preambleHL}>{applicantName}</Text>
          {' (im Folgenden "Adoptierende*r") geschlossen.'}
        </Text>

        {/* 1 */}
        <SectionHead>1. Zweck</SectionHead>
        <Body>
          Diese Vereinbarung legt die Verantwortlichkeiten und Verpflichtungen der adoptierenden Person fest, eine sichere und geeignete Umgebung fuer die adoptierte Katze bereitzustellen. Die adoptierende Person verpflichtet sich, die nachstehenden Bedingungen einzuhalten, um das Wohlbefinden und die Sicherheit der Katze zu gewaehrleisten.
        </Body>

        {/* 2 */}
        <SectionHead>2. Identifikation der Katze</SectionHead>
        <Body>Die adoptierte Katze ist wie folgt identifiziert:</Body>

        <FieldRow label="Name:" value={catName} />
        <FieldRow label="Rasse:" />
        <FieldRow label="Farbe / Zeichnung:" />
        <FieldRow label="Alter / Geburtsdatum:" value={catAge} />
        <FieldRow label="Mikrochip-Nummer (falls vorhanden):" />
        <FieldRow label="Geschlecht:" value={genderLabel} />
        <FieldRow label="Sterilisiert / Kastriert (Ja/Nein):" />

        {/* 3 */}
        <SectionHead>3. Gesundheitszustand</SectionHead>
        <Body>Der Gesundheitszustand der Katze zum Zeitpunkt der Adoption:</Body>

        <FieldRow label="Impfstatus:" />
        <FieldRow label="Letzte tieraerztliche Untersuchung:" />
        <FieldRow label="Bekannte Krankheiten / Besonderheiten:" multiLine />

        <Body>
          Die adoptierende Person bestaetigt, ueber den bekannten Gesundheitszustand informiert worden zu sein.
        </Body>

        {/* 4 */}
        <SectionHead>4. Eigentumsübertragung</SectionHead>
        <Body>Mit der Ubergabe der Katze geht das Eigentum an der Katze auf die adoptierende Person uber.</Body>

        {/* 5 */}
        <SectionHead>5. Adoptionsbedingungen</SectionHead>
        <Body>Die adoptierende Person erklart sich mit den folgenden Bedingungen einverstanden:</Body>

        <SubHead>5.1 Wohnumgebung – Hygiene und Raumluft</SubHead>
        <Bullet>Die Katze wird als Haustier in einer privaten Wohnung gehalten (ausschliesslich Indoor, kein Freigang).</Bullet>
        <Bullet>Fenster und Balkone mussen vor Ankunft der Katze mit stabilem Katzennetz oder -gitter gesichert sein.</Bullet>
        <Bullet>Der Adoptierende verpflichtet sich, die Wohnung regelmaessig grundlich zu reinigen sowie samtliche Oberflachen sauber zu halten und die Raumlichkeiten mehrmals taglich ausreichend zu luften. Dies dient insbesondere der Vorbeugung von gesundheitlichen Problemen beim Tier, wie allergischen Reaktionen, Hauterkrankungen sowie Atemwegserkrankungen. In Innenraumen konnen sich Staub, Allergene (z. B. Hausstaubmilben, Schimmelsporen, Hautschuppen) und Schadstoffe deutlich starker anreichern als im Freien. Eine unzureichende Reinigung und Beluftung konnen die Ansammlung solcher Stoffe begunstigen und damit das Risiko fur Erkrankungen beim Tier erhohen.</Bullet>
        <Bullet>Der Adoptierende tragt daher die Verantwortung, durch geeignete Hygienemassnahmen und regelmaessigen Luftaustausch eine gesunde Umgebung fur das Tier sicherzustellen.</Bullet>

        <SubHead>5.2 Ernahrung</SubHead>
        <Bullet>Die Katze erhalt taglich ausreichend hochwertiges Nass- und Trockenfutter sowie frisches Wasser.</Bullet>
        <Bullet>Als obligate Karnivoren benotigen Katzen tierisches Eiweiss und Fett.</Bullet>
        <Bullet>Reis sowie Kuhmilch, wie sie fur den menschlichen Verzehr bestimmt ist (also handelsubliche Milch fur Menschen), sind fur Tiere nicht geeignet, da sie unvetraglich sein und gesundheitliche Probleme verursachen konnen. Daher sollten sie nicht verfuttert werden.</Bullet>

        <SubHead>5.3 Umgang & Verhalten</SubHead>
        <Bullet>Die adoptierende Person spricht ruhig und sanft mit der Katze.</Bullet>
        <Bullet>Gewalt, Misshandlung oder sonstiger Schaden sind strikt untersagt. Dazu zahlen insbesondere korperliche Bestrafungen sowie das Anschreien oder Bestrafen des Tieres, ebenso wie das Reiben des Katzengesichts in Urin oder Kot, falls die Katze ausserhalb der Katzentoilette uriniert.</Bullet>

        <SubHead>5.4 Klauenentfernung</SubHead>
        <Body>Das Entfernen der Krallen ("Declawing") ist unter keinen Umstanden erlaubt.</Body>

        <SubHead>5.5 Kastration / Sterilisation</SubHead>
        <Bullet>Die junge Katze muss spatestens im Alter von sechs (6) Monaten kastriert/sterilisiert werden.</Bullet>
        <Bullet>Falls dies zum Zeitpunkt der Adoption noch nicht erfolgt ist, ist ein Nachweis binnen 30 Tagen nachzureichen.</Bullet>

        <SubHead>5.6 Tierarztliche Versorgung</SubHead>
        <Bullet>Bei Krankheit oder Verletzung ist umgehend ein Tierarzt aufzusuchen.</Bullet>

        <SubHead>5.7 Besuchsrecht</SubHead>
        <Body>Die ursprungliche Pflegeperson behalt sich das Recht vor, die Katze nach vorheriger Absprache zu besuchen, um die Einhaltung dieser Vereinbarung zu prufen.</Body>

        <SubHead>5.8 Kratzverhalten</SubHead>
        <Bullet>Die Katze erhalt geeignete Kratzmoglichkeiten (Kratzbaum, -brett etc.).</Bullet>
        <Bullet>Bei Problemen steht die ursprungliche Pflegeperson beratend zur Seite.</Bullet>

        <SubHead>5.9 Umgang mit Kindern</SubHead>
        <Bullet>Die adoptierende Person uberwacht alle Interaktionen mit Kindern sorgfaltig und ubernimmt volle Verantwortung fur etwaige Vorfalle.</Bullet>

        <SubHead>5.10 Eingewohnungsphase</SubHead>
        <Bullet>Die adoptierende Person bringt Geduld fur die Eingewohnung auf. Diese kann mehrere Wochen dauern.</Bullet>
        <Bullet>Bei Verhaltensauffalligkeiten oder Unsicherheiten ist die ursprungliche Pflegeperson unverzuglich zu kontaktieren.</Bullet>

        <SubHead>5.11 Wohnortwechsel</SubHead>
        <Bullet>Wohnsitzwechsel (Wohnung, Stadt, Land) sind der ursprunglichen Pflegeperson mitzuteilen.</Bullet>

        <SubHead>5.12 Weitergabe der Katze</SubHead>
        <Bullet>Die Katze darf nicht an Tierheime, Dritte oder Organisationen abgegeben werden.</Bullet>
        <Bullet>Sie ist ausschliesslich an die ursprungliche Pflegeperson oder eine von ihr benannte Person zuruckzugeben.</Bullet>
        <Bullet>Sollte die Kontaktaufnahme scheitern, ist eine nachweislich ernsthafte Bemuohung zur Kontaktaufnahme erforderlich.</Bullet>

        <SubHead>5.13 Unterscheidung zwischen kurzfristiger Tierbetreuung und langfristiger Pflege</SubHead>
        <Bullet>Tierbetreuung bezeichnet die kurzfristige Versorgung der Katze wahrend einer vorubergehenden Abwesenheit der adoptierenden Person (z. B. Urlaub, Krankheit, Geschaftsreise). In solchen Fallen liegt es in der Verantwortung der adoptierenden Person, eine geeignete Betreuungslosung (z. B. Catsitting oder Pflegestelle) eigensandig zu organisieren.</Bullet>
        <Bullet>Langfristiger Pflegebedarf, der sich z. B. aus einer dauerhaften Veranderung der Lebensumstande (z. B. Wegzug ins Ausland oder gesundheitliche Einschrankungen der adoptierenden Person) ergibt, wird als Ruckgabe der Katze gemass Klausel 5.12 behandelt. In diesem Fall ist die Katze verpflichtend an die ursprungliche Pflegeperson zuruckzugeben. Eine anderweitige Weitergabe ist nicht gestattet.</Bullet>

        <SubHead>5.14 Haftungsausschluss fur spatere Tierarztkosten</SubHead>
        <Bullet>Nach der Adoption ubernimmt die ursprungliche Pflegeperson keine Verantwortung fur tierarztliche Kosten, selbst wenn eine Vorerkrankung bereits vor der Adoption bestanden haben konnte.</Bullet>

        <SubHead>5.15 Mikrochip & Registrierung</SubHead>
        <Bullet>Falls ein Mikrochip vorhanden ist, verpflichtet sich die adoptierende Person, die Katze bei einem Haustierregister zu registrieren und die Daten aktuell zu halten.</Bullet>

        {/* 6 */}
        <SectionHead>6. Haftung</SectionHead>
        <Bullet>Mit der Ubergabe der Katze geht die volle Verantwortung auf die adoptierende Person uber.</Bullet>
        <Bullet>Die adoptierende Person haftet fur alle Schaden, die durch die Katze verursacht werden.</Bullet>
        <Bullet>Der Abschluss einer Tierhalterhaftpflichtversicherung wird empfohlen.</Bullet>

        {/* 7 */}
        <SectionHead>7. Verstoss gegen die Vereinbarung</SectionHead>
        <Body>
          Ein Verstoss gegen diese Bedingungen gilt als Vertragsbruch. In diesem Fall behalt sich die ursprungliche Pflegeperson das Recht vor, die Katze zuruckzufordern.
        </Body>

        {/* 8 */}
        <SectionHead>8. Unentgeltlichkeit der Adoption</SectionHead>
        <Body>
          Die Adoption der Katze erfolgte unentgeltlich; es fand keine finanzielle Gegenleistung oder sonstige monetare Transaktion zwischen der adoptierenden Person und der ursprunglichen Pflegeperson statt.
        </Body>

        {/* 9 */}
        <SectionHead>9. Datenschutz</SectionHead>
        <Body>
          Die erhobenen personenbezogenen Daten werden ausschliesslich im Rahmen dieser Vereinbarung verwendet und nicht an Dritte weitergegeben.
        </Body>

        {/* 10 */}
        <SectionHead>10. Salvatorische Klausel</SectionHead>
        <Body>
          Sollte eine Bestimmung dieser Vereinbarung unwirksam sein, bleibt die Wirksamkeit der ubrigen Bestimmungen unberuhrt.
        </Body>

        {/* 11 */}
        <SectionHead>11. Unterzeichnung der Vereinbarung</SectionHead>

        <View style={{ flexDirection: 'row', marginBottom: 20, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 10, color: DK, marginRight: 4 }}>Diese Vereinbarung wurde abgeschlossen in</Text>
          <View style={{ width: 100, borderBottomWidth: 0.75, borderBottomColor: DK, height: 16, marginRight: 4 }} />
          <Text style={{ fontSize: 10, color: DK, marginRight: 4 }}>am</Text>
          <View style={{ width: 100, borderBottomWidth: 0.75, borderBottomColor: DK, height: 16 }} />
        </View>

        <View style={s.sigGrid}>
          {/* Ursprungliche Pflegeperson */}
          <View style={s.sigBox}>
            <Text style={s.sigTitle}>Urspr. Pflegeperson</Text>
            <View style={s.sigField}>
              <Text style={s.sigLbl}>Name</Text>
              <View style={s.sigLine} />
            </View>
            <View style={s.sigField}>
              <Text style={s.sigLbl}>Unterschrift</Text>
              <View style={s.sigLine} />
            </View>
            <View style={s.sigField}>
              <Text style={s.sigLbl}>Datum</Text>
              <View style={s.sigLine} />
            </View>
          </View>

          {/* Adoptierende Person */}
          <View style={s.sigBoxR}>
            <Text style={s.sigTitle}>Adoptierende Person</Text>
            <View style={s.sigField}>
              <Text style={s.sigLbl}>Name</Text>
              <Text style={s.sigFilled}>{applicantName}</Text>
            </View>
            <View style={s.sigField}>
              <Text style={s.sigLbl}>Ausweisnummer</Text>
              <View style={s.sigLine} />
            </View>
            <View style={s.sigField}>
              <Text style={s.sigLbl}>Adresse</Text>
              <Text style={s.sigFilled}>{applicantAddress || ' '}</Text>
            </View>
            <View style={s.sigField}>
              <Text style={s.sigLbl}>Telefon</Text>
              <Text style={s.sigFilled}>{applicantPhone || ' '}</Text>
            </View>
            <View style={s.sigField}>
              <Text style={s.sigLbl}>E-Mail</Text>
              <Text style={s.sigFilled}>{applicantEmail || ' '}</Text>
            </View>
            <View style={s.sigField}>
              <Text style={s.sigLbl}>Unterschrift</Text>
              <View style={s.sigLine} />
            </View>
            <View style={s.sigField}>
              <Text style={s.sigLbl}>Datum</Text>
              <View style={s.sigLine} />
            </View>
          </View>
        </View>

        <Footer />
      </Page>
    </Document>
  )
}
