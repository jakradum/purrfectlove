'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import FeaturedBlogCard from '@/components/Home/FeaturedBlogCard';
import TagFilter from './TagFilter';
import styles from './BlogPage.module.css';

const TAG_LABELS = {
  'adoption': 'Adoption',
  'cat-care': 'Cat Care',
  'cat-health': 'Cat Health',
  'cat-behavior': 'Cat Behavior',
  'rescue-stories': 'Rescue Stories',
  'foster-care': 'Foster Care',
  'community': 'Community',
  'katzenpflege': 'Katzenpflege',
  'katzengesundheit': 'Katzengesundheit',
  'katzenverhalten': 'Katzenverhalten',
  'rettungsgeschichten': 'Rettungsgeschichten',
  'pflegestelle': 'Pflegestelle',
  'gemeinschaft': 'Gemeinschaft'
};

const PAGE_SIZE = 10;

export default function BlogPageClient({ posts, locale, blogContent }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tagsFromUrl = searchParams.get('tags');
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);

  const [selectedTags, setSelectedTags] = useState(() =>
    tagsFromUrl ? tagsFromUrl.split(',').filter(Boolean) : []
  );
  const [currentPage, setCurrentPage] = useState(() => (pageFromUrl >= 1 ? pageFromUrl : 1));

  useEffect(() => {
    setSelectedTags(tagsFromUrl ? tagsFromUrl.split(',').filter(Boolean) : []);
  }, [tagsFromUrl]);

  useEffect(() => {
    setCurrentPage(pageFromUrl >= 1 ? pageFromUrl : 1);
  }, [pageFromUrl]);

  const buildUrl = (tags, page) => {
    const basePath = locale === 'de' ? '/de/guides/blog' : '/guides/blog';
    const params = new URLSearchParams();
    if (tags.length > 0) params.set('tags', tags.join(','));
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const handleTagSelect = (tag) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    setCurrentPage(1);
    router.push(buildUrl(newTags, 1), { scroll: false });
  };

  const handleClearAll = () => {
    setSelectedTags([]);
    setCurrentPage(1);
    router.push(buildUrl([], 1), { scroll: false });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    router.push(buildUrl(selectedTags, page), { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const allTags = useMemo(() => {
    const tagSet = new Set();
    posts.forEach(post => {
      const postTags = locale === 'de'
        ? (post.tagsDe && post.tagsDe.length > 0 ? post.tagsDe : post.tags)
        : post.tags;
      if (postTags && Array.isArray(postTags)) postTags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [posts, locale]);

  const filteredPosts = useMemo(() => {
    if (selectedTags.length === 0) return posts;
    return posts.filter(post => {
      const postTags = locale === 'de'
        ? (post.tagsDe && post.tagsDe.length > 0 ? post.tagsDe : post.tags)
        : post.tags;
      return postTags && selectedTags.some(tag => postTags.includes(tag));
    });
  }, [posts, selectedTags, locale]);

  const totalPosts = filteredPosts.length;
  const totalPages = Math.ceil(totalPosts / PAGE_SIZE);
  const safePage = Math.min(Math.max(currentPage, 1), totalPages || 1);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pagePosts = filteredPosts.slice(startIdx, startIdx + PAGE_SIZE);

  const getTagLabel = (tag) => {
    if (TAG_LABELS[tag]) return TAG_LABELS[tag];
    return tag.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <>
      {allTags.length > 0 && (
        <TagFilter
          allTags={allTags}
          selectedTags={selectedTags}
          onTagSelect={handleTagSelect}
          onClearAll={handleClearAll}
          locale={locale}
          getTagLabel={getTagLabel}
        />
      )}

      {pagePosts.length > 0 ? (
        <>
          <p className={styles.paginationMeta}>
            {locale === 'de'
              ? `${startIdx + 1}–${Math.min(startIdx + PAGE_SIZE, totalPosts)} von ${totalPosts} Beiträgen`
              : `Showing ${startIdx + 1}–${Math.min(startIdx + PAGE_SIZE, totalPosts)} of ${totalPosts} posts`}
          </p>

          <div className={styles.posts}>
            {pagePosts.map((post) => (
              <FeaturedBlogCard
                key={post._id}
                post={post}
                locale={locale}
                readMoreText={blogContent.readMore}
                variant="blog"
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage === 1}
                aria-label="Previous page"
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                <button
                  key={pg}
                  className={`${styles.pageBtn} ${pg === safePage ? styles.pageBtnActive : ''}`}
                  onClick={() => handlePageChange(pg)}
                  aria-label={`Page ${pg}`}
                  aria-current={pg === safePage ? 'page' : undefined}
                >
                  {pg}
                </button>
              ))}

              <button
                className={styles.pageBtn}
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage === totalPages}
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          )}
        </>
      ) : (
        <p className={styles.noPosts}>
          {selectedTags.length > 0
            ? (locale === 'de' ? 'Keine Beiträge mit diesen Tags gefunden.' : 'No posts found with these tags.')
            : blogContent.noPosts
          }
        </p>
      )}
    </>
  );
}
