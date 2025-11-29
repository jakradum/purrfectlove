export default function BreadcrumbSchema({ items, locale = 'en' }) {
  const baseUrl = 'https://purrfectlove.org';
  const localePath = locale === 'de' ? '/de' : '';

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path === '/'
        ? `${baseUrl}${localePath || '/'}`
        : `${baseUrl}${localePath}${item.path}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
    />
  );
}
