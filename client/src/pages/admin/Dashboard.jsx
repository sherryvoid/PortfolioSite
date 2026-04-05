import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../../api/axiosConfig';

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [visitors, setVisitors] = useState([]);
  const [topProjects, setTopProjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [regions, setRegions] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [overviewRes, visitorsRes, topRes, sectionsRes, regionsRes] = await Promise.all([
          api.get(`/analytics/overview?days=${days}`),
          api.get(`/analytics/visitors?days=${days}`),
          api.get(`/analytics/top-projects?days=${days}`),
          api.get(`/analytics/sections?days=${days}`),
          api.get(`/analytics/regions?days=${days}`)
        ]);
        setOverview(overviewRes.data);
        setVisitors(visitorsRes.data);
        setTopProjects(topRes.data);
        setSections(sectionsRes.data);
        setRegions(regionsRes.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [days]);

  const statCards = [
    { label: 'Total Views', value: overview?.totalViews || 0, color: 'blue', icon: '👁️' },
    { label: 'Unique Visitors', value: overview?.uniqueSessions || 0, color: 'purple', icon: '👤' },
    { label: 'Top Project Views', value: overview?.topProject?.count || 0, color: 'green', icon: '🏆' },
    { label: 'Contact Messages', value: overview?.contactSubmissions || 0, color: 'orange', icon: '📧' }
  ];

  return (
    <div>
      <div className="admin-header">
        <h1>Dashboard</h1>
        <select
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', padding: 'var(--space-sm) var(--space-md)',
            color: 'var(--text-primary)', fontFamily: 'var(--font-family)', cursor: 'pointer'
          }}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            className={`admin-stat-card ${stat.color}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <p className="admin-stat-label">{stat.icon} {stat.label}</p>
            <p className="admin-stat-value">{stat.value.toLocaleString()}</p>
          </motion.div>
        ))}
      </div>

      {/* Visitor Trends Chart */}
      <motion.div
        className="admin-chart-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="admin-chart-header">
          <h3 className="admin-chart-title">Visitor Trends</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={visitors}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={d => d?.slice(5)} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: 8, fontSize: 13
              }}
            />
            <Line type="monotone" dataKey="views" stroke="#00D4FF" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="uniqueVisitors" stroke="#7C3AED" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Two columns: Top Projects + Section Views */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
        {/* Top Projects */}
        <motion.div
          className="admin-chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="admin-chart-title" style={{ marginBottom: 'var(--space-lg)' }}>Top Projects</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topProjects} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <YAxis dataKey="_id" type="category" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={120} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
              <Bar dataKey="clicks" fill="#00D4FF" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Section Views */}
        <motion.div
          className="admin-chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="admin-chart-title" style={{ marginBottom: 'var(--space-lg)' }}>Section Views</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sections}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="_id" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
              <Bar dataKey="views" fill="#7C3AED" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Regions Chart */}
      {regions.length > 0 && (
        <motion.div
          className="admin-chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          style={{ marginTop: 'var(--space-xl)' }}
        >
          <h3 className="admin-chart-title" style={{ marginBottom: 'var(--space-lg)' }}>Visitor Regions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regions}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="region" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#EC4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Recent Activity */}
      {overview?.recentEvents?.length > 0 && (
        <motion.div
          className="admin-table-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{ marginTop: 'var(--space-xl)' }}
        >
          <div className="admin-table-header">
            <h3 style={{ fontWeight: 700 }}>Recent Activity</h3>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Target</th>
                <th>Time</th>
                <th>Screen</th>
              </tr>
            </thead>
            <tbody>
              {overview.recentEvents.slice(0, 10).map((event, i) => (
                <tr key={event._id || i}>
                  <td>
                    <span className="tech-tag" style={{ textTransform: 'capitalize' }}>
                      {event.type?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{event.target || '-'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(event.timestamp).toLocaleString()}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{event.screenSize || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
