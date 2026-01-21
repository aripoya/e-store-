import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const Analytics = () => {
  const location = useLocation();
  const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID;
  
  useEffect(() => {
    if (!GA_TRACKING_ID) return;
    
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    window.gtag = gtag;
    
    gtag('js', new Date());
    gtag('config', GA_TRACKING_ID);
  }, [GA_TRACKING_ID]);
  
  useEffect(() => {
    if (!GA_TRACKING_ID || !window.gtag) return;
    
    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
    });
  }, [location, GA_TRACKING_ID]);
  
  if (!GA_TRACKING_ID) return null;
  
  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
    </>
  );
};
