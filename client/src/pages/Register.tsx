// import { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

// export default function Register() {
//   const { register } = useAuth();
//   const navigate = useNavigate();
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [role, setRole] = useState('CUSTOMER');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     try {
//       await register(name, email, password, role);
//       navigate('/');
//     } catch {
//       setError('Registration failed. Email may already exist.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ maxWidth: 400, margin: '100px auto', padding: '2rem', border: '1px solid #eee', borderRadius: 12 }}>
//       <h2 style={{ marginBottom: '1.5rem' }}>Register</h2>
//       {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
//       <form onSubmit={handleSubmit}>
//         <div style={{ marginBottom: '1rem' }}>
//           <label>Name</label>
//           <input
//             type="text"
//             value={name}
//             onChange={e => setName(e.target.value)}
//             style={{ display: 'block', width: '100%', padding: '8px', marginTop: 4, borderRadius: 6, border: '1px solid #ccc' }}
//             required
//           />
//         </div>
//         <div style={{ marginBottom: '1rem' }}>
//           <label>Email</label>
//           <input
//             type="email"
//             value={email}
//             onChange={e => setEmail(e.target.value)}
//             style={{ display: 'block', width: '100%', padding: '8px', marginTop: 4, borderRadius: 6, border: '1px solid #ccc' }}
//             required
//           />
//         </div>
//         <div style={{ marginBottom: '1rem' }}>
//           <label>Password</label>
//           <input
//             type="password"
//             value={password}
//             onChange={e => setPassword(e.target.value)}
//             style={{ display: 'block', width: '100%', padding: '8px', marginTop: 4, borderRadius: 6, border: '1px solid #ccc' }}
//             required
//           />
//         </div>
//         <div style={{ marginBottom: '1.5rem' }}>
//           <label>Role</label>
//           <select
//             value={role}
//             onChange={e => setRole(e.target.value)}
//             style={{ display: 'block', width: '100%', padding: '8px', marginTop: 4, borderRadius: 6, border: '1px solid #ccc' }}
//           >
//             <option value="CUSTOMER">Customer</option>
//             <option value="RESTAURANT">Restaurant</option>
//             <option value="RIDER">Rider</option>
//           </select>
//         </div>
//         <button
//           type="submit"
//           disabled={loading}
//           style={{ width: '100%', padding: '10px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
//         >
//           {loading ? 'Registering...' : 'Register'}
//         </button>
//       </form>
//       <p style={{ marginTop: '1rem', textAlign: 'center' }}>
//         Already have an account? <Link to="/login">Login</Link>
//       </p>
//     </div>
//   );
// }
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CUSTOMER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: 'CUSTOMER', label: '🛒 Customer', desc: 'Order food from restaurants' },
    { value: 'RESTAURANT', label: '🍽️ Restaurant', desc: 'Manage your restaurant' },
    { value: 'RIDER', label: '🛵 Rider', desc: 'Deliver food orders' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate('/');
    } catch {
      setError('Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🍔</div>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Join FoodFlow today</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Full name</label>
            <input className="input" type="text" placeholder="Krishna Bhuvan"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="input-group">
            <label className="input-label">Email address</label>
            <input className="input" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input className="input" type="password" placeholder="Min. 6 characters"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>

          <div className="input-group">
            <label className="input-label">I am a...</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {roles.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: r.value })}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: 8, cursor: 'pointer',
                    border: form.role === r.value ? '2px solid #ea580c' : '1.5px solid #e5e7eb',
                    background: form.role === r.value ? '#fff7ed' : '#fff',
                    color: form.role === r.value ? '#ea580c' : '#6b7280',
                    fontSize: 12, fontWeight: 600, textAlign: 'center', transition: 'all 0.15s'
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{r.label.split(' ')[0]}</div>
                  <div>{r.label.split(' ')[1]}</div>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', padding: '11px', fontSize: 15, marginTop: 4 }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#ea580c', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}