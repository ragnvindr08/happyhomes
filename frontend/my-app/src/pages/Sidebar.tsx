import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../images/logo.png';
import AdminProfileDropdown from './AdminProfileDropdown';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import './AdminDashboard.css';

const Sidebar: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (!target.closest('.sidebar-toggle')) {
          setIsSidebarOpen(false);
        }
      }
    };
    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  const handleLinkClick = () => {
    setIsSidebarOpen(false);
  };

  return (
    <>
      <button 
        className="sidebar-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? <CloseIcon /> : <MenuIcon />}
      </button>
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />
      <aside ref={sidebarRef} className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo" onClick={() => navigate('/')}>
            <img src={logo} alt="Happy Homes Logo" />
          </div>
          <div className="sidebar-profile-container">
            <AdminProfileDropdown />
          </div>
        </div>
        <h2 className="sidebar-title">Admin Panel</h2>
        <ul className="sidebar-menu">
          <li><Link to="/admin-dashboard" onClick={handleLinkClick}>Dashboard</Link></li>
          <li><Link to="/admin-dashboard/map" onClick={handleLinkClick}>Manage Pins on Map</Link></li>
          <li><Link to="/admin-dashboard/users" onClick={handleLinkClick}>Manage Users</Link></li>
          <li><Link to="/booking-amenities" onClick={handleLinkClick}>Booking Amenities</Link></li>
          <li><Link to="/news" onClick={handleLinkClick}>News & Alerts</Link></li>
          <li><Link to="/activity-log" onClick={handleLinkClick}>Activity Log</Link></li>
          <li><Link to="/visitors-tracking" onClick={handleLinkClick}>Visitors Tracking</Link></li>
          <li><Link to="/admin-sales" onClick={handleLinkClick}>Sale & Rent List</Link></li>
          <li><Link to="/admin-faq" onClick={handleLinkClick}>Manage FAQs</Link></li>
          <li><Link to="/admin-service-fee" onClick={handleLinkClick}>Service Fee</Link></li>
          <li><Link to="/admin-bulletin" onClick={handleLinkClick}>Bulletin Board</Link></li>
          <li><Link to="/admin-maintenance-requests" onClick={handleLinkClick}>Maintenance Requests</Link></li>
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;

