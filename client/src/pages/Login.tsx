// import { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

// export default function Login() {
//   const { login } = useAuth();
//   const navigate = useNavigate();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     try {
//       await login(email, password);
//       navigate('/');
//     } catch {
//       setError('Invalid email or password');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ maxWidth: 400, margin: '100px auto', padding: '2rem', border: '1px solid #eee', borderRadius: 12 }}>
//       <h2 style={{ marginBottom: '1.5rem' }}>Login</h2>
//       {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
//       <form onSubmit={handleSubmit}>
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
//         <div style={{ marginBottom: '1.5rem' }}>
//           <label>Password</label>
//           <input
//             type="password"
//             value={password}
//             onChange={e => setPassword(e.target.value)}
//             style={{ display: 'block', width: '100%', padding: '8px', marginTop: 4, borderRadius: 6, border: '1px solid #ccc' }}
//             required
//           />
//         </div>
//         <button
//           type="submit"
//           disabled={loading}
//           style={{ width: '100%', padding: '10px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
//         >
//           {loading ? 'Logging in...' : 'Login'}
//         </button>
//       </form>
//       <p style={{ marginTop: '1rem', textAlign: 'center' }}>
//         Don't have an account? <Link to="/register">Register</Link>
//       </p>
//     </div>
//   );
// }
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🍔</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your FoodFlow account</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email address</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '11px', fontSize: 15, marginTop: 4 }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#ea580c', fontWeight: 600 }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}