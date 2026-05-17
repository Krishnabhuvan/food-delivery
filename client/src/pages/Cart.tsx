// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useCart } from '../context/CartContext';
// import api from '../api/axios';

// declare global {
//   interface Window {
//     Razorpay: any;
//   }
// }

// export default function Cart() {
//   const { items, updateQuantity, removeItem, clearCart, total, restaurantId } = useCart();
//   const navigate = useNavigate();
//   const [address, setAddress] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const handlePayment = async () => {
//     if (!address) { setError('Please enter delivery address'); return; }
//     setLoading(true);
//     setError('');

//     try {
//       // Step 1 — Create Razorpay order
//       const orderRes = await api.post('/api/payment/create-order', {
//         amount: total,
//         orderId: `order_${Date.now()}`
//       });

//       const { razorpayOrderId, amount, currency } = orderRes.data;

//       // Step 2 — Open Razorpay popup
//       const options = {
//         key: import.meta.env.VITE_RAZORPAY_KEY_ID,
//         amount,
//         currency,
//         name: 'FoodFlow',
//         description: 'Food Delivery Payment',
//         order_id: razorpayOrderId,
//         handler: async (response: any) => {
//           try {
//             // Step 3 — Verify payment
//             await api.post('/api/payment/verify', {
//               razorpayOrderId: response.razorpay_order_id,
//               razorpayPaymentId: response.razorpay_payment_id,
//               razorpaySignature: response.razorpay_signature
//             });

//             // Step 4 — Place order after payment success
//            // Step 4 — Place order after payment success
//           const placedOrder = await api.post('/api/orders', {
//             restaurantId,
//             address,
//             items: items.map(i => ({ menuItemId: i.id, quantity: i.quantity }))
//           });

//           clearCart();
//           navigate(`/order-success/${placedOrder.data.id}`);
//           } catch {
//             setError('Payment verified but order failed. Contact support.');
//           }
//         },
//         prefill: {
//           name: 'Customer',
//           email: 'customer@test.com'
//         },
//         theme: { color: '#f97316' },
//         modal: {
//           ondismiss: () => {
//             setLoading(false);
//             setError('Payment cancelled.');
//           }
//         }
//       };

//       const rzp = new window.Razorpay(options);
//       rzp.open();
//       setLoading(false);

//     } catch {
//       setError('Failed to initiate payment. Try again.');
//       setLoading(false);
//     }
//   };

//   if (items.length === 0) return (
//     <div style={{ maxWidth: 600, margin: '100px auto', textAlign: 'center' }}>
//       <p style={{ fontSize: 48 }}>🛒</p>
//       <h2>Your cart is empty</h2>
//       <button onClick={() => navigate('/')}
//         style={{ marginTop: '1rem', padding: '10px 24px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
//         Browse Restaurants
//       </button>
//     </div>
//   );

//   return (
//     <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem' }}>
//       <button onClick={() => navigate(-1)}
//         style={{ marginBottom: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#f97316', fontSize: 16 }}>
//         ← Back
//       </button>
//       <h2 style={{ marginBottom: '1.5rem' }}>Your Cart</h2>

//       {items.map(item => (
//         <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #eee' }}>
//           <div style={{ flex: 1 }}>
//             <p style={{ fontWeight: 500, marginBottom: 2 }}>{item.name}</p>
//             <p style={{ color: '#f97316', fontSize: 14 }}>₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}</p>
//           </div>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//             <button
//               onClick={() => updateQuantity(item.id, item.quantity - 1)}
//               style={{
//                 width: 32, height: 32, borderRadius: '50%',
//                 border: '2px solid #f97316', cursor: 'pointer',
//                 background: '#fff', color: '#f97316',
//                 fontSize: 18, fontWeight: 700,
//                 display: 'flex', alignItems: 'center', justifyContent: 'center'
//               }}>
//               −
//             </button>
//             <span style={{ fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
//             <button
//               onClick={() => updateQuantity(item.id, item.quantity + 1)}
//               style={{
//                 width: 32, height: 32, borderRadius: '50%',
//                 border: '2px solid #f97316', cursor: 'pointer',
//                 background: '#f97316', color: '#fff',
//                 fontSize: 18, fontWeight: 700,
//                 display: 'flex', alignItems: 'center', justifyContent: 'center'
//               }}>
//               +
//             </button>
//             <button
//               onClick={() => removeItem(item.id)}
//               style={{
//                 marginLeft: 8, color: '#ef4444',
//                 background: 'none', border: 'none',
//                 cursor: 'pointer', fontSize: 18
//               }}>
//               🗑
//             </button>
//           </div>
//         </div>
//       ))}

