import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';
import { getToken } from '../utils/auth';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './HouseDetailPage.css';

interface House {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  image?: string;
  image_urls?: string[];
  images?: Array<{ id: number; image: string; image_url: string; order: number }>;
  user?: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    profile?: {
      profile_image?: string;
    };
  };
  listing_type?: 'sale' | 'rent';
  property_type?: string;
  beds?: number;
  baths?: number;
  floor_area?: number;
  lot_size?: number;
  year_built?: number;
  floors?: number;
  furnishing?: string;
  parking_spaces?: number;
  has_balcony?: boolean;
  has_garden?: boolean;
  has_pool?: boolean;
  has_elevator?: boolean;
  has_security?: boolean;
  has_air_conditioning?: boolean;
  has_heating?: boolean;
  has_wifi?: boolean;
  has_cable_tv?: boolean;
  has_dishwasher?: boolean;
  has_washing_machine?: boolean;
  has_dryer?: boolean;
  has_microwave?: boolean;
  has_refrigerator?: boolean;
  has_gym?: boolean;
  has_playground?: boolean;
  has_clubhouse?: boolean;
  has_laundry_room?: boolean;
  has_storage?: boolean;
  has_fireplace?: boolean;
  has_garage?: boolean;
  has_cctv?: boolean;
  has_intercom?: boolean;
  has_generator?: boolean;
  has_water_heater?: boolean;
  has_solar_panels?: boolean;
  association_dues?: string;
  utilities_included?: boolean;
  deposit_amount?: number;
  advance_payment?: number;
  lease_term?: string;
  pet_friendly?: boolean;
  down_payment?: number;
  payment_terms?: string;
  amenities?: string;
  nearby_facilities?: string;
  days_on_market?: string;
  contact_phone?: string;
  contact_email?: string;
  property_status?: string;
  created_at?: string;
}

const API_BASE = 'http://127.0.0.1:8000/api';

const HouseDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [house, setHouse] = useState<House | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState<{ id: number } | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isGuest, setIsGuest] = useState(true);

  // Get image URLs for a house
  const getHouseImageUrls = useCallback((house: House): string[] => {
    const urls: string[] = [];
    const baseUrl = API_BASE.replace('/api', '');
    
    if (house.image_urls && Array.isArray(house.image_urls) && house.image_urls.length > 0) {
      house.image_urls.forEach((url) => {
        if (url && typeof url === 'string') {
          let absoluteUrl = url;
          if (!url.startsWith('http')) {
            const path = url.startsWith('/') ? url : '/' + url;
            absoluteUrl = `${baseUrl}${path}`;
          }
          if (!urls.includes(absoluteUrl)) {
            urls.push(absoluteUrl);
          }
        }
      });
    }
    
    if (urls.length === 0 && house.images && Array.isArray(house.images) && house.images.length > 0) {
      house.images.forEach((img) => {
        if (img && typeof img === 'object') {
          const imgUrl = img.image_url || img.image;
          if (imgUrl && typeof imgUrl === 'string') {
            let absoluteUrl = imgUrl;
            if (!imgUrl.startsWith('http')) {
              const path = imgUrl.startsWith('/') ? imgUrl : '/' + imgUrl;
              absoluteUrl = `${baseUrl}${path}`;
            }
            if (!urls.includes(absoluteUrl)) {
              urls.push(absoluteUrl);
            }
          }
        }
      });
    }
    
    if (urls.length === 0 && house.image && typeof house.image === 'string') {
      let absoluteUrl = house.image;
      if (!house.image.startsWith('http')) {
        const path = house.image.startsWith('/') ? house.image : '/' + house.image;
        absoluteUrl = `${baseUrl}${path}`;
      }
      if (!urls.includes(absoluteUrl)) {
        urls.push(absoluteUrl);
      }
    }
    
    return urls;
  }, []);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const token = getToken();
      if (token) {
        try {
          const res = await fetch(`${API_BASE}/profile/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const userData = await res.json();
            setCurrentUser({ id: userData.id });
            setIsGuest(false);
          }
        } catch (err) {
          console.error('Error fetching user:', err);
          setIsGuest(true);
        }
      } else {
        setIsGuest(true);
      }
    };
    fetchUser();
  }, []);

  // Fetch house details
  useEffect(() => {
    const fetchHouse = async () => {
      if (!id) {
        setError('Invalid property ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/guest/houses/${id}/`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch property details');
        }
        
        const data: House = await res.json();
        setHouse(data);
      } catch (err) {
        console.error('Error fetching house:', err);
        setError(err instanceof Error ? err.message : 'Failed to load property');
      } finally {
        setLoading(false);
      }
    };

    fetchHouse();
  }, [id]);

  // Check ownership when both house and currentUser are available
  useEffect(() => {
    if (house && currentUser && house.user?.id === currentUser.id) {
      setIsOwner(true);
    } else {
      setIsOwner(false);
    }
  }, [house, currentUser]);

  const nextImage = useCallback(() => {
    if (house) {
      const imageUrls = getHouseImageUrls(house);
      setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
    }
  }, [house, getHouseImageUrls]);

  const prevImage = useCallback(() => {
    if (house) {
      const imageUrls = getHouseImageUrls(house);
      setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
    }
  }, [house, getHouseImageUrls]);

  // Handle delete
  const handleDelete = async () => {
    if (!house || !isOwner) return;
    
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }

    const token = getToken();
    if (!token) {
      toast.error('You must be logged in to delete properties');
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/houses/${house.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success('Property deleted successfully');
        navigate('/house-sales');
      } else {
        throw new Error('Failed to delete property');
      }
    } catch (err) {
      console.error('Error deleting property:', err);
      toast.error('Failed to delete property');
    }
  };

  if (loading) {
    return (
      <div className="house-detail-page">
        <NavBar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading property details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !house) {
    return (
      <div className="house-detail-page">
        <NavBar />
        <div className="error-container">
          <h2>Property Not Found</h2>
          <p>{error || 'The property you are looking for does not exist.'}</p>
          <button onClick={() => navigate('/house-sales')} className="back-btn">
            Back to Listings
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const imageUrls = getHouseImageUrls(house);
  const currentImage = imageUrls[currentImageIndex] || imageUrls[0];

  // Get all features
  const features = [];
  if (house.has_balcony) features.push('Balcony');
  if (house.has_garden) features.push('Garden');
  if (house.has_pool) features.push('Pool');
  if (house.has_elevator) features.push('Elevator');
  if (house.has_security) features.push('Security');
  if (house.has_air_conditioning) features.push('Air Conditioning');
  if (house.has_heating) features.push('Heating');
  if (house.has_wifi) features.push('WiFi');
  if (house.has_cable_tv) features.push('Cable TV');
  if (house.has_dishwasher) features.push('Dishwasher');
  if (house.has_washing_machine) features.push('Washing Machine');
  if (house.has_dryer) features.push('Dryer');
  if (house.has_microwave) features.push('Microwave');
  if (house.has_refrigerator) features.push('Refrigerator');
  if (house.has_gym) features.push('Gym');
  if (house.has_playground) features.push('Playground');
  if (house.has_clubhouse) features.push('Clubhouse');
  if (house.has_laundry_room) features.push('Laundry Room');
  if (house.has_storage) features.push('Storage');
  if (house.has_fireplace) features.push('Fireplace');
  if (house.has_garage) features.push('Garage');
  if (house.has_cctv) features.push('CCTV');
  if (house.has_intercom) features.push('Intercom');
  if (house.has_generator) features.push('Generator');
  if (house.has_water_heater) features.push('Water Heater');
  if (house.has_solar_panels) features.push('Solar Panels');

  return (
    <div className="house-detail-page">
      <NavBar />
      <div className="house-detail-container">
        <button onClick={() => navigate('/house-sales')} className="back-button">
          ← Back to Listings
        </button>

        <div className="house-detail-content">
          {/* Left Side - Images */}
          <div className="house-detail-images">
            {currentImage ? (
              <div className="main-image-wrapper">
                <img 
                  src={currentImage} 
                  alt={house.title}
                  className="main-image"
                />
                {imageUrls.length > 1 && (
                  <>
                    <button className="image-nav prev" onClick={prevImage}>
                      ‹
                    </button>
                    <button className="image-nav next" onClick={nextImage}>
                      ›
                    </button>
                    <div className="image-indicator">
                      {currentImageIndex + 1} / {imageUrls.length}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="no-image-placeholder">
                <p>No image available</p>
              </div>
            )}

            {/* Thumbnails */}
            {imageUrls.length > 1 && (
              <div className="image-thumbnails">
                {imageUrls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`${house.title} ${idx + 1}`}
                    className={idx === currentImageIndex ? 'active' : ''}
                    onClick={() => setCurrentImageIndex(idx)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Details */}
          <div className="house-detail-info">
            <div className="detail-header">
              <div className={`detail-badge ${house.listing_type === 'rent' ? 'badge-rent' : 'badge-sale'}`}>
                {house.listing_type === 'rent' ? 'FOR RENT' : 'FOR SALE'}
              </div>
              <h1 className="detail-title">{house.title}</h1>
              <p className="detail-location">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {house.location}
              </p>
              <div className="detail-price">
                <span className="price-amount">₱{Number(house.price).toLocaleString()}</span>
                {house.listing_type === 'rent' && <span className="price-period">/month</span>}
              </div>
              
              {/* Edit and Delete Buttons for Owner */}
              {isOwner && (
                <div className="owner-actions">
                  <button 
                    onClick={() => navigate(`/house-sales?edit=${house.id}`)}
                    className="edit-btn"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit Property
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="delete-btn"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete Property
                  </button>
                </div>
              )}
              
              {/* Inquire Now Button for Guests */}
              {!isOwner && (
                <div className="guest-actions">
                  <button 
                    onClick={() => navigate('/contact')}
                    className="inquire-btn"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Inquire Now
                  </button>
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="property-specs">
              <h3>Property Details</h3>
              <div className="specs-grid">
                {house.property_type && (
                  <div className="spec-item">
                    <span className="spec-icon">🏘️</span>
                    <div>
                      <span className="spec-label">Property Type</span>
                      <span className="spec-value">{house.property_type}</span>
                    </div>
                  </div>
                )}
                {house.beds && (
                  <div className="spec-item">
                    <span className="spec-icon">🛏️</span>
                    <div>
                      <span className="spec-label">Bedrooms</span>
                      <span className="spec-value">{house.beds}</span>
                    </div>
                  </div>
                )}
                {house.baths && (
                  <div className="spec-item">
                    <span className="spec-icon">🚿</span>
                    <div>
                      <span className="spec-label">Bathrooms</span>
                      <span className="spec-value">{house.baths}</span>
                    </div>
                  </div>
                )}
                {house.floor_area && (
                  <div className="spec-item">
                    <span className="spec-icon">📐</span>
                    <div>
                      <span className="spec-label">Interior Area</span>
                      <span className="spec-value">{house.floor_area} sqm</span>
                    </div>
                  </div>
                )}
                {house.lot_size && (
                  <div className="spec-item">
                    <span className="spec-icon">🏠</span>
                    <div>
                      <span className="spec-label">Lot Size</span>
                      <span className="spec-value">{house.lot_size} sqm</span>
                    </div>
                  </div>
                )}
                {house.floors && (
                  <div className="spec-item">
                    <span className="spec-icon">🏢</span>
                    <div>
                      <span className="spec-label">Floors</span>
                      <span className="spec-value">{house.floors}</span>
                    </div>
                  </div>
                )}
                {house.parking_spaces !== undefined && house.parking_spaces > 0 && (
                  <div className="spec-item">
                    <span className="spec-icon">🚗</span>
                    <div>
                      <span className="spec-label">Parking Spaces</span>
                      <span className="spec-value">{house.parking_spaces}</span>
                    </div>
                  </div>
                )}
                {house.year_built && (
                  <div className="spec-item">
                    <span className="spec-icon">📅</span>
                    <div>
                      <span className="spec-label">Year Built</span>
                      <span className="spec-value">{house.year_built}</span>
                    </div>
                  </div>
                )}
                {house.furnishing && (
                  <div className="spec-item">
                    <span className="spec-icon">🪑</span>
                    <div>
                      <span className="spec-label">Furnishing</span>
                      <span className="spec-value">{house.furnishing}</span>
                    </div>
                  </div>
                )}
                {house.property_status && (
                  <div className="spec-item">
                    <span className="spec-icon">📊</span>
                    <div>
                      <span className="spec-label">Status</span>
                      <span className="spec-value">{house.property_status}</span>
                    </div>
                  </div>
                )}
                {house.days_on_market && (
                  <div className="spec-item">
                    <span className="spec-icon">⏱️</span>
                    <div>
                      <span className="spec-label">Days on Market</span>
                      <span className="spec-value">{house.days_on_market}</span>
                    </div>
                  </div>
                )}
                {house.association_dues && (
                  <div className="spec-item">
                    <span className="spec-icon">💰</span>
                    <div>
                      <span className="spec-label">Association Dues</span>
                      <span className="spec-value">{house.association_dues}</span>
                    </div>
                  </div>
                )}
                {house.utilities_included !== undefined && (
                  <div className="spec-item">
                    <span className="spec-icon">⚡</span>
                    <div>
                      <span className="spec-label">Utilities Included</span>
                      <span className="spec-value">{house.utilities_included ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {house.description && (
              <div className="property-description">
                <h3>Description</h3>
                <p>{house.description}</p>
              </div>
            )}

            {/* Property Features */}
            {/* Property Features - Always Visible */}
            <div className="property-features">
              <h3>Property Features</h3>
              {features.length > 0 ? (
                <div className="features-grid">
                  {features.map((feature, idx) => (
                    <div key={idx} className="feature-tag">
                      {feature}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-features">No features listed</p>
              )}
            </div>

            {/* Additional Amenities */}
            {house.amenities && (
              <div className="property-amenities">
                <h3>Additional Amenities</h3>
                <p>{house.amenities}</p>
              </div>
            )}

            {/* Nearby Facilities */}
            {house.nearby_facilities && (
              <div className="nearby-facilities">
                <h3>Nearby Facilities</h3>
                <p>{house.nearby_facilities}</p>
              </div>
            )}

            {/* Sale Details */}
            {house.listing_type === 'sale' && (
              <div className="sale-details">
                <h3>Sale Details</h3>
                {house.down_payment && (
                  <div className="detail-row">
                    <span className="detail-label">Down Payment:</span>
                    <span className="detail-value">₱{Number(house.down_payment).toLocaleString()}</span>
                  </div>
                )}
                {house.payment_terms && (
                  <div className="detail-row">
                    <span className="detail-label">Payment Terms:</span>
                    <span className="detail-value">{house.payment_terms}</span>
                  </div>
                )}
                {!house.down_payment && !house.payment_terms && (
                  <p className="no-details">No sale details available</p>
                )}
              </div>
            )}

            {house.listing_type === 'rent' && (
              <div className="rent-details">
                <h3>Rental Details</h3>
                {house.deposit_amount && (
                  <div className="detail-row">
                    <span className="detail-label">Security Deposit:</span>
                    <span className="detail-value">₱{Number(house.deposit_amount).toLocaleString()}</span>
                  </div>
                )}
                {house.advance_payment && (
                  <div className="detail-row">
                    <span className="detail-label">Advance Payment:</span>
                    <span className="detail-value">₱{Number(house.advance_payment).toLocaleString()}</span>
                  </div>
                )}
                {house.lease_term && (
                  <div className="detail-row">
                    <span className="detail-label">Lease Term:</span>
                    <span className="detail-value">{house.lease_term}</span>
                  </div>
                )}
                {house.pet_friendly !== undefined && (
                  <div className="detail-row">
                    <span className="detail-label">Pet Friendly:</span>
                    <span className="detail-value">{house.pet_friendly ? 'Yes' : 'No'}</span>
                  </div>
                )}
                {!house.deposit_amount && !house.advance_payment && !house.lease_term && house.pet_friendly === undefined && (
                  <p className="no-details">No rental details available</p>
                )}
              </div>
            )}

            {/* Owner Contact */}
            {house.user && (
              <div className="owner-section">
                <h3>Property Owner</h3>
                <div className="owner-info">
                  <div className="owner-avatar">
                    {house.user.profile?.profile_image ? (
                      <img 
                        src={house.user.profile.profile_image.startsWith('http') 
                          ? house.user.profile.profile_image 
                          : `${API_BASE.replace('/api', '')}${house.user.profile.profile_image.startsWith('/') ? '' : '/'}${house.user.profile.profile_image}`}
                        alt={house.user.username}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.owner-placeholder')) {
                            const placeholder = document.createElement('div');
                            placeholder.className = 'owner-placeholder';
                            placeholder.textContent = (house.user?.first_name?.[0] || house.user?.username[0] || 'U').toUpperCase();
                            parent.appendChild(placeholder);
                          }
                        }}
                      />
                    ) : (
                      <div className="owner-placeholder">
                        {(house.user.first_name?.[0] || house.user.username[0] || 'U').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="owner-details">
                    <p className="owner-name">
                      {house.user.first_name && house.user.last_name 
                        ? `${house.user.first_name} ${house.user.last_name}`
                        : house.user.username}
                    </p>
                    {house.contact_phone && (
                      <a href={`tel:${house.contact_phone}`} className="contact-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        {house.contact_phone}
                      </a>
                    )}
                    {house.contact_email && (
                      <a href={`mailto:${house.contact_email}`} className="contact-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        {house.contact_email}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Contact Buttons */}
            <div className="action-buttons">
              {house.contact_phone && (
                <a href={`tel:${house.contact_phone}`} className="action-btn primary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  Call Owner
                </a>
              )}
              {house.contact_email && (
                <a href={`mailto:${house.contact_email}`} className="action-btn secondary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  Send Email
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Advertisement Banner for Guests */}
        {!currentUser && (
          <div className="advertisement-banner">
            <div className="ad-content">
              <div className="ad-icon">🏠</div>
              <div className="ad-text">
                <h3>Join Happy Homes Community</h3>
                <p>Create an account to list your property, book amenities, and connect with neighbors</p>
              </div>
              <button 
                className="ad-cta-btn"
                onClick={() => navigate('/register')}
              >
                Sign Up Free
              </button>
            </div>
          </div>
        )}

        {/* Feature Highlights Advertisement for Guests */}
        {!currentUser && (
          <div className="feature-advertisement">
            <h3 className="ad-section-title">Why Join Happy Homes?</h3>
            <div className="feature-cards">
              <div className="feature-card">
                <div className="feature-card-icon">🏘️</div>
                <h4>List Your Property</h4>
                <p>Reach thousands of potential buyers and renters in the community</p>
              </div>
              <div className="feature-card">
                <div className="feature-card-icon">📅</div>
                <h4>Book Amenities</h4>
                <p>Reserve function halls, sports facilities, and community spaces</p>
              </div>
              <div className="feature-card">
                <div className="feature-card-icon">👥</div>
                <h4>Connect with Neighbors</h4>
                <p>Join a vibrant community and stay connected with your neighbors</p>
              </div>
              <div className="feature-card">
                <div className="feature-card-icon">💳</div>
                <h4>Easy Payments</h4>
                <p>Manage bills and service fees all in one place</p>
              </div>
            </div>
            <div className="ad-cta-section">
              <button 
                className="ad-primary-btn"
                onClick={() => navigate('/register')}
              >
                Get Started Today
              </button>
              <button 
                className="ad-secondary-btn"
                onClick={() => navigate('/login')}
              >
                Already have an account? Login
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default HouseDetailPage;

