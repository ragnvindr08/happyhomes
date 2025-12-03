import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, logout } from '../utils/auth';
import axios from 'axios';
import API_URL from '../utils/config';
import defaultProfile from '../images/profile1.png';
import './AdminProfileDropdown.css';

interface UserProfile {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile?: {
    profile_image?: string;
  };
}

const AdminProfileDropdown: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const token = getToken();

  // Fetch user profile
  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/profile/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setProfile(res.data);
      })
      .catch(err => {
        console.error('Error fetching profile:', err);
      });
    }
  }, [token]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/change-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          old_password: passwordData.old_password,
          new_password: passwordData.new_password
        })
      });

      const data = await res.json();

      if (res.ok) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
        setTimeout(() => {
          setShowChangePassword(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        setPasswordError(data.detail || 'Failed to change password');
      }
    } catch (err) {
      setPasswordError('An error occurred. Please try again.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    window.location.reload();
  };

  const profileImageUrl = profile?.profile?.profile_image 
    ? (profile.profile.profile_image.startsWith('http') 
        ? profile.profile.profile_image 
        : `http://127.0.0.1:8000${profile.profile.profile_image}`)
    : defaultProfile;

  return (
    <div className="admin-profile-dropdown" ref={dropdownRef}>
      <div 
        className="admin-profile-picture"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Profile menu"
      >
        <img 
          src={profileImageUrl} 
          alt="Profile" 
          className="profile-img"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = defaultProfile;
          }}
        />
      </div>

      {showDropdown && (
        <div className="admin-profile-menu">
          <div className="profile-menu-header">
            <img 
              src={profileImageUrl} 
              alt="Profile" 
              className="profile-img-large"
            />
            <div className="profile-menu-info">
              <div className="profile-menu-name">
                {profile?.first_name && profile?.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : profile?.username || 'Admin'}
              </div>
              <div className="profile-menu-email">{profile?.email}</div>
            </div>
          </div>
          
          <div className="profile-menu-divider"></div>

          <button 
            className="profile-menu-item"
            onClick={() => {
              setShowChangePassword(true);
              setShowDropdown(false);
            }}
          >
            Change Password
          </button>
          
          <button 
            className="profile-menu-item"
            onClick={() => {
              navigate('/profile');
              setShowDropdown(false);
            }}
          >
            Account Settings
          </button>
          
          <div className="profile-menu-divider"></div>
          
          <button 
            className="profile-menu-item profile-menu-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="change-password-modal-overlay" onClick={() => setShowChangePassword(false)}>
          <div className="change-password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="change-password-header">
              <h3>Change Password</h3>
              <button 
                className="close-modal-btn"
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleChangePassword}>
              <div className="password-form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordData.old_password}
                  onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                  required
                  placeholder="Enter current password"
                />
              </div>
              
              <div className="password-form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  required
                  placeholder="Enter new password (min 8 characters)"
                  minLength={8}
                />
              </div>
              
              <div className="password-form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  required
                  placeholder="Confirm new password"
                  minLength={8}
                />
              </div>

              {passwordError && (
                <div className="password-error">{passwordError}</div>
              )}
              
              {passwordSuccess && (
                <div className="password-success">{passwordSuccess}</div>
              )}

              <div className="password-form-actions">
                <button 
                  type="button"
                  className="password-cancel-btn"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="password-submit-btn">
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfileDropdown;

