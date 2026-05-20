// import { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { io } from 'socket.io-client';
// import api from '../api/axios';

// const STATUS_STEPS = [
//   'PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED'
// ];

// const STATUS_LABELS: Record<string, string> = {
//   PENDING: '🕐 Order Placed',
//   ACCEPTED: '✅ Accepted by Restaurant',
//   PREPARING: '👨‍🍳 Being Prepared',
//   READY: '📦 Ready for Pickup',
//   PICKED_UP: '🛵 Out for Delivery',
//   DELIVERED: '🎉 Delivered!'
// };

// export default function OrderSuccess() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [order, setOrder] = useState<any>(null);
//   const [status, setStatus] = useState('PENDING');

//   useEffect(() => {
//     // Fetch order details
//     api.get('/api/orders/my-orders').then(res => {
//       const found = res.data.find((o: any) => o.id === id);
//       if (found) {
//         setOrder(found);
//         setStatus(found.status);
//       }
//     });

//     // Connect Socket.IO for live updates
//     const socket = io('http://localhost:4005');
//     socket.emit('join-order', id);
//     socket.on('order-status-updated', (data: any) => {
//       if (data.orderId === id) setStatus(data.status);
//     });

//     return () => { socket.disconnect(); };
//   }, [id]);

//   const currentStep = STATUS_STEPS.indexOf(status);

//   return (
//     <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem' }}>

//       {/* Success Header */}
//       <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
//         <p style={{ fontSize: 64 }}>
//           {status === 'DELIVERED' ? '🎉' : '✅'}
//         </p>
//         <h2 style={{ marginBottom: 8 }}>
//           {status === 'DELIVERED' ? 'Order Delivered!' : 'Order Placed Successfully!'}
//         </h2>
//         <p style={{ color: '#999', fontSize: 14 }}>
//           Order ID: <span style={{ fontFamily: 'monospace' }}>{id?.slice(0, 8)}...</span>
//         </p>
//       </div>

//       {/* Live Status Tracker */}
//       <div style={{ border: '1px solid #eee', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
//         <h3 style={{ marginBottom: '1.5rem' }}>Live Order Tracking</h3>
//         {STATUS_STEPS.map((step, index) => (
//           <div key={step} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
//             {/* Circle */}
//             <div style={{
//               width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
//               background: index <= currentStep ? '#f97316' : '#eee',
//               color: index <= currentStep ? '#fff' : '#999',
//               display: 'flex', alignItems: 'center', justifyContent: 'center',
//               fontSize: 13, fontWeight: 700, marginRight: 12, marginTop: 2
//             }}>
//               {index < currentStep ? '✓' : index + 1}
//             </div>
//             {/* Label */}
//             <div>
//               <p style={{
//                 fontWeight: index === currentStep ? 700 : 400,
//                 color: index <= currentStep ? '#111' : '#999',
//                 marginBottom: 2
//               }}>
//                 {STATUS_LABELS[step]}
//               </p>
//               {index === currentStep && status !== 'DELIVERED' && (
//                 <p style={{ fontSize: 12, color: '#f97316' }}>● Live updating...</p>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Order Summary */}
//       {order && (
//         <div style={{ border: '1px solid #eee', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
//           <h3 style={{ marginBottom: '1rem' }}>Order Summary</h3>
//           <p style={{ color: '#666', marginBottom: 8 }}>
//             🏪 {order.restaurant?.name}
//           </p>
//           {order.items?.map((item: any, i: number) => (
//             <p key={i} style={{ color: '#444', fontSize: 14, marginBottom: 4 }}>
//               {item.menuItem.name} × {item.quantity} — ₹{item.price * item.quantity}
//             </p>
//           ))}
//           <div style={{ borderTop: '1px solid #eee', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
//             <span style={{ fontWeight: 600 }}>Total Paid</span>
//             <span style={{ fontWeight: 700, color: '#f97316' }}>₹{order.totalAmount}</span>
//           </div>
//           <p style={{ color: '#999', fontSize: 13, marginTop: 8 }}>📍 {order.address}</p>
//         </div>
//       )}

