import { useEffect, useRef, useCallback } from 'react';
import api from '../api/axiosConfig';

const getSessionId = () => {
  let id = sessionStorage.getItem('sessionId');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
    sessionStorage.setItem('sessionId', id);
  }
  return id;
};

export function useAnalytics() {
  const tracked = useRef(new Set());

  const trackEvent = useCallback(async (type, target = '', duration = 0) => {
    try {
      await api.post('/analytics/event', {
        type,
        target,
        sessionId: getSessionId(),
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        duration
      });
    } catch {}
  }, []);

  // Track page view once per session
  useEffect(() => {
    if (!tracked.current.has('page_view')) {
      tracked.current.add('page_view');
      trackEvent('page_view', window.location.pathname);
    }
  }, [trackEvent]);

  const trackSection = useCallback((sectionName) => {
    const key = `section_${sectionName}`;
    if (!tracked.current.has(key)) {
      tracked.current.add(key);
      trackEvent('section_view', sectionName);
    }
  }, [trackEvent]);

  const trackProjectClick = useCallback((projectId) => {
    trackEvent('project_click', projectId);
  }, [trackEvent]);

  const trackContactSubmit = useCallback(() => {
    trackEvent('contact_submit');
  }, [trackEvent]);

  return { trackEvent, trackSection, trackProjectClick, trackContactSubmit };
}
