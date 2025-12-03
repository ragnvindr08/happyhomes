import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, logout } from '../utils/auth';
import './AdminSalePage.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './Sidebar';

interface Profile {
  is_verified?: boolean;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_staff: boolean;
  profile?: Profile;
}

interface House {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  image?: string;
  image_urls?: string[];
  images?: Array<{ id: number; image: string; image_url: string; order: number }>;
  user?: User;
  listing_type?: 'sale' | 'rent';
}

const API_BASE = 'http://127.0.0.1:8000/api';

const AdminSalePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalHouse, setModalHouse] = useState<House | null>(null);
  const [search, setSearch] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit states
  const [editData, setEditData] = useState({
    title: '',
    price: '',
    location: '',
    description: '',
  });

  const navigate = useNavigate();
  const token = getToken();

  // Get image URLs helper
  const getHouseImageUrls = useCallback((house: House): string[] => {
    const urls: string[] = [];
    
    if (house.image_urls && house.image_urls.length > 0) {
      house.image_urls.forEach(url => {
        const absoluteUrl = url.startsWith('http') ? url : `${API_BASE.replace('/api', '')}${url}`;
        if (!urls.includes(absoluteUrl)) urls.push(absoluteUrl);
      });
    }
    
    if (house.images && house.images.length > 0) {
      house.images.forEach(img => {
        const imgUrl = img.image_url || img.image;
        if (imgUrl) {
          const absoluteUrl = imgUrl.startsWith('http') ? imgUrl : `${API_BASE.replace('/api', '')}${imgUrl}`;
          if (!urls.includes(absoluteUrl)) urls.push(absoluteUrl);
        }
      });
    }
    
    if (house.image) {
      const absoluteUrl = house.image.startsWith('http') ? house.image : `${API_BASE.replace('/api', '')}${house.image}`;
      if (!urls.includes(absoluteUrl)) urls.push(absoluteUrl);
    }
    
    return urls;
  }, []);

  // Fetch admin profile
  const fetchUserProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        throw new Error('Unauthorized');
      }
      const data: User = await res.json();
      if (!data.is_staff) {
        toast.error('Access denied. Admin privileges required.');
        navigate('/home');
        return;
      }
      setUser(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load admin profile');
    }
  }, [token, navigate]);

  // Fetch all houses
  const fetchHouses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/houses/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        throw new Error(`Failed to fetch houses: ${res.status}`);
      }
      const data: House[] = await res.json();
      setHouses(data);
    } catch (err) {
      console.error('Error fetching houses:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load properties';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  // Filtered houses
  const filteredHouses = useMemo(() => {
    if (!search) return houses;
    const searchLower = search.toLowerCase();
    return houses.filter(
      h =>
        h.title.toLowerCase().includes(searchLower) ||
        h.location.toLowerCase().includes(searchLower) ||
        (h.description && h.description.toLowerCase().includes(searchLower))
    );
  }, [houses, search]);

  // Open modal
  const openModal = useCallback((house: House) => {
    setModalHouse(house);
    setEditMode(false);
    setEditData({
      title: house.title,
      price: house.price.toString(),
      location: house.location,
      description: house.description || '',
    });
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/houses/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        setHouses(prev => prev.filter(h => h.id !== id));
        setModalHouse(null);
        toast.success('Property deleted successfully');
      } else {
        throw new Error('Failed to delete property');
      }
    } catch (err) {
      console.error('Error deleting property:', err);
      toast.error('Failed to delete property');
    }
  }, [token]);

  // Handle edit save
  const handleSaveEdit = useCallback(async () => {
    if (!modalHouse) return;
    
    if (!editData.title || !editData.price || !editData.location) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('title', editData.title.trim());
      
      const cleanPrice = editData.price.toString().replace(/[₱,\s]/g, '').trim();
      if (!cleanPrice || isNaN(parseFloat(cleanPrice))) {
        toast.error('Please enter a valid price');
        setSubmitting(false);
        return;
      }
      formData.append('price', cleanPrice);
      formData.append('location', editData.location.trim());
      formData.append('description', editData.description.trim());

      const res = await fetch(`${API_BASE}/houses/${modalHouse.id}/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Failed to update property' }));
        throw new Error(errorData.detail || 'Failed to update property');
      }
      
      const updated = await res.json();
      setHouses(prev => prev.map(h => (h.id === updated.id ? updated : h)));
      setModalHouse(updated);
      setEditMode(false);
      toast.success('Property updated successfully');
    } catch (err) {
      console.error('Error updating property:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update property';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [modalHouse, editData, token]);

  useEffect(() => {
    fetchUserProfile();
    fetchHouses();
  }, [fetchUserProfile, fetchHouses]);

  if (loading && houses.length === 0) {
    return (
      <>
        <div className="dashboard-layout">
          <Sidebar />
          <main className="dashboard-main">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading properties...</p>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main">
          <h2>Property Management</h2>
          
          {error && (
            <div className="error-banner">
              <p>{error}</p>
              <button onClick={fetchHouses}>Retry</button>
            </div>
          )}

          {/* Search */}
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search by title, location, or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Results Count */}
          {search && (
            <div className="results-info">
              Showing {filteredHouses.length} of {houses.length} properties
            </div>
          )}

          {/* Houses Grid */}
          <div className="houses-grid">
            {filteredHouses.length === 0 ? (
              <div className="no-results">
                <p>No properties found.</p>
                {search && <p className="no-results-hint">Try adjusting your search terms.</p>}
              </div>
            ) : (
              filteredHouses.map(house => {
                const imageUrls = getHouseImageUrls(house);
                const firstImage = imageUrls[0];
                
                return (
                  <div
                    key={house.id}
                    className="house-grid-card"
                    onClick={() => openModal(house)}
                  >
                    {firstImage ? (
                      <img 
                        src={firstImage} 
                        alt={house.title}
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const placeholder = target.parentElement?.querySelector('.no-image') as HTMLElement;
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                    <div className="house-grid-overlay">
                      <h4>{house.title}</h4>
                      <p className="house-price">₱{Number(house.price).toLocaleString()}</p>
                      <p className="house-location">{house.location}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal */}
          {modalHouse && (
            <div className="modal-overlay" onClick={() => setModalHouse(null)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setModalHouse(null)}>×</button>
                {editMode ? (
                  <div className="modal-edit-form">
                    <h3>Edit Property</h3>
                    <div className="form-group">
                      <label>Title *</label>
                      <input 
                        value={editData.title} 
                        onChange={e => setEditData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Property title"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Price (₱) *</label>
                      <input 
                        type="text" 
                        value={editData.price} 
                        onChange={e => setEditData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="Enter price"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Location *</label>
                      <input 
                        value={editData.location} 
                        onChange={e => setEditData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Property location"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea 
                        value={editData.description} 
                        onChange={e => setEditData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Property description"
                        rows={4}
                      />
                    </div>
                    <div className="modal-buttons">
                      <button 
                        className="btn-save" 
                        onClick={handleSaveEdit}
                        disabled={submitting}
                      >
                        {submitting ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button 
                        className="btn-cancel" 
                        onClick={() => setEditMode(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="modal-view">
                    {(() => {
                      const imageUrls = getHouseImageUrls(modalHouse);
                      const firstImage = imageUrls[0];
                      
                      return firstImage ? (
                        <img src={firstImage} alt={modalHouse.title} className="modal-image" />
                      ) : null;
                    })()}
                    <div className="modal-body">
                      <h3>{modalHouse.title}</h3>
                      <div className="modal-info">
                        <div className="info-item">
                          <strong>Price:</strong>
                          <span className="price-tag">₱{Number(modalHouse.price).toLocaleString()}</span>
                        </div>
                        <div className="info-item">
                          <strong>Location:</strong>
                          <span>{modalHouse.location}</span>
                        </div>
                        {modalHouse.user && (
                          <div className="info-item">
                            <strong>Owner:</strong>
                            <span>{modalHouse.user.first_name} {modalHouse.user.last_name}</span>
                          </div>
                        )}
                        {modalHouse.listing_type && (
                          <div className="info-item">
                            <strong>Type:</strong>
                            <span>{modalHouse.listing_type === 'rent' ? 'For Rent' : 'For Sale'}</span>
                          </div>
                        )}
                        {modalHouse.description && (
                          <div className="info-item description">
                            <strong>Description:</strong>
                            <p>{modalHouse.description}</p>
                          </div>
                        )}
                      </div>
                      <div className="modal-buttons">
                        <button className="btn-edit" onClick={() => setEditMode(true)}>Edit</button>
                        <button className="btn-delete" onClick={() => handleDelete(modalHouse.id)}>Delete</button>
                        <button className="btn-close" onClick={() => setModalHouse(null)}>Close</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default AdminSalePage;
