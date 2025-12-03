import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotifications } from './NotificationContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AdminDashboard.css';
import { getToken } from '../utils/auth';
import API_URL from '../utils/config';
import Sidebar from './Sidebar';

import userIcon from "../images/user.png";
import bookingIcon from "../images/booking.png";
import pendingIcon from "../images/pending.png";
import mapIcon from "../images/map.png";
import occupiedIcon from "../images/occupied.png";
import availableIcon from "../images/available.png";
import visitorIcon from "../images/visitor.png";
import documentIcon from "../images/document.png";


import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#4caf50', '#2c7c4bff', '#262927ff'];

const AdminDashboard: React.FC = () => {
  const { addNotification } = useNotifications();
  const [stats, setStats] = useState({ total_users: 0, active_bookings: 0, pending_approvals: 0 });
  const [pinStats, setPinStats] = useState({ total_pins: 0, occupied: 0, available: 0, max_subdivisions: 200 });
  const [additionalStats, setAdditionalStats] = useState({
    visitorsCount: 0,
    saleRentCount: 0,
    pendingVerificationsCount: 0,
    serviceFeeCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = getToken();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const authHeaders = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
        
        // Fetch main dashboard stats
        const [dashboardRes, pinRes] = await Promise.all([
          fetch(`${API_URL}/admin/dashboard-stats/`, { headers: authHeaders }),
          fetch(`${API_URL}/admin/pin-stats/`, { headers: authHeaders }),
        ]);
        if (!dashboardRes.ok) throw new Error('Failed to fetch dashboard stats');
        if (!pinRes.ok) throw new Error('Failed to fetch pin stats');
        const dashboardData = await dashboardRes.json();
        const pinData = await pinRes.json();
        setStats(dashboardData);
        setPinStats(pinData);

        // Fetch additional stats for missing cards
        const [
          visitorsRes,
          housesRes,
          pendingVerificationsRes,
          serviceFeeRes,
        ] = await Promise.all([
          fetch(`${API_URL}/admin/visitors/`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_URL}/houses/`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_URL}/admin/pending-verifications/`, { headers: authHeaders }).catch(() => null),
          fetch(`${API_URL}/service-fees/`, { headers: authHeaders }).catch(() => null),
        ]);

        // Extract counts from responses - helper function to safely get JSON
        const getJsonData = async (res: Response | null): Promise<any> => {
          if (!res || !res.ok) return [];
          try {
            return await res.json();
          } catch {
            return [];
          }
        };

        const visitorsData = await getJsonData(visitorsRes);
        const housesData = await getJsonData(housesRes);
        const pendingVerificationsData = await getJsonData(pendingVerificationsRes);
        const serviceFeeData = await getJsonData(serviceFeeRes);

        // Handle paginated responses or arrays
        const getCount = (data: any) => {
          if (Array.isArray(data)) return data.length;
          if (data?.results && Array.isArray(data.results)) return data.results.length;
          if (data?.count !== undefined) return data.count;
          return 0;
        };

        setAdditionalStats({
          visitorsCount: getCount(visitorsData),
          saleRentCount: getCount(housesData),
          pendingVerificationsCount: getCount(pendingVerificationsData),
          serviceFeeCount: getCount(serviceFeeData),
        });
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchStats();
  }, [token]);



  const pinChartData = [
    { name: 'Occupied', value: pinStats.occupied },
    { name: 'Available', value: pinStats.available },
  ];

  const bookingChartData = [
    { name: 'Total Users', value: stats.total_users },
    { name: 'Active Bookings', value: stats.active_bookings },
    { name: 'Pending Approvals', value: stats.pending_approvals },
  ];

  const navigate = useNavigate();

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="dashboard-layout">
        <Sidebar />

        <main className="dashboard-main">
          {/* <p className="dashboard-subtitle">Here you can manage users, monitor activities, and configure your app.</p> */}

          {loading ? (
            <div>Loading dashboard stats...</div>
          ) : error ? (
            <div style={{ color: 'red' }}>Error: {error}</div>
          ) : (
            <>


<div className="dashboard-cards">
  <div className="card">
    <div className="card-content">
      <img src={userIcon} alt="Users" />
      <div className="card-text">
        <h3>Total Users</h3>
        <p>{stats.total_users}</p>
      </div>
    </div>
  </div>

  <div className="card">
    <div className="card-content">
      <img src={bookingIcon} alt="Bookings" />
      <div className="card-text">
        <h3>Active Bookings</h3>
        <p>{stats.active_bookings}</p>
      </div>
    </div>
  </div>

  <div className="card">
    <div className="card-content">
      <img src={pendingIcon} alt="Pending" />
      <div className="card-text">
        <h3>Pending Booking</h3>
        <p>{stats.pending_approvals}</p>
      </div>
    </div>
  </div>

  <div className="card">
    <div className="card-content">
      <img src={occupiedIcon} alt="Occupied" />
      <div className="card-text">
        <h3>Occupied</h3>
        <p>{pinStats.occupied}</p>
      </div>
    </div>
  </div>

  <div className="card">
    <div className="card-content">
      <img src={availableIcon} alt="Available" />
      <div className="card-text">
        <h3>Available Pins</h3>
        <p>{pinStats.available}</p>
      </div>
    </div>
  </div>

  <Link to="/visitors-tracking" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
    <div className="card-content">
      <img src={visitorIcon} alt="Visitors Tracking" />
      <div className="card-text">
        <h3>Visitors Tracking</h3>
        <p>{additionalStats.visitorsCount}</p>
      </div>
    </div>
  </Link>

  <Link to="/admin-sales" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
    <div className="card-content">
      <img src={mapIcon} alt="Sale & Rent List" />
      <div className="card-text">
        <h3>Sale & Rent List</h3>
        <p>{additionalStats.saleRentCount}</p>
      </div>
    </div>
  </Link>

  <Link to="/admin-service-fee" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
    <div className="card-content">
      <img src={documentIcon} alt="Service Fee" />
      <div className="card-text">
        <h3>Service Fee</h3>
        <p>{additionalStats.serviceFeeCount}</p>
      </div>
    </div>
  </Link>
</div>



<div className="dashboard-graphs"> 
  <div className="graph-card">
    <div className="graph-header">
      <img src={occupiedIcon} alt="Occupied Icon" className="graph-icon" />
      <h3>Occupied and Availability</h3>
    </div>
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={pinChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
          {pinChartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>

  <div className="graph-card">
    <div className="graph-header">
      <img src={bookingIcon} alt="Booking Icon" className="graph-icon" />
      <h3>Booking & User Stats</h3>
    </div>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={bookingChartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#2c7c4bff" />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;
