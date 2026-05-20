import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
const CLOUDINARY_CLOUD_NAME = 'dpc1bqc11';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  isAvailable: boolean;
  imageUrl?: string;
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  address: string;
  items: { quantity: number; menuItem: { name: string } }[];
}

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  isVerified: boolean;
  isOpen: boolean;
  imageUrl?: string;
  menuItems: MenuItem[];
}

export default function RestaurantDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'orders' | 'menu' | 'add'>('orders');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '' });
  const [itemImage, setItemImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [setupForm, setSetupForm] = useState({ name: '', description: '', address: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Edit state
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', category: '' });
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Restaurant image upload
  const [restaurantImage, setRestaurantImage] = useState<File | null>(null);
  const [restaurantImageUploading, setRestaurantImageUploading] = useState(false);

  useEffect(() => {
    api.get('/api/restaurants/me')
      .then(res => {
        setRestaurant(res.data);
        setMenuItems(res.data.menuItems);
        fetchOrders();
      })
      .catch(() => setRestaurant(null))
      .finally(() => setPageLoading(false));

    const token = localStorage.getItem('token');
    const socket = io(import.meta.env.VITE_REALTIME_URL || 'http://localhost:4005', { auth: { token } });
    socket.on('new-order', () => { fetchOrders(); });
    socket.on('order-status-updated', () => { fetchOrders(); });
    return () => { socket.disconnect(); };
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/api/orders/restaurant-orders?limit=10&page=1');
      setOrders(res.data.orders);
    } catch {}
  };

  const fetchMenu = async () => {
    try {
      const res = await api.get('/api/restaurants/me');
      setMenuItems(res.data.menuItems);
      setRestaurant(res.data);
    } catch {
      console.error('Failed to fetch menu');
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.url;
  };

  const createRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupLoading(true);
    setMessage('');
    try {
      await api.post('/api/restaurants', setupForm);
      const res = await api.get('/api/restaurants/me');
      setRestaurant(res.data);
      setMenuItems(res.data.menuItems);
      fetchOrders();
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      if (errors) {
        setMessage(Object.values(errors).flat().join(', '));
      } else {
        setMessage(err.response?.data?.message || 'Failed to create restaurant.');
      }
    } finally {
      setSetupLoading(false);
    }
  };

  const addMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploading(true);
    setMessage('');
    try {
      let imageUrl = '';
      if (itemImage) {
        imageUrl = await uploadImage(itemImage);
      }
      await api.post('/api/menu', {
        ...form,
        price: parseFloat(form.price),
        imageUrl
      });
      setMessage('Menu item added!');
      setForm({ name: '', description: '', price: '', category: '' });
      setItemImage(null);
      fetchMenu();
    } catch {
      setMessage('Failed to add item.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      category: item.category
    });
    setEditImage(null);
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    setEditLoading(true);
    try {
      let imageUrl = editingItem.imageUrl || '';
      if (editImage) {
        imageUrl = await uploadImage(editImage);
      }
      await api.patch(`/api/menu/${editingItem.id}`, {
        ...editForm,
        price: parseFloat(editForm.price),
        imageUrl
      });
      setEditingItem(null);
      fetchMenu();
    } catch {
      alert('Failed to update item.');
    } finally {
      setEditLoading(false);
    }
  };

  const deleteMenuItem = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/api/menu/${id}`);
      fetchMenu();
    } catch {
      alert('Failed to delete item.');
    }
  };

  const uploadRestaurantImage = async () => {
    if (!restaurantImage) return;
    setRestaurantImageUploading(true);
    try {
      const imageUrl = await uploadImage(restaurantImage);
      await api.patch('/api/restaurants/me', { imageUrl });
      setRestaurantImage(null);
      fetchMenu();
      setMessage('Restaurant image updated!');
    } catch {
      setMessage('Failed to upload restaurant image.');
    } finally {
      setRestaurantImageUploading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch {
      console.error('Failed to update status');
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

  if (pageLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Loading...</p>
    </div>
  );

  if (!restaurant) return (
    <div style={{ maxWidth: 500, margin: '100px auto', padding: '2rem', border: '1px solid #eee', borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Setup Your Restaurant</h2>
        <button onClick={() => { logout(); navigate('/login'); }}
          style={{ padding: '6px 14px', background: '#eee', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Logout
        </button>
      </div>
      {message && <p style={{ color: 'red', marginBottom: '1rem' }}>{message}</p>}
      <form onSubmit={createRestaurant}>
        {[
          { field: 'name', placeholder: 'Restaurant name' },
          { field: 'description', placeholder: 'Short description' },
          { field: 'address', placeholder: 'Full address' },
          { field: 'phone', placeholder: 'Phone number' }
        ].map(({ field, placeholder }) => (
          <div key={field} style={{ marginBottom: '1rem' }}>
            <label style={{ textTransform: 'capitalize', fontWeight: 500 }}>{field}</label>
            <input
              value={setupForm[field as keyof typeof setupForm]}
              onChange={e => setSetupForm({ ...setupForm, [field]: e.target.value })}
              placeholder={placeholder}
              style={{ display: 'block', width: '100%', padding: '8px', marginTop: 4, borderRadius: 6, border: '1px solid #ccc' }}
              required
            />
          </div>
        ))}
        <button type="submit" disabled={setupLoading}
          style={{ width: '100%', padding: '10px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15 }}>
          {setupLoading ? 'Creating...' : 'Create Restaurant'}
        </button>
      </form>
      <p style={{ marginTop: '1rem', color: '#999', fontSize: 13, textAlign: 'center' }}>
        Note: Your restaurant will be visible after admin verification.
      </p>
    </div>
  );

  if (restaurant && !restaurant.isVerified) return (
    <div style={{ maxWidth: 500, margin: '100px auto', padding: '2rem', border: '1px solid #eee', borderRadius: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
      <h2 style={{ marginBottom: 8 }}>Pending Verification</h2>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Your restaurant <strong>{restaurant.name}</strong> is under review.
      </p>
      <button onClick={() => { logout(); navigate('/login'); }}
        style={{ padding: '8px 20px', background: '#eee', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
        Logout
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>

      {/* Edit Modal */}
      {editingItem && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', width: 400, maxWidth: '90vw' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Edit Menu Item</h3>
            {[
              { field: 'name', placeholder: 'Item name', type: 'text' },
              { field: 'description', placeholder: 'Description', type: 'text' },
              { field: 'price', placeholder: 'Price', type: 'number' },
              { field: 'category', placeholder: 'Category', type: 'text' }
            ].map(({ field, placeholder, type }) => (
              <div key={field} style={{ marginBottom: '1rem' }}>
                <label style={{ textTransform: 'capitalize', fontWeight: 500, fontSize: 13 }}>{field}</label>
                <input
                  value={editForm[field as keyof typeof editForm]}
                  onChange={e => setEditForm({ ...editForm, [field]: e.target.value })}
                  placeholder={placeholder}
                  type={type}
                  style={{ display: 'block', width: '100%', padding: '8px', marginTop: 4, borderRadius: 6, border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 500, fontSize: 13 }}>
                {editingItem.imageUrl ? 'Replace Image (optional)' : 'Add Image (optional)'}
              </label>
              {editingItem.imageUrl && !editImage && (
                <img src={editingItem.imageUrl} alt="current"
                  style={{ display: 'block', width: 80, height: 80, objectFit: 'cover', borderRadius: 8, marginTop: 6, marginBottom: 6 }} />
              )}
              <input type="file" accept="image/*"
                onChange={e => setEditImage(e.target.files?.[0] || null)}
                style={{ display: 'block', marginTop: 6 }} />
              {editImage && (
                <img src={URL.createObjectURL(editImage)} alt="preview"
                  style={{ marginTop: 8, width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveEdit} disabled={editLoading}
                style={{ flex: 1, padding: '10px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditingItem(null)}
                style={{ flex: 1, padding: '10px', background: '#eee', color: '#333', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2>🍽️ {restaurant.name}</h2>
        <button onClick={() => { logout(); navigate('/login'); }}
          style={{ padding: '8px 16px', background: '#eee', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      {/* Restaurant Cover Image */}
      <div style={{ marginBottom: '1.5rem' }}>
        {restaurant.imageUrl ? (
          <img src={restaurant.imageUrl} alt="Restaurant cover"
            style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, marginBottom: 8 }} />
        ) : (
          <div style={{ width: '100%', height: 100, background: '#f3f4f6', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, color: '#9ca3af', fontSize: 14 }}>
            No cover image
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="file" accept="image/*"
            onChange={e => setRestaurantImage(e.target.files?.[0] || null)}
            style={{ fontSize: 13 }} />
          {restaurantImage && (
            <button onClick={uploadRestaurantImage} disabled={restaurantImageUploading}
              style={{ padding: '6px 14px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>
              {restaurantImageUploading ? 'Uploading...' : 'Upload Cover'}
            </button>
          )}
        </div>
      </div>

      {/* Status badges + Toggle Open */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <span style={{
          padding: '4px 10px', borderRadius: 20, fontSize: 12,
          background: restaurant.isVerified ? '#dcfce7' : '#fef9c3',
          color: restaurant.isVerified ? '#16a34a' : '#ca8a04'
        }}>
          {restaurant.isVerified ? '✔ Verified' : '⏳ Pending verification'}
        </span>
        <span style={{
          padding: '4px 10px', borderRadius: 20, fontSize: 12,
          background: restaurant.isOpen ? '#dcfce7' : '#fee2e2',
          color: restaurant.isOpen ? '#16a34a' : '#dc2626'
        }}>
          {restaurant.isOpen ? '🟢 Open' : '🔴 Closed'}
        </span>
        <button
          onClick={async () => {
            if (!window.confirm(`Are you sure you want to ${restaurant.isOpen ? 'close' : 'open'} your restaurant?`)) return;
            try {
              const res = await api.patch('/api/restaurants/toggle-open');
              setRestaurant(prev => prev ? { ...prev, isOpen: res.data.isOpen } : prev);
            } catch {
              setMessage('Failed to toggle status.');
            }
          }}
          style={{
            padding: '4px 14px', fontSize: 12,
            background: restaurant.isOpen ? '#ef4444' : '#22c55e',
            color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer'
          }}>
          {restaurant.isOpen ? 'Close Restaurant' : 'Open Restaurant'}
        </button>
      </div>

      {message && (
        <p style={{ color: message.toLowerCase().includes('fail') ? 'red' : '#22c55e', marginBottom: '1rem' }}>
          {message}
        </p>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '2rem' }}>
        <button style={tabStyle('orders')} onClick={() => setTab('orders')}>
          Orders {orders.length > 0 && `(${orders.length})`}
        </button>
        <button style={tabStyle('menu')} onClick={() => setTab('menu')}>
          Menu Items {menuItems.length > 0 && `(${menuItems.length})`}
        </button>
        <button style={tabStyle('add')} onClick={() => setTab('add')}>+ Add Item</button>
      </div>

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <p style={{ color: '#999' }}>No orders yet.</p>
          ) : orders.map(order => (
            <div key={order.id} style={{ border: '1px solid #eee', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 600 }}>₹{order.totalAmount}</span>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, background: '#fff7ed', color: '#f97316' }}>
                  {order.status}
                </span>
              </div>
              {order.items.map((item, i) => (
                <p key={i} style={{ color: '#666', fontSize: 14 }}>
                  {item.menuItem.name} × {item.quantity}
                </p>
              ))}
              <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>📍 {order.address}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {['ACCEPTED', 'PREPARING', 'READY', 'DELIVERED'].map(s => (
                  <button key={s} onClick={() => updateStatus(order.id, s)}
                    style={{
                      padding: '4px 10px', fontSize: 12,
                      background: order.status === s ? '#f97316' : '#eee',
                      color: order.status === s ? '#fff' : '#333',
                      border: 'none', borderRadius: 4, cursor: 'pointer'
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Menu Items Tab */}
      {tab === 'menu' && (
        <div>
          {menuItems.length === 0 ? (
            <p style={{ color: '#999' }}>No menu items yet. Add some!</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {menuItems.map(item => (
                <div key={item.id} style={{ border: '1px solid #eee', borderRadius: 10, overflow: 'hidden' }}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name}
                      style={{ width: '100%', height: 130, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: 80, background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: 28 }}>
                      🍽️
                    </div>
                  )}
                  <div style={{ padding: '0.75rem' }}>
                    <h4 style={{ marginBottom: 2, fontSize: 15 }}>{item.name}</h4>
                    <p style={{ color: '#f97316', fontWeight: 600, marginBottom: 2 }}>₹{item.price}</p>
                    <p style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>{item.category}</p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => startEdit(item)}
                        style={{ flex: 1, padding: '5px 0', background: '#f97316', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 13 }}>
                        ✏️ Edit
                      </button>
                      <button onClick={() => deleteMenuItem(item.id, item.name)}
                        style={{ flex: 1, padding: '5px 0', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 13 }}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Item Tab */}
      {tab === 'add' && (
        <form onSubmit={addMenuItem} style={{ maxWidth: 400 }}>
          {message && (
            <p style={{ color: message.includes('added') ? '#22c55e' : 'red', marginBottom: '1rem' }}>
              {message}
            </p>
          )}
          {[
            { field: 'name', placeholder: 'Item name', type: 'text' },
            { field: 'description', placeholder: 'Description', type: 'text' },
            { field: 'price', placeholder: 'Price in ₹', type: 'number' },
            { field: 'category', placeholder: 'Category (e.g. Biryani)', type: 'text' }
          ].map(({ field, placeholder, type }) => (
            <div key={field} style={{ marginBottom: '1rem' }}>
              <label style={{ textTransform: 'capitalize', fontWeight: 500 }}>{field}</label>
              <input
                value={form[field as keyof typeof form]}
                onChange={e => setForm({ ...form, [field]: e.target.value })}
                placeholder={placeholder}
                type={type}
                style={{ display: 'block', width: '100%', padding: '8px', marginTop: 4, borderRadius: 6, border: '1px solid #ccc' }}
                required
              />
            </div>
          ))}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 500 }}>Item Image (optional)</label>
            <input type="file" accept="image/*"
              onChange={e => setItemImage(e.target.files?.[0] || null)}
              style={{ display: 'block', marginTop: 4 }} />
            {itemImage && (
              <img src={URL.createObjectURL(itemImage)} alt="preview"
                style={{ marginTop: 8, width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }} />
            )}
          </div>
          <button type="submit" disabled={loading}
            style={{ padding: '10px 24px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15 }}>
            {loading ? (uploading ? 'Uploading...' : 'Adding...') : 'Add Item'}
          </button>
        </form>
      )}
    </div>
  );
}