//       {/* Total */}
//       <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fff7ed', borderRadius: 8 }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//           <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
//           <span style={{ fontWeight: 600, color: '#f97316' }}>₹{total}</span>
//         </div>
//       </div>

//       {/* Address */}
//       <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
//         <label style={{ fontWeight: 500 }}>Delivery Address</label>
//         <input
//           value={address}
//           onChange={e => setAddress(e.target.value)}
//           placeholder="Enter your full delivery address"
//           style={{ display: 'block', width: '100%', padding: '10px', marginTop: 6, borderRadius: 6, border: '1px solid #ccc' }}
//         />
//       </div>

//       {error && (
//         <p style={{ color: 'red', marginBottom: '1rem', padding: '10px', background: '#fef2f2', borderRadius: 6 }}>
//           {error}
//         </p>
//       )}

//       <button onClick={handlePayment} disabled={loading}
//         style={{
//           width: '100%', padding: '14px',
//           background: '#f97316', color: '#fff',
//           border: 'none', borderRadius: 8,
//           cursor: loading ? 'not-allowed' : 'pointer',
//           fontSize: 16, fontWeight: 600,
//           opacity: loading ? 0.7 : 1
//         }}>
//         {loading ? 'Initiating Payment...' : `Pay ₹${total} & Place Order`}
//       </button>

//       <p style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: '1rem' }}>
//         🔒 Secured by Razorpay
//       </p>
//     </div>
//   );
// }
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../api/axios';

declare global { interface Window { Razorpay: any; } }

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart, total, restaurantId } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    if (!address.trim()) { setError('Please enter your delivery address'); return; }
    setLoading(true); setError('');
    try {
      const orderRes = await api.post('/api/payment/create-order', { amount: total, orderId: `order_${Date.now()}` });
      const { razorpayOrderId, amount, currency } = orderRes.data;
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
      script.onload = () => {
        const rzp = new window.Razorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount, currency, order_id: razorpayOrderId,
          name: 'FoodFlow', description: 'Food Order',
          handler: async () => {
            const placedOrder = await api.post('/api/orders', {
              restaurantId, address,
              items: items.map(i => ({ menuItemId: i.id, quantity: i.quantity }))
            });
            clearCart();
            navigate(`/order-success/${placedOrder.data.id}`);
          },
          theme: { color: '#ea580c' }
        });
        rzp.open();
      };
    } catch { setError('Payment failed. Please try again.'); }
    finally { setLoading(false); }
  };

  if (items.length === 0) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 60 }}>🛒</div>
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>Your cart is empty</h2>
      <p style={{ color: '#6b7280', marginBottom: 8 }}>Add some delicious food to get started</p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>Browse Restaurants</button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <nav className="navbar">
        <span className="navbar-logo" onClick={() => navigate('/')}>Food<span>Flow</span></span>
      </nav>
      <div className="page-sm" style={{ paddingTop: '2rem' }}>
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: '1.5rem' }}>Your Cart</h2>

        <div className="card" style={{ marginBottom: '1.25rem' }}>
          {items.map((item, idx) => (
            <div key={item.id}>
              {idx > 0 && <div className="divider" style={{ margin: '0.75rem 0' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</p>
                  <p style={{ fontSize: 13, color: '#ea580c', fontWeight: 600 }}>₹{item.price} × {item.quantity}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="btn btn-sm" style={{ padding: '4px 10px', fontWeight: 700 }}
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                  <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                  <button className="btn btn-sm" style={{ padding: '4px 10px', fontWeight: 700 }}
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  <button className="btn btn-sm" style={{ color: '#dc2626', borderColor: '#fecaca', marginLeft: 4 }}
                    onClick={() => removeItem(item.id)}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#6b7280', fontSize: 14 }}>Subtotal</span>
            <span style={{ fontWeight: 600 }}>₹{total}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#6b7280', fontSize: 14 }}>Delivery fee</span>
            <span style={{ fontWeight: 600, color: '#16a34a' }}>Free</span>
          </div>
          <div className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: '#ea580c' }}>₹{total}</span>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="input-group">
            <label className="input-label">📍 Delivery Address</label>
            <textarea className="input" value={address} onChange={e => setAddress(e.target.value)}
              placeholder="Enter your full delivery address..." rows={3}
              style={{ resize: 'none', paddingTop: 10 }} />
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <button className="btn btn-primary" onClick={handlePayment} disabled={loading}
          style={{ width: '100%', padding: '13px', fontSize: 16, fontWeight: 700 }}>
          {loading ? 'Processing...' : `Pay ₹${total} →`}
        </button>
      </div>
    </div>
  );
}