import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./visitorsTracking.css";
import "./AdminDashboard.css";
import { getToken, logout } from "../utils/auth";
import Sidebar from "./Sidebar";

// Interfaces
interface Visitor {
  id: number;
  name: string;
  gmail?: string;
  contact_number?: string;
  reason?: string;
  status: string;
  time_in?: string;
  time_out?: string;
}

interface VisitorRequestItem {
  id: number;
  resident: number;
  resident_username: string;
  resident_email: string;
  resident_name: string;
  visitor_name: string;
  visitor_email: string;
  visitor_contact_number: string;
  vehicle_plate_number?: string | null;
  reason?: string;
  one_time_pin?: string | null;
  visit_date: string;
  visit_end_date?: string | null;
  visit_start_time: string;
  visit_end_time: string;
  status: 'pending_admin' | 'approved' | 'declined' | 'expired' | 'used';
  approved_by?: number | null;
  approved_by_username?: string | null;
  approved_at?: string | null;
  declined_reason?: string | null;
  pdf_generated?: boolean;
  pdf_file_path?: string | null;
  pdf_url?: string | null;
  email_sent?: boolean;
  email_sent_at?: string | null;
  is_valid?: boolean;
  created_at: string;
  updated_at: string;
}

const API_URL = "http://127.0.0.1:8000/api";
const VISITORS_API = `${API_URL}/admin/visitors/`;
const VISITOR_REQUESTS_API = `${API_URL}/visitor-requests/`;

