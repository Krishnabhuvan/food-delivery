import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/axios';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem: { name: string };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  address: string;
  createdAt: string;
  items: OrderItem[];
  restaurant: { name: string };
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOrders = async () => {
  try {
    const res = await api.get('/api/orders/my-orders?limit=10&page=1');
    setOrders(res.data.orders); // was res.data
  } catch {
    console.error('Failed to fetch orders');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchOrders();

    const token = localStorage.getItem('token');
    const socket = io('http://localhost:4005', { auth: { token } });

    socket.on('order-status-updated', (data: any) => {
      setOrders(prev => prev.map(o =>
        o.id === data.orderId ? { ...o, status: data.status } : o
      ));
    });

    return () => { socket.disconnect(); };
  }, []);

  const statusColor: Record<string, string> = {
    PENDING: '#f59e0b',
    ACCEPTED: '#3b82f6',
    PREPARING: '#8b5cf6',
    READY: '#06b6d4',
    PICKED_UP: '#f97316',
    DELIVERED: '#22c55e',
    CANCELLED: '#ef4444'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <nav className="navbar">
        <span className="navbar-logo" onClick={() => navigate('/')}>Food<span>Flow</span></span>
      </nav>
      <div className="page-sm" style={{ paddingTop: '2rem' }}>
        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: '1.5rem' }}>My Orders</h2>

        {loading ? (
          <p style={{ color: '#9ca3af' }}>Loading...</p>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p>No orders yet</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Order Now
            </button>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <h4 style={{ fontWeight: 700 }}>{order.restaurant?.name}</h4>
                <span style={{
                  background: statusColor[order.status] || '#ccc',
                  color: '#fff', padding: '3px 10px',
                  borderRadius: 20, fontSize: 12, fontWeight: 600
                }}>
                  {order.status}
                </span>
              </div>
              {order.items.map(item => (
                <p key={item.id} style={{ color: '#6b7280', fontSize: 14, marginBottom: 4 }}>
                  {item.menuItem.name} × {item.quantity} — ₹{item.price * item.quantity}
                </p>
              ))}
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9ca3af', fontSize: 13 }}>📍 {order.address}</span>
                <span style={{ fontWeight: 700, color: '#ea580c' }}>₹{order.totalAmount}</span>
              </div>
              {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                <button
                  onClick={() => navigate(`/order-success/${order.id}`)}
                  style={{ marginTop: 10, width: '100%', padding: '8px', background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  Track Order →
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}