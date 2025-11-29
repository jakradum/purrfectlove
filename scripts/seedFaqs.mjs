// scripts/seedFaqs.mjs
// Run with: node scripts/seedFaqs.mjs

import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, // Need a write token
  useCdn: false,
});

const faqs = [
  // ============ ADOPTION PROCESS ============
  {
    questionEn: 'How long does the adoption process take?',
    answerEn: 'It usually takes us up to 8 weeks from the time we receive your application. This is because we have a process that ensures the best both for you and the cat; and this is effort-intensive. If you don\'t hear back from us even after a few weeks, get in touch with us at support@purrfectlove.org and cite your application number.',
    questionDe: 'Wie lange dauert der Adoptionsprozess?',
    answerDe: 'Es dauert in der Regel bis zu 8 Wochen ab dem Zeitpunkt, an dem wir Ihre Bewerbung erhalten. Das liegt daran, dass wir einen Prozess haben, der das Beste sowohl für Sie als auch für die Katze sicherstellt; und dieser ist aufwendig. Wenn Sie auch nach einigen Wochen nichts von uns hören, kontaktieren Sie uns unter support@purrfectlove.org und nennen Sie Ihre Antragsnummer.',
    category: 'process',
    order: 1,
  },
  {
    questionEn: 'What happens after I submit an application?',
    answerEn: 'You will receive an email with an application number that helps us track your application. Our team evaluates the inputs given by you on the form you submit, and then one of us will get in touch with you for a short call. You can read all about our adoption process on purrfectlove.org/guides/process',
    questionDe: 'Was passiert, nachdem ich eine Bewerbung eingereicht habe?',
    answerDe: 'Sie erhalten eine E-Mail mit einer Antragsnummer, die uns hilft, Ihre Bewerbung zu verfolgen. Unser Team bewertet die Angaben, die Sie im Formular gemacht haben, und dann wird sich einer von uns für ein kurzes Gespräch mit Ihnen in Verbindung setzen. Alles über unseren Adoptionsprozess können Sie auf purrfectlove.org/guides/process nachlesen.',
    category: 'process',
    order: 2,
  },
  {
    questionEn: 'Why do you do home visits?',
    answerEn: 'We believe the home is a safe space for your cat. It is meant to offer physical and psychological safety apart from being the home that you and your cat will share for many years. Cats have a natural instinct to explore their surroundings, and are tempted to run out from open windows, balconies or doors when they can; often leading to tragic consequences such as being lost, or killed. Our home visits ensure that your home is ready for your incoming cat - both by cat-proofing and by way of ensuring safe spaces and comfortable spots that result in you and your cat(s) living together peacefully.',
    questionDe: 'Warum führen Sie Hausbesuche durch?',
    answerDe: 'Wir glauben, dass das Zuhause ein sicherer Ort für Ihre Katze sein sollte. Es soll physische und psychologische Sicherheit bieten und gleichzeitig das Zuhause sein, das Sie und Ihre Katze viele Jahre lang teilen werden. Katzen haben einen natürlichen Instinkt, ihre Umgebung zu erkunden, und sind versucht, durch offene Fenster, Balkone oder Türen hinauszulaufen; was oft zu tragischen Folgen wie Verlust oder Tod führt. Unsere Hausbesuche stellen sicher, dass Ihr Zuhause bereit ist für Ihre neue Katze - sowohl durch Katzensicherung als auch durch sichere Räume und bequeme Plätze, die ein friedliches Zusammenleben ermöglichen.',
    category: 'process',
    order: 3,
  },
  {
    questionEn: 'Can I meet the cat before deciding?',
    answerEn: 'Yes, but since this can sometimes be logistically intensive, we do not mandate this. Meeting a cat is a great idea to see if you might "get along", but that said, cats are very unlike dogs in that they do not take to humans instantly. They have their own way of warming up to new people that often takes some time and effort. So, don\'t expect your meeting with the cat to always be very memorable. Sometimes you just cannot tell much from such meetings. We urge you to trust us and trust the process; it\'s worked for us and will work for you.',
    questionDe: 'Kann ich die Katze vor der Entscheidung treffen?',
    answerDe: 'Ja, aber da dies manchmal logistisch aufwendig sein kann, schreiben wir es nicht vor. Ein Treffen mit einer Katze ist eine gute Idee, um zu sehen, ob Sie sich "verstehen" könnten, aber Katzen sind sehr anders als Hunde, da sie nicht sofort Vertrauen zu Menschen fassen. Sie haben ihre eigene Art, sich an neue Menschen zu gewöhnen, was oft Zeit und Mühe erfordert. Erwarten Sie also nicht, dass Ihr Treffen mit der Katze immer sehr einprägsam ist. Manchmal kann man aus solchen Treffen nicht viel ableiten. Wir bitten Sie, uns und dem Prozess zu vertrauen; es hat für uns funktioniert und wird auch für Sie funktionieren.',
    category: 'process',
    order: 4,
  },

  // ============ REQUIREMENTS ============
  {
    questionEn: 'What are the basic requirements to adopt?',
    answerEn: 'Quite simply put, you just have to \'want\' the cat. For the most part, this is enough. Apart from the desire to adopt, you should have a home that is cat-proofed and cat friendly, adhere to the dietary requirements, and be willing to make a few adjustments (at least at the beginning).',
    questionDe: 'Was sind die grundlegenden Voraussetzungen für eine Adoption?',
    answerDe: 'Ganz einfach gesagt, Sie müssen die Katze einfach "wollen". In den meisten Fällen reicht das aus. Neben dem Wunsch zu adoptieren, sollten Sie ein katzensicheres und katzenfreundliches Zuhause haben, die Ernährungsanforderungen einhalten und bereit sein, einige Anpassungen vorzunehmen (zumindest am Anfang).',
    category: 'requirements',
    order: 1,
  },
  {
    questionEn: 'Can I adopt if I\'m renting?',
    answerEn: 'Yes, most of our adopters are not home owners. Unless your homeowner has a problem with having pets, there should be no concern. If you have balconies or a home in the ground floor with windows that open into the outside, you will need to have safety nets installed; for this you might need to inform your homeowner since this will involve drilling a few nails. In general, other than any minor alterations to your apartment, you will not need to worry about renting coming in the way of having a cat.',
    questionDe: 'Kann ich adoptieren, wenn ich zur Miete wohne?',
    answerDe: 'Ja, die meisten unserer Adoptanten sind keine Hauseigentümer. Solange Ihr Vermieter kein Problem mit Haustieren hat, sollte es keine Bedenken geben. Wenn Sie Balkone haben oder im Erdgeschoss wohnen mit Fenstern, die nach außen öffnen, müssen Sie Sicherheitsnetze installieren lassen; dafür müssen Sie möglicherweise Ihren Vermieter informieren, da dies einige Bohrlöcher erfordert. Im Allgemeinen müssen Sie sich, abgesehen von kleineren Änderungen an Ihrer Wohnung, keine Sorgen machen, dass das Mieten dem Besitz einer Katze im Wege steht.',
    category: 'requirements',
    order: 2,
  },
  {
    questionEn: 'Can I adopt if I have other pets?',
    answerEn: 'Yes, and no. Because this depends on your other pet. If you already have another cat, it is often simple to get a new cat. But if you have a dog, especially an aggressive or temperamental one, it is not advisable to get a cat. You can read more about this in our blog.',
    questionDe: 'Kann ich adoptieren, wenn ich andere Haustiere habe?',
    answerDe: 'Ja und nein. Denn das hängt von Ihrem anderen Haustier ab. Wenn Sie bereits eine andere Katze haben, ist es oft einfach, eine neue Katze zu bekommen. Aber wenn Sie einen Hund haben, insbesondere einen aggressiven oder temperamentvollen, ist es nicht ratsam, eine Katze zu bekommen. Mehr dazu können Sie in unserem Blog lesen.',
    category: 'requirements',
    order: 3,
  },

  // ============ COSTS & FEES ============
  {
    questionEn: 'Is there an adoption fee?',
    answerEn: 'Absolutely none! We believe that cats (and even dogs for that matter) are not commodities for sale. We strongly discourage paying money for pets. So there are absolutely no fees involved with adoption; not even "token amounts" or "visitation fees" or any such. We are a group of volunteers and we love what we do because we love our cats.',
    questionDe: 'Gibt es eine Adoptionsgebühr?',
    answerDe: 'Absolut keine! Wir glauben, dass Katzen (und auch Hunde) keine Waren zum Verkauf sind. Wir raten dringend davon ab, Geld für Haustiere zu bezahlen. Es fallen also absolut keine Gebühren für die Adoption an; nicht einmal "symbolische Beträge" oder "Besuchsgebühren" oder Ähnliches. Wir sind eine Gruppe von Freiwilligen und wir lieben, was wir tun, weil wir unsere Katzen lieben.',
    category: 'fees',
    order: 1,
  },
  {
    questionEn: 'What costs should I expect as a new cat owner?',
    answerEn: 'Broadly, food costs (see the list of brands we recommend), litter (this includes litter sand or pine wood costs, tray cost), a cat carrier (for vet visits and travel), and other veterinary costs such as annual health checkups.',
    questionDe: 'Welche Kosten sollte ich als neuer Katzenbesitzer erwarten?',
    answerDe: 'Im Großen und Ganzen: Futterkosten (siehe die Liste der von uns empfohlenen Marken), Streu (dazu gehören Kosten für Katzenstreu oder Holzpellets, Kosten für die Katzentoilette), eine Transportbox (für Tierarztbesuche und Reisen) und andere Tierarztkosten wie jährliche Gesundheitsuntersuchungen.',
    category: 'fees',
    order: 2,
  },

  // ============ THE CATS ============
  {
    questionEn: 'Are the cats vaccinated/neutered/spayed?',
    answerEn: 'Yes, all our cats are vaccinated, and neutered or spayed.',
    questionDe: 'Sind die Katzen geimpft/kastriert/sterilisiert?',
    answerDe: 'Ja, alle unsere Katzen sind geimpft und kastriert oder sterilisiert.',
    category: 'cats',
    order: 1,
  },
  {
    questionEn: 'Where do your cats come from?',
    answerEn: 'Most or all of our cats are rescued by volunteers or by people outside our volunteer group.',
    questionDe: 'Woher kommen Ihre Katzen?',
    answerDe: 'Die meisten oder alle unsere Katzen werden von Freiwilligen oder von Personen außerhalb unserer Freiwilligengruppe gerettet.',
    category: 'cats',
    order: 2,
  },
  {
    questionEn: 'Can I adopt a specific breed?',
    answerEn: 'No. We have no "breeds". All cats on Purrfect Love are \'community cats\', or indigenous breed cats (also called indie). These are the kinds of cats you might see on the streets, in your neighbourhood, etc. They are as nature made them, without controlled breeding; they have great genetic diversity, natural disease resistance, and immunity; they look great and are extremely loving.',
    questionDe: 'Kann ich eine bestimmte Rasse adoptieren?',
    answerDe: 'Nein. Wir haben keine "Rassen". Alle Katzen bei Purrfect Love sind "Gemeinschaftskatzen" oder einheimische Rassekatzen (auch Indie genannt). Das sind die Arten von Katzen, die Sie auf der Straße, in Ihrer Nachbarschaft usw. sehen könnten. Sie sind so, wie die Natur sie geschaffen hat, ohne kontrollierte Zucht; sie haben eine große genetische Vielfalt, natürliche Krankheitsresistenz und Immunität; sie sehen toll aus und sind äußerst liebevoll.',
    category: 'cats',
    order: 3,
  },
  {
    questionEn: 'What if I want a kitten vs adult cat?',
    answerEn: 'You can choose to adopt from our adoption page (purrfectlove.org/adopt). We don\'t encourage adopting only young ones, as these are myths that older cats are not loving or that they don\'t settle in. All cats are unique and have their own settling down process and time. We\'re here to guide you with that.',
    questionDe: 'Was ist, wenn ich ein Kätzchen statt einer erwachsenen Katze möchte?',
    answerDe: 'Sie können auf unserer Adoptionsseite (purrfectlove.org/adopt) eine Katze auswählen. Wir ermutigen nicht dazu, nur junge Katzen zu adoptieren, da es Mythen sind, dass ältere Katzen nicht liebevoll sind oder sich nicht eingewöhnen. Alle Katzen sind einzigartig und haben ihren eigenen Eingewöhnungsprozess und ihre eigene Zeit. Wir sind hier, um Sie dabei zu begleiten.',
    category: 'cats',
    order: 4,
  },

  // ============ AFTER ADOPTION ============
  {
    questionEn: 'What support do you provide after adoption?',
    answerEn: 'We are here to handhold you through the first days of having a new cat. You could also check out our guide where we\'ve detailed out everything you can expect and what to do in each case. We\'re also available on WhatsApp (one of our volunteers who helped you adopt will guide you) and on support@purrfectlove.org in case you have questions.',
    questionDe: 'Welche Unterstützung bieten Sie nach der Adoption?',
    answerDe: 'Wir begleiten Sie durch die ersten Tage mit Ihrer neuen Katze. Sie können auch unseren Leitfaden lesen, in dem wir alles detailliert beschrieben haben, was Sie erwarten können und was in jedem Fall zu tun ist. Wir sind auch über WhatsApp erreichbar (einer unserer Freiwilligen, der Ihnen bei der Adoption geholfen hat, wird Sie begleiten) und unter support@purrfectlove.org, falls Sie Fragen haben.',
    category: 'after',
    order: 1,
  },
  {
    questionEn: 'What if it doesn\'t work out?',
    answerEn: 'This is an unfortunate but rare case. This only happens when the adopter runs out of patience before the cat has had a chance to fully get used to its new home. But in such cases, we strongly recommend reaching out to us and one of us will pick up the cat from your residence. We also very sincerely ask of you not to leave the cat out on the street or elsewhere out of frustration or helplessness. We gave you the cat, we\'ll take it back.',
    questionDe: 'Was ist, wenn es nicht klappt?',
    answerDe: 'Das ist ein bedauerlicher, aber seltener Fall. Dies passiert nur, wenn dem Adoptanten die Geduld ausgeht, bevor die Katze die Chance hatte, sich vollständig an ihr neues Zuhause zu gewöhnen. Aber in solchen Fällen empfehlen wir dringend, sich an uns zu wenden, und einer von uns wird die Katze von Ihrem Wohnort abholen. Wir bitten Sie auch aufrichtig, die Katze nicht aus Frustration oder Hilflosigkeit auf der Straße oder anderswo auszusetzen. Wir haben Ihnen die Katze gegeben, wir nehmen sie zurück.',
    category: 'after',
    order: 2,
  },
  {
    questionEn: 'Can I contact you if I have questions later?',
    answerEn: 'Yes, reach out via support@purrfectlove.org and we will get back as soon as possible.',
    questionDe: 'Kann ich Sie kontaktieren, wenn ich später Fragen habe?',
    answerDe: 'Ja, kontaktieren Sie uns über support@purrfectlove.org und wir melden uns so schnell wie möglich.',
    category: 'after',
    order: 3,
  },

  // ============ LOCATION & LOGISTICS ============
  {
    questionEn: 'Do you drop off the cat or do I pick up?',
    answerEn: 'We always drop off our cats. This gives a chance to say goodbye, get the cat settled in your home, guide you through a few initial steps, and then leave your home (with a heavy heart). This usually takes about an hour, so ensure to set aside plenty of time on the day that you want your cat.',
    questionDe: 'Bringen Sie die Katze vorbei oder hole ich sie ab?',
    answerDe: 'Wir bringen unsere Katzen immer persönlich vorbei. Das gibt uns die Möglichkeit, Abschied zu nehmen, die Katze in Ihrem Zuhause einzurichten, Sie durch einige erste Schritte zu führen und dann Ihr Zuhause zu verlassen (mit schwerem Herzen). Dies dauert in der Regel etwa eine Stunde, also stellen Sie sicher, dass Sie an dem Tag, an dem Sie Ihre Katze bekommen möchten, genügend Zeit einplanen.',
    category: 'location',
    order: 1,
  },
  {
    questionEn: 'Do you adopt outside Bangalore?',
    answerEn: 'Yes, it depends entirely on where our volunteers are located.',
    questionDe: 'Adoptieren Sie auch außerhalb von Bangalore?',
    answerDe: 'Ja, das hängt ganz davon ab, wo unsere Freiwilligen sich befinden.',
    category: 'location',
    order: 2,
  },
  {
    questionEn: 'How does adoption work for Germany?',
    answerEn: 'The adoption process in Germany follows the same principles as in India. We have volunteers based in Stuttgart and surrounding areas. The process includes application review, a call, home visit, and cat drop-off. Contact us at support@purrfectlove.org for Germany-specific questions.',
    questionDe: 'Wie funktioniert die Adoption in Deutschland?',
    answerDe: 'Der Adoptionsprozess in Deutschland folgt den gleichen Prinzipien wie in Indien. Wir haben Freiwillige in Stuttgart und Umgebung. Der Prozess umfasst die Prüfung der Bewerbung, ein Gespräch, einen Hausbesuch und die Übergabe der Katze. Kontaktieren Sie uns unter support@purrfectlove.org für deutschlandspezifische Fragen.',
    category: 'location',
    order: 3,
  },

  // ============ GENERAL ============
  {
    questionEn: 'Why adopt instead of buying?',
    answerEn: 'This is an ethical question and is at the core of why we run this organisation. Cats, like any other domesticated pet animals, are not commodities like toys. They\'re not things you buy off the shelf or from an online catalog. They\'re in some ways just like us - they\'re people too, with feelings, fears, needs, and relationships. When an animal comes into your life (even if you\'ve paid money for it), the animal does so with pure intentions. It only wants to survive, adapt and coexist with you and your family. You may know some people who\'ve paid for pets, and this doesn\'t mean they don\'t love their pets. They might have done it because it\'s something many people do. We aim to normalise adopting and de-normalise buying. Buying an animal entrenches an attitude that subjects the animal to being treated like an object rather than a living being.',
    questionDe: 'Warum adoptieren statt kaufen?',
    answerDe: 'Dies ist eine ethische Frage und steht im Kern dessen, warum wir diese Organisation betreiben. Katzen sind, wie alle anderen domestizierten Haustiere, keine Waren wie Spielzeug. Sie sind keine Dinge, die man im Laden oder aus einem Online-Katalog kauft. Sie sind in gewisser Weise genau wie wir - sie sind auch Lebewesen mit Gefühlen, Ängsten, Bedürfnissen und Beziehungen. Wenn ein Tier in Ihr Leben kommt (auch wenn Sie dafür bezahlt haben), tut es das mit reinen Absichten. Es möchte nur überleben, sich anpassen und mit Ihnen und Ihrer Familie koexistieren. Sie kennen vielleicht Menschen, die für Haustiere bezahlt haben, und das bedeutet nicht, dass sie ihre Haustiere nicht lieben. Sie haben es vielleicht getan, weil es etwas ist, das viele Menschen tun. Unser Ziel ist es, das Adoptieren zu normalisieren und das Kaufen zu de-normalisieren. Der Kauf eines Tieres verfestigt eine Haltung, die das Tier wie ein Objekt behandelt und nicht wie ein Lebewesen.',
    category: 'general',
    order: 1,
  },
];

async function seedFaqs() {
  console.log('Starting FAQ seed...\n');
  console.log(`Total FAQs to create: ${faqs.length}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const faq of faqs) {
    try {
      const result = await client.create({
        _type: 'faq',
        ...faq,
      });
      console.log(`✓ [${faq.category}] "${faq.questionEn.substring(0, 50)}..."`);
      successCount++;
    } catch (error) {
      console.error(`✗ [${faq.category}] "${faq.questionEn.substring(0, 50)}..."`, error.message);
      errorCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`FAQ seed complete!`);
  console.log(`Success: ${successCount} | Errors: ${errorCount}`);
  console.log(`========================================`);
}

seedFaqs();
