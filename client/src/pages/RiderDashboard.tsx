import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface Order { id: string; status: string; totalAmount: number; address: string; restaurant: { name: string }; items: { quantity: number; menuItem: { name: string } }[]; }

export default function RiderDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<Order[]>([]);
  const [tab, setTab] = useState<'available' | 'deliveries' | 'profile'>('available');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  const fetchReadyOrders = async () => {
  try {
    const res = await api.get('/api/orders/ready?limit=20&page=1');
    setReadyOrders(res.data.orders); // was res.data
  } catch {}
};

const fetchMyDeliveries = async () => {
  try {
    const res = await api.get('/api/orders/my-deliveries?limit=10&page=1');
    setMyDeliveries(res.data.orders); // was res.data
  } catch {}
};

  useEffect(() => {
    Promise.all([
      api.get('/api/riders/profile').then(r => setProfile(r.data)).catch(() => setProfile(null)),
      fetchReadyOrders(),
      fetchMyDeliveries(),
    ]).finally(() => setPageLoading(false));

    // Socket.IO — auto refresh when order becomes READY
    const token = localStorage.getItem('token');
const socket = io(import.meta.env.VITE_REALTIME_URL || 'http://localhost:4005', { auth: { token } });
    socket.on('order-status-updated', (data: any) => {
      if (data.status === 'READY') fetchReadyOrders();
      if (data.status === 'PICKED_UP' || data.status === 'DELIVERED') fetchMyDeliveries();
    });

    return () => { socket.disconnect(); };
  }, []);

  const createProfile = async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/riders/profile', { name: user?.name || 'Rider', phone: '9999999999' });
      setProfile(res.data);
    } catch (err: any) {
      if (err.response?.status === 409) {
        const res = await api.get('/api/riders/profile');
        setProfile(res.data);
      } else {
        setMessage('Failed to create profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    const res = await api.patch('/api/riders/toggle-availability');
    setProfile((p: any) => ({ ...p, isAvailable: res.data.isAvailable }));
  };

  const acceptDelivery = async (orderId: string) => {
    try {
      await api.patch(`/api/orders/${orderId}/accept`);
      setReadyOrders(prev => prev.filter(o => o.id !== orderId));
      await fetchMyDeliveries();
      setTab('deliveries');
    } catch { setMessage('Failed to accept delivery.'); }
  };

  const completeDelivery = async (orderId: string) => {
    try {
      await api.patch(`/api/orders/${orderId}/complete`);
      await fetchMyDeliveries();
    } catch { setMessage('Failed to complete delivery.'); }
  };

  if (pageLoading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <nav className="navbar">
        <span className="navbar-logo" onClick={() => navigate('/')}>Food<span>Flow</span></span>
        <div className="navbar-actions">
          {profile && (
            <span className={`badge ${profile.isAvailable ? 'badge-green' : 'badge-red'}`}>
              {profile.isAvailable ? '● Online' : '● Offline'}
            </span>
          )}
          <button className="btn btn-sm" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </div>
      </nav>

      <div className="page" style={{ maxWidth: 680 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>🛵 Rider Dashboard</h2>
        </div>

        {message && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{message}</div>}

        {!profile ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛵</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Setup your rider profile</h3>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Create a profile to start accepting deliveries</p>
            <button className="btn btn-primary" onClick={createProfile} disabled={loading}>
              {loading ? 'Creating...' : 'Create Profile'}
            </button>
          </div>
        ) : (
          <>
            <div className="stat-row">
              <div className="stat-card">
                <div className="stat-num">{readyOrders.length}</div>
                <div className="stat-label">Available Orders</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{myDeliveries.filter(o => o.status === 'PICKED_UP').length}</div>
                <div className="stat-label">Active Deliveries</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{myDeliveries.filter(o => o.status === 'DELIVERED').length}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>

            <div className="tabs" style={{ marginBottom: '1.5rem' }}>
              <button className={`tab ${tab === 'available' ? 'active' : ''}`} onClick={() => setTab('available')}>
                Available ({readyOrders.length})
              </button>
              <button className={`tab ${tab === 'deliveries' ? 'active' : ''}`} onClick={() => setTab('deliveries')}>
                My Deliveries
              </button>
              <button className={`tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
                Profile
              </button>
            </div>

            {tab === 'available' && (
              readyOrders.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">📦</div><p>No orders available right now</p></div>
              ) : readyOrders.map(order => (
                <div key={order.id} className="card" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h4 style={{ fontWeight: 700 }}>{order.restaurant?.name}</h4>
                    <span style={{ fontWeight: 800, color: '#ea580c', fontSize: 16 }}>₹{order.totalAmount}</span>
                  </div>
                  {order.items.map((item, i) => (
                    <p key={i} style={{ fontSize: 13, color: '#6b7280' }}>{item.menuItem.name} × {item.quantity}</p>
                  ))}
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: '8px 0' }}>📍 {order.address}</p>
                  <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}
                    onClick={() => acceptDelivery(order.id)}>Accept Delivery</button>
                </div>
              ))
            )}

            {tab === 'deliveries' && (
              myDeliveries.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">🛵</div><p>No deliveries yet</p></div>
              ) : myDeliveries.map(order => (
                <div key={order.id} className="card" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h4 style={{ fontWeight: 700 }}>{order.restaurant?.name}</h4>
                    <span className={`badge ${order.status === 'DELIVERED' ? 'badge-green' : 'badge-orange'}`}>{order.status}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>📍 {order.address}</p>
                  <p style={{ fontWeight: 800, color: '#ea580c' }}>₹{order.totalAmount}</p>
                  {order.status === 'PICKED_UP' && (
                    <button className="btn btn-success" style={{ width: '100%', marginTop: 10 }}
                      onClick={() => completeDelivery(order.id)}>Mark as Delivered</button>
                  )}
                </div>
              ))
            )}

            {tab === 'profile' && (
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.5rem' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, border: '2px solid #ea580c' }}>🛵</div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: 17 }}>{profile.name}</h3>
                    <p style={{ color: '#6b7280', fontSize: 14 }}>📞 {profile.phone}</p>
                  </div>
                </div>
                <div className="divider" />
                <div style={{ display: 'flex', gap: 10, marginTop: '1rem' }}>
                  <button className={`btn ${profile.isAvailable ? 'btn-danger' : 'btn-success'}`}
                    style={{ flex: 1 }} onClick={toggleAvailability}>
                    {profile.isAvailable ? '● Go Offline' : '● Go Online'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}