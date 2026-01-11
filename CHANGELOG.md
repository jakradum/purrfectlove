# Changelog

This file tracks the latest changes to the Purrfect Love project.

## Recent Updates

### [5c61654](https://github.com/jakradum/purrfectlove/commit/5c61654) - Jan 11, 2026
**Make latest updates widget collapsible**
- Show only the most recent commit by default
- Add "Show all 5" / "Show less" toggle button
- Button styled as inline link in fine print to match aesthetic

### [29947f8](https://github.com/jakradum/purrfectlove/commit/29947f8) - Jan 11, 2026
**Add latest commits widget and improve text editor UX**

Dashboard improvements:
- Add LatestUpdates widget showing last 5 commits from GitHub
- Display commit SHA, date, and message in fine print at top of dashboard
- Clickable commit links to GitHub

Text editor improvements:
- Increase minimum height of all text inputs (48px desktop, 56px mobile)
- Increase text area height (120px desktop, 160px mobile)
- Increase rich text editor height (200px desktop, 240px mobile)
- Set font-size to 16px to prevent auto-zoom on iOS Safari
- Better tap targets and padding for mobile editing
- iOS Safari specific fixes for better text selection

### [1877d69](https://github.com/jakradum/purrfectlove/commit/1877d69) - Jan 11, 2026
**Update dashboard UI and fix studio layout**
- Change UK flag (🇬🇧) to India flag (🇮🇳) for English language
- Remove navbar padding for /studio routes
  - Create separate layout for studio that doesn't include navbar
  - Add CSS rule to remove padding-top when Sanity Studio is rendered
  - Applies to both desktop and mobile views

### [e96ab6a](https://github.com/jakradum/purrfectlove/commit/e96ab6a) - Jan 11, 2026
**Fix dashboard widget links for production**
- Change from absolute paths (/studio/structure/...) to relative paths (structure/...) to work correctly in both local and production environments

### [c043fac](https://github.com/jakradum/purrfectlove/commit/c043fac) - Jan 11, 2026
**Improve blog post editor UX with conditional fields and validation**
- Move Site Version dropdown to top of form
- Hide language-specific fields based on Site Version selection
  - English fields hidden when "German site only" selected
  - German fields hidden when "English site only" selected
  - All fields visible when "Both sites" selected
- Remove blocking validation for featured posts (max 4 limit)
  - Frontend already displays only 4 most recent featured posts
  - Users can now publish changes without being blocked
- Add validation to prevent featuring without content
  - Cannot feature on English homepage without English content
  - Cannot feature on German homepage without German content
- Add pin emoji (📌) to featured field labels and preview
- Update field descriptions to clarify "4 most recently published" logic
- Disable array duplication in blog posts

---

*This changelog is automatically updated with each commit to the repository.*
