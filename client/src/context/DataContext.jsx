import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, projectsRes, skillsRes, certsRes] = await Promise.all([
        api.get('/profile'),
        api.get('/projects'),
        api.get('/skills'),
        api.get('/certifications')
      ]);
      setProfile(profileRes.data);
      setProjects(projectsRes.data);
      setSkills(skillsRes.data);
      setCertifications(certsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
