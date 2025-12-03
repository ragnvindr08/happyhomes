import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AdminMaintenanceRequests.css";
import "./AdminDashboard.css";
import { getToken, logout } from "../utils/auth";
import API_URL from "../utils/config";
import Sidebar from "./Sidebar";

interface MaintenanceRequest {
  id: number;
  homeowner: number;
  homeowner_name: string;
  homeowner_email: string;
  maintenance_type: string;
  maintenance_type_display: string;
  description: string;
  preferred_date: string;
  preferred_time: string;
  is_urgent: boolean;
  use_external_contractor: boolean;
  external_contractor_name?: string;
  external_contractor_contact?: string;
  external_contractor_company?: string;
  status: 'pending' | 'approved' | 'declined' | 'in_progress' | 'completed';
  status_display: string;
  approved_by?: number | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  declined_reason?: string | null;
  admin_feedback?: string | null;
  created_at: string;
  updated_at: string;
}

const AdminMaintenanceRequests: React.FC = () => {
  const navigate = useNavigate();
  const token = getToken();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'declined' | 'urgent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<MaintenanceRequest | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [requestForFeedback, setRequestForFeedback] = useState<MaintenanceRequest | null>(null);

  useEffect(() => {
    if (!token) {
      toast.error('Please login to access this page');
      navigate('/login');
      return;
    }
    fetchRequests();
  }, [token, navigate]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/maintenance-requests/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setRequests(data);
    } catch (err: any) {
      console.error('Error fetching maintenance requests:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        logout();
        navigate('/login');
      } else {
        toast.error('Failed to fetch maintenance requests');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const response = await axios.post(
        `${API_URL}/maintenance-requests/${id}/approve/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Maintenance request approved! Email sent to homeowner.');
      await fetchRequests();
    } catch (err: any) {
      console.error('Error approving request:', err);
      toast.error(err.response?.data?.error || 'Failed to approve request');
    }
  };

  const handleDecline = async () => {
    if (!selectedRequest) return;
    
    if (!declineReason.trim()) {
      toast.error('Please provide a reason for declining');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/maintenance-requests/${selectedRequest.id}/decline/`,
        { declined_reason: declineReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Maintenance request declined. Email sent to homeowner.');
      setShowDeclineModal(false);
      setDeclineReason('');
      setSelectedRequest(null);
      await fetchRequests();
    } catch (err: any) {
      console.error('Error declining request:', err);
      toast.error(err.response?.data?.error || 'Failed to decline request');
    }
  };

  const openDeclineModal = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setShowDeclineModal(true);
  };

  const handleDeleteClick = (request: MaintenanceRequest) => {
    setRequestToDelete(request);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!requestToDelete) return;

    try {
      await axios.delete(`${API_URL}/maintenance-requests/${requestToDelete.id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Maintenance request deleted successfully!');
      setShowDeleteModal(false);
      setRequestToDelete(null);
      await fetchRequests();
    } catch (err: any) {
      console.error('Error deleting request:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        logout();
        navigate('/login');
      } else {
        toast.error(err.response?.data?.error || 'Failed to delete request');
      }
    }
  };

  const openFeedbackModal = (request: MaintenanceRequest) => {
    setRequestForFeedback(request);
    setFeedbackText(request.admin_feedback || '');
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = async () => {
    if (!requestForFeedback) return;

    try {
      await axios.post(
        `${API_URL}/maintenance-requests/${requestForFeedback.id}/add_feedback/`,
        { admin_feedback: feedbackText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Admin feedback updated successfully!');
      setShowFeedbackModal(false);
      setRequestForFeedback(null);
      setFeedbackText('');
      await fetchRequests();
    } catch (err: any) {
      console.error('Error updating feedback:', err);
      toast.error(err.response?.data?.error || 'Failed to update feedback');
    }
  };

  const formatTime = (time: string) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'approved': return '#4caf50';
      case 'declined': return '#f44336';
      case 'in_progress': return '#2196f3';
      case 'completed': return '#9c27b0';
      default: return '#757575';
    }
  };

  // Filter requests
  let filteredRequests = requests;

  if (filter === 'pending') {
    filteredRequests = requests.filter(r => r.status === 'pending');
  } else if (filter === 'approved') {
    filteredRequests = requests.filter(r => r.status === 'approved');
  } else if (filter === 'declined') {
    filteredRequests = requests.filter(r => r.status === 'declined');
  } else if (filter === 'urgent') {
    filteredRequests = requests.filter(r => r.is_urgent);
  }

  // Apply search filter
  if (searchQuery) {
    filteredRequests = filteredRequests.filter(r =>
      r.homeowner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.maintenance_type_display.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.homeowner_email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Sort by created_at (newest first), then by urgency
  filteredRequests = [...filteredRequests].sort((a, b) => {
    if (a.is_urgent && !b.is_urgent) return -1;
    if (!a.is_urgent && b.is_urgent) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="dashboard-layout">
        <Sidebar />
        
        <div className="admin-maintenance-container">
          <div className="maintenance-header">
            <h1>🔧 Maintenance Requests Management</h1>
            <p>Review and manage homeowner maintenance requests</p>
          </div>

          {/* Filters and Search */}
          <div className="filters-section">
if th       <div className="filters-row">
              <div className="filter-dropdown-wrapper">
                <label htmlFor="filter-select">Filter by Status:</label>
                <select
                  id="filter-select"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as typeof filter)}
                  className="filter-dropdown"
                >
                  <option value="all">All ({requests.length})</option>
                  <option value="pending">Pending ({requests.filter(r => r.status === 'pending').length})</option>
                  <option value="urgent">⚠️ Urgent ({requests.filter(r => r.is_urgent).length})</option>
                  <option value="approved">Approved ({requests.filter(r => r.status === 'approved').length})</option>
                  <option value="declined">Declined ({requests.filter(r => r.status === 'declined').length})</option>
                </select>
              </div>

              <div className="search-section">
                <input
                  type="text"
                  placeholder="Search by homeowner, type, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          </div>

          {/* Requests List */}
          {loading ? (
            <div className="loading-state">
              <p>Loading maintenance requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="empty-state">
              <p>No maintenance requests found.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="maintenance-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Homeowner</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Urgent</th>
                    <th>External</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr 
                      key={request.id}
                      className={request.is_urgent ? 'urgent-row' : ''}
                    >
                      <td>#{request.id}</td>
                      <td>
                        <div className="homeowner-cell">
                          <div className="homeowner-name">{request.homeowner_name}</div>
                          <div className="homeowner-email">{request.homeowner_email}</div>
                        </div>
                      </td>
                      <td>{request.maintenance_type_display}</td>
                      <td>
                        <div className="description-cell" title={request.description}>
                          {request.description.length > 50 
                            ? `${request.description.substring(0, 50)}...` 
                            : request.description}
                        </div>
                        {request.use_external_contractor && (
                          <div className="external-badge-small">
                            ⚠️ External: {request.external_contractor_name}
                          </div>
                        )}
                      </td>
                      <td>{new Date(request.preferred_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}</td>
                      <td>{formatTime(request.preferred_time)}</td>
                      <td>
                        {request.is_urgent ? (
                          <span className="urgent-indicator">⚠️</span>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td>
                        {request.use_external_contractor ? (
                          <span className="external-indicator">Yes</span>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`status-badge status-${request.status}`}
                          style={{ backgroundColor: getStatusColor(request.status) }}
                        >
                          {request.status_display}
                        </span>
                        {request.admin_feedback && (
                          <div style={{ marginTop: '4px', fontSize: '11px', color: '#2196f3', fontStyle: 'italic' }}>
                            💬 {request.admin_feedback.length > 50 
                              ? `${request.admin_feedback.substring(0, 50)}...` 
                              : request.admin_feedback}
                          </div>
                        )}
                      </td>
                      <td>
                        {request.status === 'pending' ? (
                          <div className="action-buttons">
                            <button
                              className="approve-btn"
                              onClick={() => handleApprove(request.id)}
                              title="Approve request"
                            >
                              ✓ Approve
                            </button>
                            <button
                              className="decline-btn"
                              onClick={() => openDeclineModal(request)}
                              title="Decline request"
                            >
                              ✗ Decline
                            </button>
                            <button
                              className="feedback-btn"
                              onClick={() => openFeedbackModal(request)}
                              title="Add/Update admin feedback"
                              style={{ backgroundColor: '#2196f3', color: 'white', padding: '6px 12px', fontSize: '12px', marginRight: '5px' }}
                            >
                              💬 Feedback
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteClick(request)}
                              title="Delete request"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        ) : request.status === 'declined' && request.declined_reason ? (
                          <div className="action-buttons">
                            <div className="declined-info" title={request.declined_reason}>
                              <span className="declined-icon">❌</span>
                              <span className="declined-text">Declined</span>
                            </div>
                            <button
                              className="feedback-btn"
                              onClick={() => openFeedbackModal(request)}
                              title="Add/Update admin feedback"
                              style={{ backgroundColor: '#2196f3', color: 'white', padding: '6px 12px', fontSize: '12px', marginRight: '5px' }}
                            >
                              💬 Feedback
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteClick(request)}
                              title="Delete request"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        ) : request.status === 'approved' && request.approved_by_name ? (
                          <div className="action-buttons">
                            <div className="approved-info">
                              <span className="approved-icon">✅</span>
                              <span className="approved-text">Approved</span>
                            </div>
                            <button
                              className="feedback-btn"
                              onClick={() => openFeedbackModal(request)}
                              title="Add/Update admin feedback"
                              style={{ backgroundColor: '#2196f3', color: 'white', padding: '6px 12px', fontSize: '12px', marginRight: '5px' }}
                            >
                              💬 Feedback
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteClick(request)}
                              title="Delete request"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons">
                            <button
                              className="feedback-btn"
                              onClick={() => openFeedbackModal(request)}
                              title="Add/Update admin feedback"
                              style={{ backgroundColor: '#2196f3', color: 'white', padding: '6px 12px', fontSize: '12px', marginRight: '5px' }}
                            >
                              💬 Feedback
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteClick(request)}
                              title="Delete request"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Decline Modal */}
      {showDeclineModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowDeclineModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Decline Maintenance Request</h2>
            <p>
              <strong>Request:</strong> {selectedRequest.maintenance_type_display}
            </p>
            <p>
              <strong>Homeowner:</strong> {selectedRequest.homeowner_name}
            </p>
            
            <div className="modal-form-group">
              <label htmlFor="decline-reason">
                Reason for Decline <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                id="decline-reason"
                rows={4}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Please provide a reason for declining this request..."
                required
              />
            </div>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason('');
                  setSelectedRequest(null);
                }}
              >
                Cancel
              </button>
              <button
                className="confirm-decline-btn"
                onClick={handleDecline}
                disabled={!declineReason.trim()}
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Feedback Modal */}
      {showFeedbackModal && requestForFeedback && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add/Update Admin Feedback</h2>
            <p>
              <strong>Request:</strong> {requestForFeedback.maintenance_type_display}
            </p>
            <p>
              <strong>Homeowner:</strong> {requestForFeedback.homeowner_name}
            </p>
            <p>
              <strong>Status:</strong> {requestForFeedback.status_display}
            </p>
            
            <div className="modal-form-group">
              <label htmlFor="admin-feedback">
                Admin Feedback / Notes
              </label>
              <textarea
                id="admin-feedback"
                rows={6}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Add feedback, notes, or instructions for this maintenance request..."
              />
              <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                This feedback will be visible to the homeowner.
              </small>
            </div>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackText('');
                  setRequestForFeedback(null);
                }}
              >
                Cancel
              </button>
              <button
                className="confirm-decline-btn"
                onClick={handleFeedbackSubmit}
                style={{ backgroundColor: '#2196f3' }}
              >
                Save Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && requestToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Maintenance Request</h2>
            <p>
              <strong>Request:</strong> {requestToDelete.maintenance_type_display}
            </p>
            <p>
              <strong>Homeowner:</strong> {requestToDelete.homeowner_name}
            </p>
            <p>
              <strong>Status:</strong> {requestToDelete.status_display}
            </p>
            <p>
              Are you sure you want to delete this maintenance request? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setRequestToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="confirm-delete-btn"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminMaintenanceRequests;