//       <button onClick={() => navigate('/')}
//         style={{ width: '100%', padding: '12px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
//         Back to Home
//       </button>
//     </div>
//   );
// }
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/axios';

const STEPS = ['PENDING','ACCEPTED','PREPARING','READY','PICKED_UP','DELIVERED'];
const STEP_LABEL: Record<string,string> = {
  PENDING:'Order Placed', ACCEPTED:'Accepted by Restaurant',
  PREPARING:'Being Prepared', READY:'Ready for Pickup',
  PICKED_UP:'Out for Delivery', DELIVERED:'Delivered!'
};
const STEP_ICON: Record<string,string> = {
  PENDING:'🕐', ACCEPTED:'✅', PREPARING:'👨‍🍳',
  READY:'📦', PICKED_UP:'🛵', DELIVERED:'🎉'
};

export default function OrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState('PENDING');

  useEffect(() => {
    api.get('/api/orders/my-orders').then(res => {
      const found = res.data.find((o: any) => o.id === id);
      if (found) { setOrder(found); setStatus(found.status); }
    });
    const token = localStorage.getItem('token');
    const socket = io(import.meta.env.VITE_REALTIME_URL || 'http://localhost:4005', { auth: { token } });    socket.emit('join-order', id);
    socket.on('order-status-updated', (data: any) => {
      if (data.orderId === id) setStatus(data.status);
    });
    return () => { socket.disconnect(); };
  }, [id]);

  const currentStep = STEPS.indexOf(status);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <nav className="navbar">
        <span className="navbar-logo" onClick={() => navigate('/')}>Food<span>Flow</span></span>
      </nav>
      <div className="page-sm" style={{ paddingTop: '2rem' }}>
        {/* Header */}
        <div className="card" style={{ textAlign: 'center', marginBottom: '1.25rem', padding: '2rem' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{status === 'DELIVERED' ? '🎉' : '✅'}</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
            {status === 'DELIVERED' ? 'Order Delivered!' : 'Order Confirmed!'}
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>
            Order ID: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{id?.slice(0, 8)}...</code>
          </p>
        </div>

        {/* Live tracker */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: '1.25rem' }}>🗺️ Live Order Tracking</h3>
          {STEPS.map((step, idx) => (
            <div key={step} className="status-step">
              <div className={`status-circle ${idx < currentStep ? 'done' : idx === currentStep ? 'active' : 'pending'}`}>
                {idx < currentStep ? '✓' : STEP_ICON[step]}
              </div>
              <div style={{ paddingTop: 4 }}>
                <p style={{ fontWeight: idx === currentStep ? 700 : 500, color: idx <= currentStep ? '#111827' : '#9ca3af', fontSize: 14 }}>
                  {STEP_LABEL[step]}
                </p>
                {idx === currentStep && status !== 'DELIVERED' && (
                  <p style={{ fontSize: 12, color: '#ea580c', marginTop: 2, fontWeight: 600 }}>● Live updating...</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        {order && (
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: '1rem' }}>🧾 Order Summary</h3>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 10, fontWeight: 600 }}>🏪 {order.restaurant?.name}</p>
            {order.items?.map((item: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#374151', marginBottom: 6 }}>
                <span>{item.menuItem.name} × {item.quantity}</span>
                <span style={{ fontWeight: 600 }}>₹{item.price * item.quantity}</span>
              </div>
            ))}
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>Total Paid</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: '#ea580c' }}>₹{order.totalAmount}</span>
            </div>
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 10 }}>📍 {order.address}</p>
          </div>
        )}

        <button className="btn btn-primary" onClick={() => navigate('/')}
          style={{ width: '100%', padding: '13px', fontSize: 15, fontWeight: 700 }}>
          Back to Home
        </button>
      </div>
    </div>
  );
}