'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import FeaturedBlogCard from '@/components/Home/FeaturedBlogCard';
import TagFilter from './TagFilter';
import styles from './BlogPage.module.css';

export default function BlogPageClient({ posts, locale, blogContent }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tagFromUrl = searchParams.get('tag');
  const [selectedTag, setSelectedTag] = useState(tagFromUrl);

  // Sync with URL param on mount and changes
  useEffect(() => {
    setSelectedTag(tagFromUrl);
  }, [tagFromUrl]);

  // Update URL when tag changes
  const handleTagSelect = (tag) => {
    setSelectedTag(tag);
    const basePath = locale === 'de' ? '/de/guides/blog' : '/guides/blog';
    if (tag) {
      router.push(`${basePath}?tag=${encodeURIComponent(tag)}`, { scroll: false });
    } else {
      router.push(basePath, { scroll: false });
    }
  };

  // Extract all unique tags from posts
  const allTags = useMemo(() => {
    const tagSet = new Set();
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [posts]);

  // Filter posts by selected tag
  const filteredPosts = useMemo(() => {
    if (!selectedTag) return posts;
    return posts.filter(post =>
      post.tags && post.tags.includes(selectedTag)
    );
  }, [posts, selectedTag]);

  return (
    <>
      {allTags.length > 0 && (
        <TagFilter
          allTags={allTags}
          selectedTag={selectedTag}
          onTagSelect={handleTagSelect}
          locale={locale}
        />
      )}

      {filteredPosts.length > 0 ? (
        <div className={styles.posts}>
          {filteredPosts.map((post) => (
            <FeaturedBlogCard
              key={post._id}
              post={post}
              locale={locale}
              readMoreText={blogContent.readMore}
            />
          ))}
        </div>
      ) : (
        <p className={styles.noPosts}>
          {selectedTag
            ? (locale === 'de' ? 'Keine Beiträge mit diesem Tag gefunden.' : 'No posts found with this tag.')
            : blogContent.noPosts
          }
        </p>
      )}
    </>
  );
}
