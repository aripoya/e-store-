export const getURLParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || 'direct',
    utm_medium: params.get('utm_medium') || 'none',
    utm_campaign: params.get('utm_campaign') || 'none',
    utm_content: params.get('utm_content') || null,
    utm_term: params.get('utm_term') || null,
  };
};

export const getQuizURL = () => {
  const params = new URLSearchParams(window.location.search);
  const baseURL = 'https://awal.jogjabootcamp.com';
  return params.toString() ? `${baseURL}?${params.toString()}` : baseURL;
};

export const trackCTAClick = (ctaLocation: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'cta_click', {
      event_category: 'engagement',
      event_label: ctaLocation,
      value: 1
    });
  }
  
  const apiUrl = import.meta.env.VITE_API_URL || 'https://jogjabootcamp-api.wahwooh.workers.dev';
  
  fetch(`${apiUrl}/api/track/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'homepage_cta_click',
      location: ctaLocation,
      timestamp: new Date().toISOString(),
      ...getURLParams()
    })
  }).catch(err => console.error('Tracking error:', err));
};

export const trackEvent = (eventName: string, eventData: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, eventData);
  }
};

export const trackPageView = (pagePath: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'page_view', {
      page_path: pagePath,
    });
  }
};
