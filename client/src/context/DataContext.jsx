import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';

import fallbackData from '../assets/fallbackData.json';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [profile, setProfile] = useState(() => {
    try { const cached = localStorage.getItem('portfolio_profile'); if (cached) return JSON.parse(cached); } catch(e){}
    return fallbackData.profile || null;
  });
  const [projects, setProjects] = useState(() => {
    try { const cached = localStorage.getItem('portfolio_projects'); if (cached) return JSON.parse(cached); } catch(e){}
    return fallbackData.projects || [];
  });
  const [skills, setSkills] = useState(() => {
    try { const cached = localStorage.getItem('portfolio_skills'); if (cached) return JSON.parse(cached); } catch(e){}
    return fallbackData.skills || [];
  });
  const [certifications, setCertifications] = useState(() => {
    try { const cached = localStorage.getItem('portfolio_certifications'); if (cached) return JSON.parse(cached); } catch(e){}
    return fallbackData.certifications || [];
  });
  // Loading is false initially because we have instant fallback data! This eliminates 40s cold starts.
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [profileRes, projectsRes, skillsRes, certsRes] = await Promise.all([
        api.get('/profile'),
        api.get('/projects'),
        api.get('/skills'),
        api.get('/certifications')
      ]);

      const freshProfile = profileRes.data;
      const freshProjects = projectsRes.data;
      const freshSkills = skillsRes.data;
      const freshCerts = certsRes.data;

      setProfile(freshProfile);
      setProjects(freshProjects);
      setSkills(freshSkills);
      setCertifications(freshCerts);

      // Persist to cache
      localStorage.setItem('portfolio_profile', JSON.stringify(freshProfile));
      localStorage.setItem('portfolio_projects', JSON.stringify(freshProjects));
      localStorage.setItem('portfolio_skills', JSON.stringify(freshSkills));
      localStorage.setItem('portfolio_certifications', JSON.stringify(freshCerts));

    } catch (error) {
      console.warn('Backend currently asleep or unreachable. Using cached/fallback data.', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const refetch = () => fetchAll();

  return (
    <DataContext.Provider value={{
      profile, projects, skills, certifications, loading, refetch,
      setProfile, setProjects, setSkills, setCertifications
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
