import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './NavBar.css';
import logo from '../images/logo.png';
import axios from 'axios';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import TopBanner from './TopBanner';
import { getToken, logout } from '../utils/auth';
import API_URL from '../utils/config';
import homeIcon from '../images/home.png';
import mapIcon from '../images/maps.png';
import bookingIcon from '../images/bookings.png';
import newsIcon from '../images/news.png';
import contactIcon from '../images/contact.png';
import profileIcon from '../images/profiles.png';
import adminIcon from '../images/admin.png';
import visitorIcon from '../images/visitor.png';
import defaultProfile from '../images/profile1.png';

interface Profile {
  name?: string;
  username?: string;
  email?: string;
  is_staff?: boolean;
  is_verified?: boolean;
  profile?: {
    is_verified?: boolean;
    profile_image?: string;
  };
}

interface NavBarProps {
  profile?: Profile | null;
}

const NavBar: React.FC<NavBarProps> = ({ profile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const exploreDropdownRef = useRef<HTMLLIElement>(null);
  const exploreMenuRef = useRef<HTMLUListElement>(null);
  const exploreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const serviceDropdownRef = useRef<HTMLLIElement>(null);
  const serviceMenuRef = useRef<HTMLUListElement>(null);
  const serviceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoggedIn = !!getToken();

  // Determine active route
  const isActiveRoute = (path: string) => {
    return location.pathname === path || (path === '/home' && (location.pathname === '/' || location.pathname === '/login'));
  };

  // Check if Explore dropdown should be active (when on map or house-sales)
  const isExploreActive = location.pathname === '/map' || location.pathname === '/house-sales';
  
  // Check if Service dropdown should be active
  const isServiceActive = location.pathname === '/booking-amenities' || 
                          location.pathname === '/maintenance-request' || 
                          location.pathname === '/billing' || 
                          location.pathname === '/resident-dashboard' ||
                          location.pathname === '/contact';


  // Check admin status and verification status, and fetch profile image
  useEffect(() => {
    const token = getToken();
    if (token) {
      axios
        .get(`${API_URL}/profile/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
          setUserProfile(res.data);
          if (res.data.is_staff) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
          // Check if user is verified (check both possible paths)
          const verified = res.data.profile?.is_verified || res.data.is_verified || false;
          setIsVerified(verified);
        })
        .catch(err => {
          console.error('Error fetching profile:', err);
          setIsAdmin(false);
          setIsVerified(false);
        });
    } else {
      setIsAdmin(false);
      setIsVerified(false);
      setUserProfile(null);
    }
  }, [isLoggedIn]); // Refresh when login status changes

  // Close profile dropdown and explore dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      // Close explore dropdown when clicking outside
      if (exploreDropdownRef.current && !exploreDropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(false);
      }
      // Close service dropdown when clicking outside
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node)) {
        setServiceDropdownOpen(false);
      }
      // Close mobile menu when clicking outside
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('.navbar-content')) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Cleanup timeout on unmount
      if (exploreTimeoutRef.current) {
        clearTimeout(exploreTimeoutRef.current);
      }
      if (serviceTimeoutRef.current) {
        clearTimeout(serviceTimeoutRef.current);
      }
    };
  }, [isMobileMenuOpen]);

  const handleLogin = () => {
    navigate('/login?form=true');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    window.location.reload(); // Refresh to update navbar state
  };

  const handleChangePassword = () => {
    setProfileDropdownOpen(false);
    navigate('/profile');
    // Scroll to change password section or open it
    setTimeout(() => {
      const changePasswordSection = document.querySelector('.change-password');
      if (changePasswordSection) {
        changePasswordSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleAccountSettings = () => {
    setProfileDropdownOpen(false);
    navigate('/profile');
  };

  const getProfileImage = () => {
    if (userProfile?.profile?.profile_image) {
      return userProfile.profile.profile_image.startsWith('http') 
        ? userProfile.profile.profile_image 
        : `${API_URL.replace('/api', '')}${userProfile.profile.profile_image}`;
    }
    // Default profile image
    return defaultProfile;
  };

  return (
    <>
      <TopBanner message="Discover the best subdivisions in town! Book a viewing today & step into your future home!" />

      <nav className="navbar">
        <div className="navbar-content">
          {/* Logo */}
          <div className="navbar-logo" onClick={() => navigate('/home')}>
            <img src={logo} alt="Happy Homes Logo" className="logo-image" />
          </div>

          {/* Hamburger Menu for Mobile */}
          <div 
            className="hamburger" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </div>

          {/* Navigation Links */}
          <ul className={`navbar-links ${isMobileMenuOpen ? 'active' : ''}`}>
            {/* Hide Home, Explore, Contact, FAQ for admins */}
            {!isAdmin && (
              <>
                <li 
                  className={isActiveRoute('/home') ? 'active' : ''}
                  onClick={() => {
                    navigate('/home');
                    setIsMobileMenuOpen(false);
                  }}>
                   Home
                </li>

                <li 
                  ref={exploreDropdownRef}
                  className={`dropdown ${isExploreActive ? 'active' : ''}`}
                  onMouseEnter={() => {
                    // Clear any pending close timeout
                    if (exploreTimeoutRef.current) {
                      clearTimeout(exploreTimeoutRef.current);
                      exploreTimeoutRef.current = null;
                    }
                    // Only auto-open on hover for desktop (not mobile)
                    if (window.innerWidth > 768) {
                      setOpenDropdown(true);
                    }
                  }}
                  onMouseLeave={() => {
                    // Only auto-close on hover for desktop (not mobile)
                    if (window.innerWidth > 768) {
                      // Add a small delay to allow mouse to move to menu
                      exploreTimeoutRef.current = setTimeout(() => {
                        setOpenDropdown(false);
                        exploreTimeoutRef.current = null;
                      }, 200);
                    }
                  }}
                >
                  <span 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(!openDropdown);
                      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                     Explore
                  </span>
                  <ul 
                    ref={exploreMenuRef}
                    className={`dropdown-menu ${openDropdown ? 'show' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={() => {
                      // Clear any pending close timeout
                      if (exploreTimeoutRef.current) {
                        clearTimeout(exploreTimeoutRef.current);
                        exploreTimeoutRef.current = null;
                      }
                      // Keep dropdown open when hovering over menu
                      if (window.innerWidth > 768) {
                        setOpenDropdown(true);
                      }
                    }}
                    onMouseLeave={() => {
                      // Close when leaving the menu
                      if (window.innerWidth > 768) {
                        exploreTimeoutRef.current = setTimeout(() => {
                          setOpenDropdown(false);
                          exploreTimeoutRef.current = null;
                        }, 200);
                      }
                    }}
                  >
                    <li 
                      className={isActiveRoute('/map') ? 'active' : ''}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/map');
                        setOpenDropdown(false);
                        setIsMobileMenuOpen(false);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      Subdivision Map
                    </li>
                    <li 
                      className={isActiveRoute('/house-sales') ? 'active' : ''}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/house-sales');
                        setOpenDropdown(false);
                        setIsMobileMenuOpen(false);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      House for Sale/Rent
                    </li>
                  </ul>
                </li>


                {/* Service Dropdown - Only show for logged in homeowners */}
                {isLoggedIn && !isAdmin && (
                  <li
                    ref={serviceDropdownRef}
                    className={`dropdown ${isServiceActive ? 'active' : ''}`}
                    onMouseEnter={() => {
                      if (window.innerWidth > 768) {
                        if (serviceTimeoutRef.current) {
                          clearTimeout(serviceTimeoutRef.current);
                          serviceTimeoutRef.current = null;
                        }
                        setServiceDropdownOpen(true);
                      }
                    }}
                    onMouseLeave={() => {
                      // Only auto-close on hover for desktop (not mobile)
                      if (window.innerWidth > 768) {
                        // Add a small delay to allow mouse to move to menu
                        serviceTimeoutRef.current = setTimeout(() => {
                          setServiceDropdownOpen(false);
                          serviceTimeoutRef.current = null;
                        }, 200);
                      }
                    }}
                  >
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        setServiceDropdownOpen(!serviceDropdownOpen);
                        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                     Service
                    </span>
                    <ul 
                      ref={serviceMenuRef}
                      className={`dropdown-menu ${serviceDropdownOpen ? 'show' : ''}`}
                      onClick={(e) => e.stopPropagation()}
                      onMouseEnter={() => {
                        // Clear any pending close timeout
                        if (serviceTimeoutRef.current) {
                          clearTimeout(serviceTimeoutRef.current);
                          serviceTimeoutRef.current = null;
                        }
                        // Keep dropdown open when hovering over menu
                        if (window.innerWidth > 768) {
                          setServiceDropdownOpen(true);
                        }
                      }}
                      onMouseLeave={() => {
                        // Close when leaving the menu
                        if (window.innerWidth > 768) {
                          serviceTimeoutRef.current = setTimeout(() => {
                            setServiceDropdownOpen(false);
                            serviceTimeoutRef.current = null;
                          }, 200);
                        }
                      }}
                    >
                      {isVerified && (
                        <li 
                          className={isActiveRoute('/booking-amenities') ? 'active' : ''}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/booking-amenities');
                            setServiceDropdownOpen(false);
                            setIsMobileMenuOpen(false);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          Booking
                        </li>
                      )}
                      {isVerified && (
                        <li 
                          className={isActiveRoute('/maintenance-request') ? 'active' : ''}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/maintenance-request');
                            setServiceDropdownOpen(false);
                            setIsMobileMenuOpen(false);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          Maintenance
                        </li>
                      )}
                      {isVerified && (
                        <li 
                          className={isActiveRoute('/billing') ? 'active' : ''}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/billing');
                            setServiceDropdownOpen(false);
                            setIsMobileMenuOpen(false);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          Billing
                        </li>
                      )}
                      {isVerified && (
                        <li 
                          className={isActiveRoute('/resident-dashboard') ? 'active' : ''}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/resident-dashboard');
                            setServiceDropdownOpen(false);
                            setIsMobileMenuOpen(false);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          Visitors
                        </li>
                      )}
                      {isLoggedIn && (
                        <li 
                          className={isActiveRoute('/contact') ? 'active' : ''}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/contact');
                            setServiceDropdownOpen(false);
                            setIsMobileMenuOpen(false);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          Contact
                        </li>
                      )}
                    </ul>
                  </li>
                )}

                <li 
                  className={isActiveRoute('/faq') ? 'active' : ''}
                  onClick={() => {
                    navigate('/faq');
                    setIsMobileMenuOpen(false);
                  }}>
                   FAQ
                </li>

                <li 
                  className={isActiveRoute('/news') ? 'active' : ''}
                  onClick={() => {
                    navigate('/news');
                    setIsMobileMenuOpen(false);
                  }}>
                   News & Alerts
                </li>
              </>
            )}


            {isAdmin && (
              <li 
                className={isActiveRoute('/admin-dashboard') ? 'active' : ''}
                onClick={() => {
                  navigate('/admin-dashboard');
                  setIsMobileMenuOpen(false);
                }}>
                <img style={{ filter: 'none' }} src={adminIcon} alt="Admin Dashboard" className="icon" /> Admin Dashboard
              </li>
            )}
          </ul>

          {/* Right Side (Profile) */}
          <div className="navbar-right">
            {/* Hide profile and logout for admins (they have it in sidebar) */}
            {!isAdmin && (
              <>
                {isLoggedIn ? (
                  <div 
                    ref={profileDropdownRef}
                    style={{ position: 'relative' }}
                  >
                    <div
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        border: '2px solid #fff',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#2e6F40',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#17824f';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#fff';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {userProfile?.profile?.profile_image ? (
                        <img
                          src={getProfileImage()}
                          alt="Profile"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const parent = target.parentElement!;
                            target.style.display = 'none';
                            if (!parent.querySelector('span')) {
                              const span = document.createElement('span');
                              span.style.cssText = 'color: white; font-weight: bold; font-size: 18px; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;';
                              span.textContent = userProfile?.username?.charAt(0).toUpperCase() || 'U';
                              parent.appendChild(span);
                            }
                          }}
                        />
                      ) : (
                        <span style={{ 
                          color: 'white', 
                          fontWeight: 'bold', 
                          fontSize: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%'
                        }}>
                          {userProfile?.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    {profileDropdownOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '50px',
                          right: 0,
                          background: '#fff',
                          borderRadius: '4px',
                          border: '1px solid #e0e0e0',
                          minWidth: '200px',
                          zIndex: 10000,
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          onClick={handleChangePassword}
                          style={{
                            padding: '12px 20px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #e0e0e0',
                            transition: 'background 0.2s ease',
                            color: '#333',
                            fontSize: '14px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f5f5f5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fff';
                          }}
                        >
                          Change Password
                        </div>
                        <div
                          onClick={handleAccountSettings}
                          style={{
                            padding: '12px 20px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #e0e0e0',
                            transition: 'background 0.2s ease',
                            color: '#333',
                            fontSize: '14px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f5f5f5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fff';
                          }}
                        >
                          Account Settings
                        </div>
                        <div
                          onClick={handleLogout}
                          style={{
                            padding: '12px 20px',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease',
                            color: '#dc3545',
                            fontSize: '14px',
                            fontWeight: 500
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f5f5f5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fff';
                          }}
                        >
                          Logout
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button className="navbar-auth-button login-button" onClick={handleLogin}>
                    Login
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default NavBar;

// import React, { useEffect, useState, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import './NavBar.css';
// import logo from '../images/logo.png';
// import axios from 'axios';
// import NotificationsIcon from '@mui/icons-material/Notifications';
// import MenuIcon from '@mui/icons-material/Menu';
// import CloseIcon from '@mui/icons-material/Close';
// import { useNotifications } from './NotificationContext';
// import TopBanner from './TopBanner';
// import { getToken, logout } from '../utils/auth';
// import homeIcon from '../images/home.png';
// import mapIcon from '../images/maps.png';
// import bookingIcon from '../images/bookings.png';
// import newsIcon from '../images/news.png';
// import contactIcon from '../images/contact.png';
// import profileIcon from '../images/profiles.png';
// import adminIcon from '../images/admin.png';
// import visitorIcon from '../images/visitor.png';

// interface Profile {
//   name?: string;
//   username?: string;
//   email?: string;
//   is_staff?: boolean;
// }

// interface NavBarProps {
//   profile?: Profile | null;
// }

// const NavBar: React.FC<NavBarProps> = ({ profile }) => {
//   const navigate = useNavigate();
//   const { notifications } = useNotifications();
//   const [isAdmin, setIsAdmin] = useState(false);
//   const [openDropdown, setOpenDropdown] = useState(false);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const isLoggedIn = !!getToken();

//   // Detect clicks outside dropdown
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setOpenDropdown(false);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // Check admin status
//   useEffect(() => {
//     const token = localStorage.getItem('access');
//     if (token) {
//       axios
//         .get('http://localhost:8000/api/profile/', {
//           headers: { Authorization: `Bearer ${token}` }
//         })
//         .then(res => {
//           if (res.data.is_staff) setIsAdmin(true);
//         })
//         .catch(err => console.error(err));
//     }
//   }, []);

//   return (
//     <>
//       <TopBanner message="Discover the best subdivisions in town! Book a viewing today & step into your future home!" />

//       <nav className="navbar">
//         <div className="navbar-content">
//           {/* Logo */}
//           <div className="navbar-logo" onClick={() => navigate('/')}>
//             <img src={logo} alt="Happy Homes Logo" className="logo-image" />
//           </div>

//           {/* Hamburger Button for Mobile */}
//           <div className="hamburger" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
//             {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
//           </div>

//           {/* Navigation Links */}
//           <ul className={`navbar-links ${isMobileMenuOpen ? 'active' : ''}`}>
//             <li onClick={() => { navigate('/home'); setIsMobileMenuOpen(false); }}>
//               <img src={homeIcon} alt="Home" className="icon" /> Home
//             </li>

//             <li className="dropdown">
//               <span onClick={() => setOpenDropdown(!openDropdown)}>
//                 <img src={mapIcon} alt="Explore" className="icon" /> Explore
//               </span>
//               <ul className={`dropdown-menu ${openDropdown ? 'show' : ''}`}>
//                 <li onClick={() => { navigate('/map'); setIsMobileMenuOpen(false); }}>Subdivision Map</li>
//                 <li onClick={() => { navigate('/house-sales'); setIsMobileMenuOpen(false); }}>House Sale & Rent</li>
//                 {/* <li onClick={() => { navigate('/house-rent'); setIsMobileMenuOpen(false); }}>House for Rent</li>
//                 <li onClick={() => { navigate('/store-nearby'); setIsMobileMenuOpen(false); }}>Store Nearby</li> */}
//               </ul>
//             </li>

//             <li onClick={() => { navigate('/calendar'); setIsMobileMenuOpen(false); }}>
//               <img src={bookingIcon} alt="Booking" className="icon" /> Booking
//             </li>

//             <li onClick={() => { navigate('/news'); setIsMobileMenuOpen(false); }}>
//               <img src={newsIcon} alt="News & Alerts" className="icon" /> News & Alerts
//             </li>

//             <li onClick={() => { navigate('/contact'); setIsMobileMenuOpen(false); }}>
//               <img src={contactIcon} alt="Contact" className="icon" /> Contact
//             </li>

//             {isLoggedIn && (
//                 <>
//     <li onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}>
//       <img src={profileIcon} alt="Profile" className="icon" /> Profile
//     </li>

//     <li className="visitor" onClick={() => { navigate('/resident-dashboard'); setIsMobileMenuOpen(false); }}>
//       <img src={visitorIcon} alt="Visitor" className="icon" /> Visitors
//     </li>
//   </>
//             )}

//             {isAdmin && (
//               <li onClick={() => { navigate('/admin-dashboard'); setIsMobileMenuOpen(false); }}>
//                 <img style={{ filter: 'none' }} src={adminIcon} alt="Admin Dashboard" className="icon" /> Admin Dashboard
//               </li>
//             )}
//           </ul>

//           {/* Right Side (Notifications + Profile) */}
//           <div className="navbar-right">
//             <div className="notification-bell" ref={dropdownRef}>
//               <NotificationsIcon
//                 style={{ cursor: 'pointer', fontSize: 28 }}
//                 onClick={() => setOpenDropdown(!openDropdown)}
//               />
//               {notifications.length > 0 && (
//                 <span className="notification-count">{notifications.length}</span>
//               )}

//               {openDropdown && (
//                 <div className="notification-dropdown">
//                   {notifications.length === 0 && <p className="notif-empty">No notifications</p>}
//                   {notifications.map((note, index) => (
//                     <p key={index} className="notif-item">{note}</p>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {profile && (
//               <div className="navbar-profile">
//                 Welcome, {profile.username || profile.name || 'User'}!
//               </div>
//             )}
//           </div>
//         </div>
//       </nav>
//     </>
//   );
// };

// export default NavBar;
