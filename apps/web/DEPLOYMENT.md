# JogjaBootcamp Homepage - Deployment Guide

## 🚀 Quick Deploy to Production

### Prerequisites
- Cloudflare account with Pages enabled
- Google Analytics 4 property created
- Domain jogjabootcamp.com configured in Cloudflare

### 1. Set Environment Variables in Cloudflare Pages

Go to your Cloudflare Pages project settings and add these environment variables:

```bash
VITE_GA_TRACKING_ID=G-XXXXXXXXXX  # Your actual GA4 tracking ID
VITE_API_URL=https://jogjabootcamp-api.wahwooh.workers.dev
VITE_QUIZ_URL=https://awal.jogjabootcamp.com
```

### 2. Deploy to Production

```bash
# From the web app directory
cd /Users/ipoy/Documents/e-store/apps/web

# Build and deploy
pnpm build
pnpm deploy
```

Or use the deploy script:
```bash
pnpm deploy
```

### 3. Verify Deployment

After deployment, verify these features:

**Homepage Features:**
- ✅ Hero section with quiz CTA
- ✅ Trust indicators (500+ users, Free, 3 minutes)
- ✅ Social proof section
- ✅ Pain points section
- ✅ Solutions section
- ✅ Courses section
- ✅ Testimonials
- ✅ Final CTA to quiz
- ✅ Mobile sticky button

**Analytics:**
- ✅ GA4 tracking code loads
- ✅ Page views tracked
- ✅ CTA clicks tracked
- ✅ UTM parameters preserved

**SEO:**
- ✅ Meta tags present
- ✅ Open Graph tags
- ✅ Twitter Card tags
- ✅ Canonical URL

## 🧪 Testing Checklist

### Functional Tests

```bash
# Test homepage loads
curl https://jogjabootcamp.com

# Test with UTM parameters
https://jogjabootcamp.com?utm_source=google&utm_medium=cpc&utm_campaign=test

# Verify quiz URL includes UTM
# Should redirect to: https://awal.jogjabootcamp.com?utm_source=google&utm_medium=cpc&utm_campaign=test
```

### Analytics Tests

1. **Google Analytics Real-Time:**
   - Open https://analytics.google.com
   - Go to Real-Time reports
   - Visit homepage
   - Verify page view appears
   - Click CTA buttons
   - Verify events appear

2. **Event Tracking:**
   - Hero CTA click → Event: `cta_click` with label: `hero_section`
   - Bottom CTA click → Event: `cta_click` with label: `bottom_section`
   - Mobile sticky click → Event: `cta_click` with label: `mobile_sticky`

### Mobile Tests

Test on:
- ✅ iOS Safari (iPhone)
- ✅ Android Chrome
- ✅ Responsive design (320px - 1920px)
- ✅ Sticky button appears on mobile only
- ✅ Touch targets min 44x44px

### Performance Tests

```bash
# Run Lighthouse
npx lighthouse https://jogjabootcamp.com --view

# Target scores:
# Performance: 90+
# Accessibility: 90+
# Best Practices: 90+
# SEO: 90+
```

### SEO Tests

```bash
# Check meta tags
curl -s https://jogjabootcamp.com | grep -i "meta"

# Verify Open Graph
curl -s https://jogjabootcamp.com | grep -i "og:"

# Check canonical
curl -s https://jogjabootcamp.com | grep -i "canonical"
```

## 🔧 Troubleshooting

### Analytics Not Tracking

1. Check GA_TRACKING_ID is set correctly
2. Open browser console, look for gtag errors
3. Verify GA4 property is active
4. Check Real-Time reports in GA

### UTM Parameters Not Passing

1. Check browser console for errors
2. Verify `getQuizURL()` function in tracking.ts
3. Test manually: add `?utm_source=test` to URL
4. Click CTA and verify quiz URL includes parameter

### Mobile Sticky Button Not Showing

1. Verify screen width < 768px
2. Check z-index conflicts
3. Inspect element in DevTools

## 📊 Monitoring

### Key Metrics to Track

1. **Traffic Sources:**
   - Direct traffic
   - Google Ads (utm_source=google, utm_medium=cpc)
   - Meta Ads (utm_source=facebook, utm_medium=cpc)
   - Organic search

2. **Conversion Events:**
   - Quiz CTA clicks
   - Quiz completions (tracked in quiz app)
   - Email submissions

3. **User Behavior:**
   - Time on page
   - Scroll depth
   - Bounce rate
   - Pages per session

## 🎯 Next Steps

After homepage is live and tracking:

1. **A/B Testing:**
   - Test different headlines
   - Test CTA button copy
   - Test trust indicators

2. **Optimization:**
   - Analyze heatmaps
   - Review session recordings
   - Optimize based on data

3. **Integration:**
   - Connect quiz results to CRM
   - Set up email automation
   - Create retargeting audiences
