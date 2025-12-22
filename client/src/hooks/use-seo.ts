import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
}

const DEFAULT_TITLE = 'ArtisanConnect SA - Hire Trusted Plumbers, Electricians & Artisans';
const DEFAULT_DESCRIPTION = 'Connect with vetted South African artisans. Get competitive quotes, secure escrow payments, and verified professionals.';

export function useSEO({ title, description }: SEOProps = {}) {
  useEffect(() => {
    const fullTitle = title 
      ? `${title} | ArtisanConnect SA`
      : DEFAULT_TITLE;
    
    document.title = fullTitle;

    const metaTitle = document.querySelector('meta[name="title"]');
    if (metaTitle) metaTitle.setAttribute('content', fullTitle);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', fullTitle);

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', fullTitle);

    if (description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', description);

      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', description);

      const twitterDesc = document.querySelector('meta[name="twitter:description"]');
      if (twitterDesc) twitterDesc.setAttribute('content', description);
    }

    return () => {
      document.title = DEFAULT_TITLE;
      const metaTitle = document.querySelector('meta[name="title"]');
      if (metaTitle) metaTitle.setAttribute('content', DEFAULT_TITLE);
      
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', DEFAULT_DESCRIPTION);
    };
  }, [title, description]);
}
