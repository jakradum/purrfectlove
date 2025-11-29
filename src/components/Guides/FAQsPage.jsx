// src/components/Guides/FAQsPage.jsx
import styles from './FAQsPage.module.css';
import { client } from '@/sanity/lib/client';
import Breadcrumb from '@/components/Breadcrumb';
import FAQAccordion from './FAQAccordion';
import contentEN from '@/data/pageContent.en.json';
import contentDE from '@/data/pageContent.de.json';

export default async function FAQsPage({ locale = 'en' }) {
  const content = locale === 'de' ? contentDE : contentEN;
  const faqsContent = content.faqs;

  const faqs = await client.fetch(
    `*[_type == "faq"] | order(category asc, order asc) {
      _id,
      "question": ${locale === 'de' ? 'questionDe' : 'questionEn'},
      "answer": ${locale === 'de' ? 'answerDe' : 'answerEn'},
      category,
      order
    }`,
    {},
    { cache: 'no-store' }
  );

  const homeHref = locale === 'de' ? '/de' : '/';
  const guidesHref = locale === 'de' ? '/de/guides' : '/guides';
  const breadcrumbItems = [
    { href: homeHref, label: faqsContent.breadcrumb.home },
    { label: faqsContent.breadcrumb.faqs },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Breadcrumb items={breadcrumbItems} />

        <header className={styles.header}>
          <h1 className={styles.heading}>{faqsContent.heading}</h1>
          {faqsContent.subheading && (
            <p className={styles.subheading}>{faqsContent.subheading}</p>
          )}
        </header>

        {faqs.length > 0 ? (
          <FAQAccordion faqs={faqs} categoryLabels={faqsContent.categories} />
        ) : (
          <p className={styles.noFaqs}>{faqsContent.noFaqs}</p>
        )}

        <Breadcrumb items={breadcrumbItems} />
      </div>
    </main>
  );
}
