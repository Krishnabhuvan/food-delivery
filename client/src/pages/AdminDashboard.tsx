import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  targetId: string;
  targetType: string;
  createdAt: string;
}

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  isVerified: boolean;
  isOpen: boolean;
}

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'logs' | 'restaurants' | 'verify'>('restaurants');
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [suspendUserId, setSuspendUserId] = useState('');
  const [suspendReason, setSuspendReason] = useState('');

  useEffect(() => {
    fetchRestaurants();
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/api/admin/logs');
      setLogs(res.data);
    } catch {
      console.error('Failed to fetch logs');
    }
  };

  const fetchRestaurants = async () => {
  try {
    const res = await api.get('/api/restaurants/all');
    setRestaurants(res.data);
  } catch {
    console.error('Failed to fetch restaurants');
  } finally {
    setLoading(false);
  }
};

  const verifyRestaurant = async (restaurantId: string) => {
    try {
      await api.post('/api/admin/verify-restaurant', { restaurantId });
      setMessage('Restaurant verified!');
      fetchLogs();
      fetchRestaurants();
    } catch {
      setMessage('Failed to verify restaurant.');
    }
  };

  const suspendUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/suspend-user', {
        userId: suspendUserId,
        reason: suspendReason
      });
      setMessage('User suspended successfully.');
      setSuspendUserId('');
      setSuspendReason('');
      fetchLogs();
    } catch {
      setMessage('Failed to suspend user.');
    }
  };

  const tabStyle = (t: string) => ({
    padding: '8px 20px',
    background: tab === t ? '#f97316' : '#eee',
    color: tab === t ? '#fff' : '#333',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  });

  const actionColor: Record<string, string> = {
    VERIFY_RESTAURANT: '#22c55e',
    SUSPEND_USER: '#ef4444'
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Loading...</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>🛡️ Admin Dashboard</h2>
        <button onClick={() => { logout(); navigate('/login'); }}
          style={{ padding: '8px 16px', background: '#eee', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: '2rem' }}>
        {[
          { label: 'Total Restaurants', value: restaurants.length, color: '#3b82f6' },
          { label: 'Verified', value: restaurants.filter(r => r.isVerified).length, color: '#22c55e' },
          { label: 'Pending Verification', value: restaurants.filter(r => !r.isVerified).length, color: '#f59e0b' }
        ].map(stat => (
          <div key={stat.label} style={{ border: '1px solid #eee', borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</p>
            <p style={{ color: '#666', fontSize: 13 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {message && (
        <p style={{
          color: message.includes('Failed') ? 'red' : '#22c55e',
          marginBottom: '1rem', padding: '10px',
          background: message.includes('Failed') ? '#fef2f2' : '#f0fdf4',
          borderRadius: 6
        }}>
          {message}
        </p>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '2rem' }}>
        <button style={tabStyle('restaurants')} onClick={() => setTab('restaurants')}>
          Restaurants
        </button>
        <button style={tabStyle('verify')} onClick={() => setTab('verify')}>
          Suspend User
        </button>
        <button style={tabStyle('logs')} onClick={() => setTab('logs')}>
          Audit Logs {logs.length > 0 && `(${logs.length})`}
        </button>
      </div>

      {/* Restaurants Tab */}
      {tab === 'restaurants' && (
        <div>
          {restaurants.length === 0 ? (
            <p style={{ color: '#999' }}>No restaurants found.</p>
          ) : restaurants.map(r => (
            <div key={r.id} style={{ border: '1px solid #eee', borderRadius: 10, padding: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ marginBottom: 4 }}>{r.name}</h4>
                <p style={{ color: '#666', fontSize: 13, marginBottom: 4 }}>{r.description}</p>
                <p style={{ color: '#999', fontSize: 13 }}>📍 {r.address}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 10,
                    background: r.isVerified ? '#dcfce7' : '#fef9c3',
                    color: r.isVerified ? '#16a34a' : '#ca8a04'
                  }}>
                    {r.isVerified ? '✓ Verified' : '⏳ Pending'}
                  </span>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 10,
                    background: r.isOpen ? '#dcfce7' : '#fee2e2',
                    color: r.isOpen ? '#16a34a' : '#dc2626'
                  }}>
                    {r.isOpen ? '● Open' : '● Closed'}
                  </span>
                </div>
              </div>
              {!r.isVerified && (
                <button onClick={() => verifyRestaurant(r.id)}
                  style={{ padding: '8px 16px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Verify ✓
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Suspend User Tab */}
      {tab === 'verify' && (
        <form onSubmit={suspendUser} style={{ maxWidth: 400 }}>
          <h3 style={{ marginBottom: '1rem' }}>Suspend a User</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 500 }}>User ID</label>
            <input
              value={suspendUserId}
              onChange={e => setSuspendUserId(e.target.value)}
              placeholder="Paste user UUID here"
              style={{ display: 'block', width: '100%', padding: '8px', marginTop: 4, borderRadius: 6, border: '1px solid #ccc' }}
              required
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 500 }}>Reason</label>
            <input
              value={suspendReason}
              onChange={e => setSuspendReason(e.target.value)}
              placeholder="Reason for suspension"
              style={{ display: 'block', width: '100%', padding: '8px', marginTop: 4, borderRadius: 6, border: '1px solid #ccc' }}
              required
            />
          </div>
          <button type="submit"
            style={{ padding: '10px 24px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15 }}>
            Suspend User
          </button>
        </form>
      )}

      {/* Audit Logs Tab */}
      {tab === 'logs' && (
        <div>
          {logs.length === 0 ? (
            <p style={{ color: '#999' }}>No logs yet.</p>
          ) : logs.map(log => (
            <div key={log.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: actionColor[log.action] ? actionColor[log.action] + '20' : '#f3f4f6',
                  color: actionColor[log.action] || '#374151',
                  marginBottom: 6
                }}>
                  {log.action}
                </span>
                <p style={{ color: '#666', fontSize: 13 }}>
                  Target: {log.targetType} — <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{log.targetId}</span>
                </p>
              </div>
              <p style={{ color: '#999', fontSize: 12, whiteSpace: 'nowrap', marginLeft: 16 }}>
                {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}