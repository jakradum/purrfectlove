# Google Search Console Setup Checklist

## Sitemap URL to Submit
```
https://purrfectlove.org/sitemap.xml
```

## Step-by-Step Google Search Console Setup

### 1. Initial Setup (DO THIS FIRST)

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click "Add Property"
3. Choose "URL prefix" and enter: `https://purrfectlove.org`
4. Verify ownership using any method (HTML tag verification code already in layout.js)
5. Once verified, click "Continue"

### 2. Submit Sitemap (IMMEDIATE)

1. In left sidebar, click "Sitemaps"
2. Enter: `sitemap.xml`
3. Click "Submit"
4. Wait 5-10 minutes
5. Refresh page - Status should change to "Success"

### 3. Request Indexing (DAY 1)

**For Homepage:**
1. In left sidebar, click "URL Inspection"
2. Enter: `https://purrfectlove.org`
3. Click "Request Indexing"
4. Wait for confirmation

**For German Homepage:**
1. URL Inspection tool
2. Enter: `https://purrfectlove.org/de`
3. Click "Request Indexing"

**For Key Pages (Optional but Recommended):**
- `https://purrfectlove.org/adopt`
- `https://purrfectlove.org/de/adopt`
- `https://purrfectlove.org/guides/blog`
- `https://purrfectlove.org/de/guides/blog`

### 4. International Targeting Settings

1. In left sidebar, go to "Settings" (gear icon)
2. Click "International Targeting"
3. **Country targeting**:
   - For `/` (English): Associate with **India**
   - For `/de/*` (German): Associate with **Germany**

### 5. Performance Settings

1. Go to "Performance" in left sidebar
2. Click the "Open Report" button
3. Review:
   - Total clicks
   - Total impressions
   - Average CTR
   - Average position
4. **Do this weekly** to track progress

### 6. Coverage Check (WEEK 1)

1. Go to "Coverage" report
2. Check for:
   - ✅ Valid pages (should be green)
   - ⚠️ Valid with warnings (investigate)
   - ❌ Errors (fix immediately)
3. Fix any errors reported

### 7. Mobile Usability (WEEK 1)

1. Go to "Mobile Usability"
2. Ensure no errors
3. If errors exist:
   - Click to see details
   - Fix issues
   - Request re-crawl

### 8. Core Web Vitals (ONGOING)

1. Go to "Core Web Vitals"
2. Check:
   - LCP (Largest Contentful Paint) - should be < 2.5s
   - FID (First Input Delay) - should be < 100ms
   - CLS (Cumulative Layout Shift) - should be < 0.1
3. Fix any "Poor" or "Needs Improvement" URLs

### 9. Security & Manual Actions (CHECK IMMEDIATELY)

1. Go to "Security & Manual Actions"
2. Should show: "No issues detected"
3. If issues exist, fix them ASAP (can prevent indexing)

### 10. Links Report (WEEK 2+)

1. Go to "Links"
2. Review:
   - Top linking sites (external backlinks)
   - Top linked pages (internal structure)
3. Work on getting more quality backlinks

## Additional Google Search Console Actions

### A. Remove Old URLs (If Needed)
1. Go to "Removals"
2. Request removal of any old/incorrect URLs
3. Use "Temporarily remove" for quick fixes

### B. Check Rich Results
1. Go to "Enhancements"
2. Look for:
   - Breadcrumbs
   - Sitelinks
   - Site name
3. Validate any errors

### C. Enable Email Notifications
1. Go to Settings
2. Enable email notifications for:
   - Critical issues
   - New manual actions
   - Coverage issues

### D. Add Additional Users (If Needed)
1. Settings → Users and permissions
2. Add team members
3. Set appropriate permissions

## Expected Timeline

**Day 1-2:**
- Submit sitemap ✓
- Request indexing ✓
- Site appears in Search Console

**Day 3-7:**
- Google starts crawling
- Pages begin appearing in "Coverage" report
- Some pages may start appearing in search

**Week 2-3:**
- More pages indexed
- Performance data starts showing
- Site appears for "purrfect love" searches

**Week 4+:**
- Full indexing complete
- Rich results may appear
- Rankings stabilize

## Weekly Monitoring Checklist

**Every Monday:**
- [ ] Check Performance report (clicks, impressions, position)
- [ ] Review Coverage for new errors
- [ ] Check Mobile Usability
- [ ] Review new search queries
- [ ] Check indexing status of new pages

**Every Month:**
- [ ] Review backlinks
- [ ] Check Core Web Vitals
- [ ] Update sitemap if structure changed
- [ ] Review top-performing pages
- [ ] Analyze search query trends

## Troubleshooting

**Site not appearing after 2 weeks?**
1. Check Coverage report for errors
2. Verify robots.txt isn't blocking
3. Use URL Inspection to check specific pages
4. Check for manual actions
5. Test with: `site:purrfectlove.org` in Google

**Low impressions?**
1. Check Performance → Queries
2. See what keywords you rank for
3. Create content around missing keywords
4. Improve meta descriptions

**High impressions but low clicks?**
1. Improve meta descriptions (make them compelling)
2. Add structured data for rich results
3. Optimize page titles
4. Check if competitors rank higher

## Pro Tips

1. **Search Appearance**: Go to "Search Appearance" to see how pages look in search results
2. **Manual Actions**: Check immediately - can prevent entire site from ranking
3. **Mobile First**: Google uses mobile version for indexing
4. **Regular Updates**: Add new blog posts weekly for fresh content
5. **Fix Errors Fast**: Address Coverage errors within 24 hours

## Quick Test

After 48 hours, search on Google:
```
site:purrfectlove.org
```

This shows all indexed pages. Should show at least your homepage.

After 1 week, search:
```
purrfect love bangalore
purrfect love stuttgart
```

Your site should start appearing in results.

---

## Support Resources

- [Google Search Console Help](https://support.google.com/webmasters)
- [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Search Console Training](https://developers.google.com/search/docs/monitor-debug/search-console-training)

Good luck! 🚀
