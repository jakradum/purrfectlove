'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import FeaturedBlogCard from '@/components/Home/FeaturedBlogCard';
import TagFilter from './TagFilter';
import styles from './BlogPage.module.css';

// Tag display labels - capitalize and format for display
const TAG_LABELS = {
  // English tags
  'adoption': 'Adoption',
  'cat-care': 'Cat Care',
  'cat-health': 'Cat Health',
  'cat-behavior': 'Cat Behavior',
  'rescue-stories': 'Rescue Stories',
  'foster-care': 'Foster Care',
  'community': 'Community',
  // German tags (stored in tagsDe field)
  'katzenpflege': 'Katzenpflege',
  'katzengesundheit': 'Katzengesundheit',
  'katzenverhalten': 'Katzenverhalten',
  'rettungsgeschichten': 'Rettungsgeschichten',
  'pflegestelle': 'Pflegestelle',
  'gemeinschaft': 'Gemeinschaft'
};

export default function BlogPageClient({ posts, locale, blogContent }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tagsFromUrl = searchParams.get('tags');
  const [selectedTags, setSelectedTags] = useState(() => {
    if (tagsFromUrl) {
      return tagsFromUrl.split(',').filter(Boolean);
    }
    return [];
  });

  // Sync with URL param on mount and changes
  useEffect(() => {
    if (tagsFromUrl) {
      setSelectedTags(tagsFromUrl.split(',').filter(Boolean));
    } else {
      setSelectedTags([]);
    }
  }, [tagsFromUrl]);

  // Update URL when tags change
  const updateUrl = (tags) => {
    const basePath = locale === 'de' ? '/de/guides/blog' : '/guides/blog';
    if (tags.length > 0) {
      router.push(`${basePath}?tags=${tags.join(',')}`, { scroll: false });
    } else {
      router.push(basePath, { scroll: false });
    }
  };

  // Handle tag click - toggle selection
  const handleTagSelect = (tag) => {
    let newTags;
    if (selectedTags.includes(tag)) {
      // Deselect the tag
      newTags = selectedTags.filter(t => t !== tag);
    } else {
      // Add the tag
      newTags = [...selectedTags, tag];
    }
    setSelectedTags(newTags);
    updateUrl(newTags);
  };

  // Clear all selected tags
  const handleClearAll = () => {
    setSelectedTags([]);
    updateUrl([]);
  };

  // Extract all unique tags from posts (use locale-appropriate tags field)
  const allTags = useMemo(() => {
    const tagSet = new Set();
    posts.forEach(post => {
      // For German locale, prefer tagsDe if available, otherwise fall back to tags
      const postTags = locale === 'de'
        ? (post.tagsDe && post.tagsDe.length > 0 ? post.tagsDe : post.tags)
        : post.tags;

      if (postTags && Array.isArray(postTags)) {
        postTags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [posts, locale]);

  // Filter posts by selected tags (match ANY of the selected tags)
  const filteredPosts = useMemo(() => {
    if (selectedTags.length === 0) return posts;
    return posts.filter(post => {
      const postTags = locale === 'de'
        ? (post.tagsDe && post.tagsDe.length > 0 ? post.tagsDe : post.tags)
        : post.tags;
      return postTags && selectedTags.some(tag => postTags.includes(tag));
    });
  }, [posts, selectedTags, locale]);

  // Get display label for a tag
  const getTagLabel = (tag) => {
    if (TAG_LABELS[tag]) {
      return TAG_LABELS[tag];
    }
    // Fallback: capitalize first letter of each word
    return tag.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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

      {filteredPosts.length > 0 ? (
        <div className={styles.posts}>
          {filteredPosts.map((post) => (
            <FeaturedBlogCard
              key={post._id}
              post={post}
              locale={locale}
              readMoreText={blogContent.readMore}
              variant="blog"
            />
          ))}
        </div>
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
