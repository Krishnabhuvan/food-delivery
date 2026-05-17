// import { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import api from '../api/axios';
// import { useAuth } from '../context/AuthContext';

// interface MenuItem {
//   id: string;
//   name: string;
//   price: number;
//   category: string;
// }

// interface Restaurant {
//   id: string;
//   name: string;
//   description: string;
//   address: string;
//   menuItems: MenuItem[];
// }

// export default function Home() {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();
//   const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
//   const [search, setSearch] = useState('');
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchRestaurants();
//   }, []);

//   const fetchRestaurants = async (q = '') => {
//     try {
//       const res = await api.get(`/api/restaurants${q ? `?search=${q}` : ''}`);
//       setRestaurants(res.data);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault();
//     fetchRestaurants(search);
//   };

//   const getDashboardLink = () => {
//     if (!user) return null;
//     const links: Record<string, string> = {
//       RESTAURANT: '/restaurant-dashboard',
//       RIDER: '/rider-dashboard',
//       ADMIN: '/admin-dashboard'
//     };
//     return links[user.role] || null;
//   };

//   return (
//     <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
//       {/* Navbar */}
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
//         <h1 style={{ color: '#f97316' }}>🍔 FoodFlow</h1>
//         <div style={{ display: 'flex', gap: 12 }}>
//           {user ? (
//   <>
//     <span style={{ padding: '8px 12px' }}>Hi, {user.name}</span>
//     {user.role === 'CUSTOMER' && (
//       <button onClick={() => navigate('/orders')}
//         style={{ padding: '8px 16px', background: '#fff', border: '1px solid #f97316', color: '#f97316', borderRadius: 6, cursor: 'pointer' }}>
//         My Orders
//       </button>
//     )}
//     {getDashboardLink() && (
//       <button onClick={() => navigate(getDashboardLink()!)}
//         style={{ padding: '8px 16px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
//         Dashboard
//       </button>
//     )}
//     <button onClick={() => { logout(); navigate('/login'); }}
//       style={{ padding: '8px 16px', background: '#eee', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
//       Logout
//     </button>
//   </>
// ) : (
//             <>
//               <button onClick={() => navigate('/login')}
//                 style={{ padding: '8px 16px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
//                 Login
//               </button>
//               <button onClick={() => navigate('/register')}
//                 style={{ padding: '8px 16px', background: '#eee', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
//                 Register
//               </button>
//             </>
//           )}
//         </div>
//       </div>

//       {/* Search */}
//       <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: '2rem' }}>
//         <input
//           value={search}
//           onChange={e => setSearch(e.target.value)}
//           placeholder="Search restaurants..."
//           style={{ flex: 1, padding: '10px', borderRadius: 6, border: '1px solid #ccc' }}
//         />
//         <button type="submit"
//           style={{ padding: '10px 20px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
//           Search
//         </button>
//       </form>

//       {/* Restaurant Grid */}
//       {loading ? (
//         <p>Loading restaurants...</p>
//       ) : restaurants.length === 0 ? (
//         <p>No restaurants found.</p>
//       ) : (
//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
//           {restaurants.map(r => (
//             <div key={r.id}
//               onClick={() => navigate(`/restaurant/${r.id}`)}
//               style={{ border: '1px solid #eee', borderRadius: 12, padding: '1rem', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
//               onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
//               onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
//             >
//               <h3 style={{ marginBottom: 4 }}>{r.name}</h3>
//               <p style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>{r.description}</p>
//               <p style={{ color: '#999', fontSize: 13 }}>📍 {r.address}</p>
//               <p style={{ color: '#f97316', fontSize: 13, marginTop: 8 }}>{r.menuItems.length} items</p>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface Restaurant {
  id: string; name: string; description: string;
  address: string; menuItems: { id: string }[];
}

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRestaurants(); }, []);

  const fetchRestaurants = async (q = '') => {
    try {
      const res = await api.get(`/api/restaurants${q ? `?search=${q}` : ''}`);
      setRestaurants(res.data);
    } catch { console.error('Failed to fetch'); }
    finally { setLoading(false); }
  };

  const dashLink: Record<string, string> = {
    RESTAURANT: '/restaurant-dashboard',
    RIDER: '/rider-dashboard',
    ADMIN: '/admin-dashboard',
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="navbar">
        <span className="navbar-logo" onClick={() => navigate('/')}>Food<span>Flow</span></span>
        <div className="navbar-actions">
          {user ? (
            <>
              <span className="navbar-user">Hi, {user.name.split(' ')[0]} 👋</span>
              {user.role === 'CUSTOMER' && (
                <button className="btn btn-sm" onClick={() => navigate('/orders')}>My Orders</button>
              )}
              {dashLink[user.role] && (
                <button className="btn btn-primary btn-sm" onClick={() => navigate(dashLink[user.role])}>
                  Dashboard
                </button>
              )}
              <button className="btn btn-sm" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
            </>
          ) : (
            <>
              <button className="btn btn-sm" onClick={() => navigate('/login')}>Sign in</button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>Register</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '3rem 2rem 2.5rem' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            Order food you <span style={{ color: '#ea580c' }}>love</span> 🍔
          </h1>
          <p style={{ color: '#6b7280', fontSize: 16, marginBottom: '1.5rem' }}>
            Fresh meals from local restaurants, delivered to your door
          </p>
          <form onSubmit={e => { e.preventDefault(); fetchRestaurants(search); }}
            style={{ display: 'flex', gap: 10, maxWidth: 500 }}>
            <input className="input" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search restaurants or cuisines..." />
            <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap', padding: '10px 22px' }}>
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Grid */}
      <div className="page">
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: '1.25rem', fontWeight: 500 }}>
          {loading ? 'Loading...' : `${restaurants.length} restaurant${restaurants.length !== 1 ? 's' : ''} available`}
        </p>
        {!loading && restaurants.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🍽️</div>
            <p>No restaurants found. Try a different search.</p>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px,1fr))', gap: 16 }}>
          {restaurants.map(r => (
            <div key={r.id} className="card card-hover" onClick={() => navigate(`/restaurant/${r.id}`)}>
              <div style={{ width: '100%', height: 120, background: 'linear-gradient(135deg,#fff7ed,#fef3c7)', borderRadius: 8, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                🍽️
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{r.name}</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>{r.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-green">● Open</span>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{r.menuItems.length} items</span>
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>📍 {r.address}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}