const VisitorsTracking: React.FC = () => {
  const navigate = useNavigate();
  const token = getToken();

  // Visitor states
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [visitorSearchQuery, setVisitorSearchQuery] = useState("");
  const [visitorFilter, setVisitorFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    gmail: "",
    contact_number: "",
    reason: "",
    status: "pending",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Visitor Request states
  const [visitorRequests, setVisitorRequests] = useState<VisitorRequestItem[]>([]);
  const [visitorRequestFilter, setVisitorRequestFilter] = useState<'all' | 'pending_admin' | 'approved' | 'declined'>('all');
  const [visitorRequestSearch, setVisitorRequestSearch] = useState('');

  // Collapsible sections
  const [requestsExpanded, setRequestsExpanded] = useState(true);
  const [visitorsExpanded, setVisitorsExpanded] = useState(true);

  // Loading states
  const [loadingVisitors, setLoadingVisitors] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Please login to access this page');
      navigate('/login');
      return;
    }
    fetchVisitors();
    fetchVisitorRequests();
  }, [token, navigate]);

  // ==================== VISITOR FUNCTIONS ====================
  const fetchVisitors = async () => {
    setLoadingVisitors(true);
    try {
      const res = await axios.get(VISITORS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVisitors(res.data);
    } catch (err) {
      console.error("Failed to fetch visitors", err);
      toast.error("Failed to fetch visitors");
    } finally {
      setLoadingVisitors(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${VISITORS_API}${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Visitor deleted successfully");
      fetchVisitors();
    } catch (err) {
      console.error("Failed to delete visitor", err);
      toast.error("Failed to delete visitor");
    }
  };

  const handleAddVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: any = {
        name: formData.name,
        status: formData.status,
      };

      if (formData.gmail) payload.gmail = formData.gmail;
      if (formData.contact_number) payload.contact_number = formData.contact_number;
      if (formData.reason) payload.reason = formData.reason;

      await axios.post(VISITORS_API, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Visitor added successfully");
      setIsModalOpen(false);
      setFormData({
        name: "",
        gmail: "",
        contact_number: "",
        reason: "",
        status: "pending",
      });
      fetchVisitors();
    } catch (err: any) {
      console.error("Failed to add visitor", err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || "Failed to add visitor";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ==================== VISITOR REQUEST FUNCTIONS ====================
  const fetchVisitorRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await axios.get(VISITOR_REQUESTS_API, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setVisitorRequests(data);
    } catch (err: any) {
      console.error('Error fetching visitor requests:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        logout();
        navigate('/login');
      }
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApproveVisitorRequest = async (id: number) => {
    try {
      const response = await axios.post(
        `${VISITOR_REQUESTS_API}${id}/approve/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Visitor request approved! Email sent to homeowner with PDF.');
      await fetchVisitorRequests();
    } catch (err: any) {
      console.error('Error approving visitor request:', err);
      let errorMessage = 'Failed to approve visitor request.';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          logout();
          navigate('/login');
        } else if (err.response.data) {
          if (err.response.data.error) {
            errorMessage = err.response.data.error;
          } else if (err.response.data.detail) {
            errorMessage = err.response.data.detail;
          }
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const handleDeclineVisitorRequest = async (id: number) => {
    const declinedReason = window.prompt('Please provide a reason for declining this request (optional):') || '';
    
    try {
      const response = await axios.post(
        `${VISITOR_REQUESTS_API}${id}/decline/`,
        { declined_reason: declinedReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Visitor request declined.');
      await fetchVisitorRequests();
    } catch (err: any) {
      console.error('Error declining visitor request:', err);
      let errorMessage = 'Failed to decline visitor request.';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          logout();
          navigate('/login');
        } else if (err.response.data) {
          if (err.response.data.error) {
            errorMessage = err.response.data.error;
          } else if (err.response.data.detail) {
            errorMessage = err.response.data.detail;
          }
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const handleDeleteVisitorRequest = async (id: number) => {
    const request = visitorRequests.find(r => r.id === id);
    const isUsed = request?.status === 'used';
    
    const confirmMessage = isUsed 
      ? 'This request has been used (visitor already checked in). Are you sure you want to delete it? This action cannot be undone.'
      : 'Are you sure you want to delete this visitor request? This action cannot be undone.';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      await axios.delete(
        `${VISITOR_REQUESTS_API}${id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Visitor request deleted successfully.');
      await fetchVisitorRequests();
    } catch (err: any) {
      console.error('Error deleting visitor request:', err);
      let errorMessage = 'Failed to delete visitor request.';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          logout();
          navigate('/login');
        } else if (err.response.data) {
          if (err.response.data.error) {
            errorMessage = err.response.data.error;
          } else if (err.response.data.detail) {
            errorMessage = err.response.data.detail;
          }
        }
      }
      
      toast.error(errorMessage);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  const formatTime = (time?: string) => {
    if (!time) return "-";
    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const formatDate = (time?: string) => {
    if (!time) return "-";
    const date = new Date(time);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_admin': return '#ff9800';
      case 'approved': return '#4CAF50';
      case 'declined': return '#f44336';
      case 'expired': return '#9e9e9e';
      case 'used': return '#2196F3';
      case 'pending': return '#ff9800';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_admin': return 'Pending Admin Approval';
      case 'approved': return 'Approved';
      case 'declined': return 'Declined';
      case 'expired': return 'Expired';
      case 'used': return 'Used';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // ==================== FILTERED DATA ====================
  // Filter visitor requests
  const filteredRequests = visitorRequests.filter(req => {
    if (visitorRequestFilter !== 'all' && req.status !== visitorRequestFilter) {
      return false;
    }
    if (visitorRequestSearch) {
      const searchLower = visitorRequestSearch.toLowerCase();
      return (
        req.visitor_name.toLowerCase().includes(searchLower) ||
        req.visitor_email.toLowerCase().includes(searchLower) ||
        req.resident_username.toLowerCase().includes(searchLower) ||
        (req.one_time_pin && req.one_time_pin.includes(searchLower))
      );
    }
    return true;
  });

  // Filter visitors
  const filteredVisitors = visitors.filter(v => {
    // Status filter
    if (visitorFilter === 'active') {
      if (!v.time_in || v.time_out) return false;
    } else if (visitorFilter === 'completed') {
      if (!v.time_out) return false;
    }

    // Search filter
    if (visitorSearchQuery) {
      const query = visitorSearchQuery.toLowerCase();
      return (
        v.name.toLowerCase().includes(query) ||
        (v.contact_number?.toLowerCase().includes(query) ?? false) ||
        v.status.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // ==================== STATS ====================
  const requestStats = {
    total: visitorRequests.length,
    pending: visitorRequests.filter(r => r.status === 'pending_admin').length,
    approved: visitorRequests.filter(r => r.status === 'approved').length,
    declined: visitorRequests.filter(r => r.status === 'declined').length,
  };

  const visitorStats = {
    total: visitors.length,
    checkedInToday: visitors.filter(v => v.time_in && new Date(v.time_in).toDateString() === new Date().toDateString()).length,
    totalTimedOut: visitors.filter(v => v.time_out).length,
    active: visitors.filter(v => v.time_in && !v.time_out).length,
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="dashboard-layout">
        <Sidebar />

        <main className="dashboard-main">
          <div className="visitors-tracking-container">
            <div className="header-section">
              <h2>Visitors Tracking</h2>
              <p style={{ color: '#666', marginTop: '5px' }}>Manage visitor requests and track visitor check-ins</p>
            </div>

            {/* Combined Stats Dashboard */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '20px', 
              marginBottom: '30px' 
            }}>
              {/* Visitor Request Stats */}
              <div style={{ 
                padding: '20px', 
                background: '#3b82f6', 
                borderRadius: '12px', 
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                color: 'white'
              }}>
                <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>Total Requests</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{requestStats.total}</div>
              </div>
              <div style={{ 
                padding: '20px', 
                background: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>{requestStats.pending}</div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Pending Approval</div>
              </div>
              <div style={{ 
                padding: '20px', 
                background: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>{requestStats.approved}</div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Approved</div>
              </div>
              
              {/* Visitor Stats */}
              <div style={{ 
                padding: '20px', 
                background: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>{visitorStats.total}</div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Total Visitors</div>
              </div>
              <div style={{ 
                padding: '20px', 
                background: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4b4b4b' }}>{visitorStats.checkedInToday}</div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Checked-in Today</div>
              </div>
              <div style={{ 
                padding: '20px', 
                background: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>{visitorStats.active}</div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Active Now</div>
              </div>
            </div>

            {/* Visitor Requests Section */}
            <div style={{ 
              marginBottom: '30px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <div 
                style={{
                  padding: '20px',
                  background: '#f8f9fa',
                  borderBottom: '2px solid #e0e0e0',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onClick={() => setRequestsExpanded(!requestsExpanded)}
              >
                <h3 style={{ margin: 0, color: '#2e6F40', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span></span>
                  Visitor Requests
                  {requestStats.pending > 0 && (
                    <span style={{
                      background: '#ff9800',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {requestStats.pending} pending
                    </span>
                  )}
                </h3>
                <span style={{ fontSize: '20px', color: '#666' }}>
                  {requestsExpanded ? '▼' : '▶'}
                </span>
              </div>

              {requestsExpanded && (
                <div style={{ padding: '20px' }}>
                  {/* Filters */}
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <select
                      value={visitorRequestFilter}
                      onChange={(e) => setVisitorRequestFilter(e.target.value as any)}
                      style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                    >
                      <option value="all">All Status</option>
                      <option value="pending_admin">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="declined">Declined</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Search by visitor name, email, homeowner, or PIN..."
                      value={visitorRequestSearch}
                      onChange={(e) => setVisitorRequestSearch(e.target.value)}
                      style={{ flex: 1, minWidth: '200px', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                    />
                    <button
                      onClick={fetchVisitorRequests}
                      disabled={loadingRequests}
                      style={{ 
                        padding: '10px 20px', 
                        backgroundColor: '#2e6F40', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '6px', 
                        cursor: 'pointer', 
                        fontSize: '14px', 
                        fontWeight: 'bold' 
                      }}
                    >
                      {loadingRequests ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>

                  {/* Requests List */}
                  {loadingRequests ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Loading requests...</div>
                  ) : filteredRequests.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                      <p style={{ fontSize: '16px' }}>No visitor requests found.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '20px' }}>
                      {filteredRequests.map((req) => (
                        <div
                          key={req.id}
                          style={{
                            padding: '20px',
                            background: '#f8f9fa',
                            borderRadius: '8px',
                            borderLeft: `4px solid ${getStatusColor(req.status)}`
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                            <div>
                              <h4 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{req.visitor_name}</h4>
                              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', fontSize: '14px', color: '#666' }}>
                                <span><strong>Email:</strong> {req.visitor_email}</span>
                                <span><strong>Contact:</strong> {req.visitor_contact_number || 'N/A'}</span>
                                {req.vehicle_plate_number && (
                                  <span><strong>Vehicle Plate:</strong> {req.vehicle_plate_number}</span>
                                )}
                                <span><strong>Homeowner:</strong> {req.resident_name || req.resident_username}</span>
                              </div>
                            </div>
                            <span
                              style={{
                                padding: '6px 12px',
                                borderRadius: '12px',
                                backgroundColor: getStatusColor(req.status),
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              {getStatusText(req.status)}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '15px', fontSize: '14px' }}>
                            <div><strong>Visit Date:</strong> {new Date(req.visit_date).toLocaleDateString()}
                              {req.visit_end_date && req.visit_end_date !== req.visit_date && (
                                <span> - {new Date(req.visit_end_date).toLocaleDateString()}</span>
                              )}
                            </div>
                            <div><strong>Time:</strong> {req.visit_start_time} - {req.visit_end_time}</div>
                            {req.one_time_pin && (
                              <div>
                                <strong>PIN:</strong> <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold', color: '#2e6F40' }}>{req.one_time_pin}</span>
                              </div>
                            )}
                            {req.reason && <div><strong>Reason:</strong> {req.reason}</div>}
                          </div>

                          {req.approved_by_username && (
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                              <strong>Approved by:</strong> {req.approved_by_username} on {req.approved_at ? new Date(req.approved_at).toLocaleString() : 'N/A'}
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                            {req.status === 'pending_admin' && (
                              <>
                                <button
                                  onClick={() => handleApproveVisitorRequest(req.id)}
                                  style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() => handleDeclineVisitorRequest(req.id)}
                                  style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  ✗ Decline
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteVisitorRequest(req.id)}
                              style={{
                                padding: '10px 20px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold'
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>

                          {req.pdf_url && (
                            <div style={{ marginTop: '10px' }}>
                              <a
                                href={req.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: '#2196F3',
                                  color: 'white',
                                  textDecoration: 'none',
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  display: 'inline-block'
                                }}
                              >
                                📄 Download PDF
                              </a>
                            </div>
                          )}

                          <div style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                            Created: {new Date(req.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Visitors Section */}
            <div style={{ 
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <div 
                style={{
                  padding: '20px',
                  background: '#f8f9fa',
                  borderBottom: '2px solid #e0e0e0',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onClick={() => setVisitorsExpanded(!visitorsExpanded)}
              >
                <h3 style={{ margin: 0, color: '#2e6F40', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>👥</span>
                  Visitors
                  {visitorStats.active > 0 && (
                    <span style={{
                      background: '#22c55e',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {visitorStats.active} active
                    </span>
                  )}
                </h3>
                <span style={{ fontSize: '20px', color: '#666' }}>
                  {visitorsExpanded ? '▼' : '▶'}
                </span>
              </div>

              {visitorsExpanded && (
                <div style={{ padding: '20px' }}>
                  {/* Search and Filter */}
                  <div className="search-add-container">
                    <select
                      value={visitorFilter}
                      onChange={(e) => setVisitorFilter(e.target.value as any)}
                      style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                    >
                      <option value="all">All Visitors</option>
                      <option value="active">Active (Checked In)</option>
                      <option value="completed">Completed (Checked Out)</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Search by name, contact, or status..."
                      value={visitorSearchQuery}
                      onChange={(e) => setVisitorSearchQuery(e.target.value)}
                      className="search-input"
                    />
                    <button
                      className="btn-add-visitor"
                      onClick={() => setIsModalOpen(true)}
                    >
                      + Add Visitor
                    </button>
                  </div>

                  {/* Visitors Table */}
                  <div className="table-wrapper">
                    <table className="visitors-table">
                      <thead>
                        <tr>
                          <th>Name of Visitors</th>
                          <th>Contact</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Time In</th>
                          <th>Time Out</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingVisitors ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Loading visitors...</td>
                          </tr>
                        ) : filteredVisitors.map((v) => (
                          <tr key={v.id}>
                            <td style={{ fontWeight: 500, color: '#2c3e50' }}>{v.name}</td>
                            <td style={{ color: '#666', fontFamily: 'monospace' }}>{v.contact_number || "-"}</td>
                            <td>
                              <span style={{
                                display: 'inline-block',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                ...(v.status === 'approved' 
                                  ? { 
                                      backgroundColor: '#d4edda', 
                                      color: '#155724',
                                      border: '1px solid #c3e6cb'
                                    }
                                  : v.status === 'pending' 
                                  ? { 
                                      backgroundColor: '#fff3cd', 
                                      color: '#856404',
                                      border: '1px solid #ffeaa7'
                                    }
                                  : { 
                                      backgroundColor: '#f8d7da', 
                                      color: '#721c24',
                                      border: '1px solid #f5c6cb'
                                    })
                              }}>
                                {v.status}
                              </span>
                            </td>
                            <td style={{ color: '#555', fontSize: '0.85rem' }}>
                              {formatDate(v.time_in || v.time_out || '')}
                            </td>
                            <td style={{ color: '#666', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                              {formatTime(v.time_in)}
                            </td>
                            <td style={{ color: '#666', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                              {formatTime(v.time_out)}
                            </td>
                            <td>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete visitor "${v.name}"?`)) {
                                    handleDelete(v.id);
                                  }
                                }}
                                style={{
                                  padding: '8px 16px',
                                  background: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  boxShadow: '0 2px 4px rgba(220,53,69,0.3)',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(220,53,69,0.4)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(220,53,69,0.3)';
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {!loadingVisitors && filteredVisitors.length === 0 && (
                          <tr>
                            <td colSpan={7} style={{ 
                              textAlign: 'center', 
                              padding: '60px 20px', 
                              color: '#666',
                              background: '#f8f9fa'
                            }}>
                              <div style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }}>👥</div>
                              <h3 style={{ marginBottom: '10px', color: '#333' }}>No Visitors Found</h3>
                              <p style={{ margin: 0 }}>
                                {visitorSearchQuery 
                                  ? 'No visitors match your search. Try adjusting your search query.' 
                                  : 'No visitors have been registered yet. Click "+ Add Visitor" to add a new visitor.'}
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add Visitor Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Visitor</h3>
              <button
                className="modal-close"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddVisitor}>
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="gmail">Email</label>
                <input
                  type="email"
                  id="gmail"
                  name="gmail"
                  value={formData.gmail}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact_number">Contact Number</label>
                <input
                  type="text"
                  id="contact_number"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reason">Reason for Visit</label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="declined">Declined</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add Visitor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default VisitorsTracking;
