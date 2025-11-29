import { PortableText } from '@portabletext/react';
import styles from './FAQAccordion.module.css';

// Custom components for PortableText
const portableTextComponents = {
  marks: {
    link: ({ children, value }) => {
      const rel = value?.href?.startsWith('/') ? undefined : 'noopener noreferrer';
      const target = value?.href?.startsWith('/') ? undefined : '_blank';
      return (
        <a href={value?.href} rel={rel} target={target} className={styles.link}>
          {children}
        </a>
      );
    },
  },
};

// Helper to extract plain text from Portable Text for schema
function toPlainText(blocks) {
  if (!blocks || typeof blocks === 'string') return blocks || '';
  return blocks
    .map((block) => {
      if (block._type !== 'block' || !block.children) return '';
      return block.children.map((child) => child.text).join('');
    })
    .join('\n\n');
}

export default function FAQAccordion({ faqs, categoryLabels }) {
  // Group FAQs by category
  const groupedFaqs = faqs.reduce((acc, faq) => {
    const category = faq.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {});

  // Define category order
  const categoryOrder = ['process', 'requirements', 'fees', 'cats', 'after', 'location', 'general'];

  // Sort categories by defined order
  const sortedCategories = Object.keys(groupedFaqs).sort((a, b) => {
    return categoryOrder.indexOf(a) - categoryOrder.indexOf(b);
  });

  // Generate FAQ Schema structured data
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: toPlainText(faq.answer),
      },
    })),
  };

  return (
    <>
      {/* FAQ Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className={styles.accordion} role="region" aria-label="Frequently Asked Questions">
        {sortedCategories.map((category) => (
          <section key={category} className={styles.categorySection} aria-labelledby={`category-${category}`}>
            <h2 id={`category-${category}`} className={styles.categoryTitle}>
              {categoryLabels[category] || category}
            </h2>
            <div className={styles.faqList}>
              {groupedFaqs[category].map((faq) => (
                <details key={faq._id} className={styles.faqItem} itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                  <summary className={styles.question}>
                    <span itemProp="name">{faq.question}</span>
                    <span className={styles.icon} aria-hidden="true"></span>
                  </summary>
                  <div className={styles.answer} itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <div itemProp="text">
                      {typeof faq.answer === 'string' ? (
                        <p>{faq.answer}</p>
                      ) : (
                        <PortableText value={faq.answer} components={portableTextComponents} />
                      )}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
