import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface MenuItem { id: string; name: string; description: string; price: number; category: string; isAvailable: boolean; imageUrl?: string; }
interface Restaurant { id: string; name: string; description: string; address: string; imageUrl?: string; menuItems: MenuItem[]; }

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem, updateQuantity, items, total } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/restaurants').then(res => {
      const found = res.data.find((r: Restaurant) => r.id === id);
      setRestaurant(found || null);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>;
  if (!restaurant) return <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>Restaurant not found.</div>;

  const categories = [...new Set(restaurant.menuItems.map(i => i.category))];
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  const getItemQty = (itemId: string) => items.find(i => i.id === itemId)?.quantity || 0;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: items.length > 0 ? 90 : 0 }}>
      {/* Header banner */}
      <div style={{ background: 'linear-gradient(135deg,#fff7ed,#fef3c7)', padding: '2.5rem 2rem', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <button className="back-btn" onClick={() => navigate('/')}>← Back to restaurants</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 64, height: 64, background: '#fff', borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, border: '1px solid #e5e7eb' }}>
              {restaurant.imageUrl
                ? <img src={restaurant.imageUrl} alt={restaurant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : '🍽️'}
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>{restaurant.name}</h1>
              <p style={{ color: '#6b7280', fontSize: 14 }}>{restaurant.description}</p>
              <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 2 }}>📍 {restaurant.address}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="page">
        {categories.map(cat => (
          <div key={cat} style={{ marginBottom: '2.5rem' }}>
            <span className="section-title">{cat}</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 14, marginTop: '0.5rem' }}>
              {restaurant.menuItems.filter(i => i.category === cat && i.isAvailable).map(item => {
                const qty = getItemQty(item.id);
                return (
                  <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 0, overflow: 'hidden' }}>
                    {/* Item image */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{ width: '100%', height: 140, objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: 140, background: 'linear-gradient(135deg,#fff7ed,#fef3c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                        🍴
                      </div>
                    )}
                    <div style={{ padding: '0.75rem' }}>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{item.name}</h4>
                        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>{item.description}</p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#ea580c' }}>₹{item.price}</span>
                        {qty === 0 ? (
                          <button className="btn btn-outline-primary btn-sm"
                            onClick={() => {
                              if (!user) { navigate('/login'); return; }
                              addItem({ id: item.id, name: item.name, price: item.price, quantity: 1, restaurantId: restaurant.id });
                            }}>
                            + Add
                          </button>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button className="btn btn-sm" style={{ padding: '4px 10px', fontWeight: 700 }}
                              onClick={() => updateQuantity(item.id, qty - 1)}>−</button>
                            <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{qty}</span>
                            <button className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontWeight: 700 }}
                              onClick={() => addItem({ id: item.id, name: item.name, price: item.price, quantity: 1, restaurantId: restaurant.id })}>+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <div className="cart-bar">
          <span style={{ fontSize: 15, fontWeight: 600 }}>{cartCount} item{cartCount > 1 ? 's' : ''} · ₹{total}</span>
          <button className="cart-bar-btn" onClick={() => navigate('/cart')}>View Cart →</button>
        </div>
      )}
    </div>
  );
}