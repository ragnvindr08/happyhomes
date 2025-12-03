import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from './NavBar';
import Footer from './Footer';
import { getToken, logout } from '../utils/auth';
import API_URL from '../utils/config';
import { toast, ToastContainer } from 'react-toastify';
import './MaintenanceRequestPage.css';

interface MaintenanceRequest {
  id: number;
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
  status: string;
  status_display: string;
  declined_reason?: string;
  admin_feedback?: string;
  created_at: string;
}

const MAINTENANCE_TYPES = [
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'aircon', label: 'Air Conditioning Repair' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'renovation', label: 'House Renovation' },
  { value: 'painting', label: 'Painting' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'appliance', label: 'Appliance Repair' },
  { value: 'structural_repairs', label: 'Structural Repairs' },
  { value: 'other', label: 'Other' },
];

const MaintenanceRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const token = getToken();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<MaintenanceRequest | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    maintenance_type: '',
    description: '',
    preferred_date: '',
    preferred_time: '',
    is_urgent: false,
    use_external_contractor: false,
    external_contractor_name: '',
    external_contractor_contact: '',
    external_contractor_company: '',
  });

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchRequests();
  }, [token, navigate]);

  const fetchRequests = async () => {
    const currentToken = getToken();
    if (!currentToken) {
      toast.error('Please login to access this page');
      navigate('/login');
      return;
    }
    
    try {
      const response = await axios.get(`${API_URL}/maintenance-requests/`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      setRequests(response.data);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        logout();
        navigate('/login');
      } else {
        toast.error('Failed to fetch maintenance requests');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const currentToken = getToken();
    if (!currentToken) {
      toast.error('Please login to access this page');
      navigate('/login');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        // Only include external contractor fields if use_external_contractor is true
        external_contractor_name: formData.use_external_contractor ? formData.external_contractor_name : '',
        external_contractor_contact: formData.use_external_contractor ? formData.external_contractor_contact : '',
        external_contractor_company: formData.use_external_contractor ? formData.external_contractor_company : '',
      };

      if (editingRequest) {
        // Update existing request
        await axios.patch(`${API_URL}/maintenance-requests/${editingRequest.id}/`, payload, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
        toast.success('Maintenance request updated successfully!');
        setEditingRequest(null);
      } else {
        // Create new request
        await axios.post(`${API_URL}/maintenance-requests/`, payload, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
        toast.success('Maintenance request submitted successfully!');
      }

      setShowForm(false);
      setFormData({
        maintenance_type: '',
        description: '',
        preferred_date: '',
        preferred_time: '',
        is_urgent: false,
        use_external_contractor: false,
        external_contractor_name: '',
        external_contractor_contact: '',
        external_contractor_company: '',
      });
      fetchRequests();
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        logout();
        navigate('/login');
      } else {
        toast.error(error.response?.data?.error || (editingRequest ? 'Failed to update request' : 'Failed to submit request'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (request: MaintenanceRequest) => {
    if (request.status !== 'pending') {
      toast.error('You can only edit pending requests');
      return;
    }
    
    // Check if date/time has passed
    const dateTimePassed = isDateTimePassed(request.preferred_date, request.preferred_time);
    if (dateTimePassed) {
      toast.warning('The preferred date and time have passed. You can only edit other fields.');
    }
    
    setEditingRequest(request);
    setFormData({
      maintenance_type: request.maintenance_type,
      description: request.description,
      preferred_date: request.preferred_date,
      preferred_time: request.preferred_time,
      is_urgent: request.is_urgent,
      use_external_contractor: request.use_external_contractor,
      external_contractor_name: request.external_contractor_name || '',
      external_contractor_contact: request.external_contractor_contact || '',
      external_contractor_company: request.external_contractor_company || '',
    });
    setShowForm(true);
  };

  const handleDeleteClick = (request: MaintenanceRequest) => {
    setRequestToDelete(request);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!requestToDelete) return;

    const currentToken = getToken();
    if (!currentToken) {
      toast.error('Please login to access this page');
      navigate('/login');
      return;
    }

    try {
      await axios.delete(`${API_URL}/maintenance-requests/${requestToDelete.id}/`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });

      toast.success('Maintenance request deleted successfully!');
      setShowDeleteModal(false);
      setRequestToDelete(null);
      fetchRequests();
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        logout();
        navigate('/login');
      } else {
        toast.error(error.response?.data?.error || 'Failed to delete request');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingRequest(null);
    setShowForm(false);
    setFormData({
      maintenance_type: '',
      description: '',
      preferred_date: '',
      preferred_time: '',
      is_urgent: false,
      use_external_contractor: false,
      external_contractor_name: '',
      external_contractor_contact: '',
      external_contractor_company: '',
    });
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

  const isDateTimePassed = (date: string, time: string): boolean => {
    if (!date || !time) return false;
    const preferredDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    return preferredDateTime < now;
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <NavBar />
      <div className="maintenance-request-page" style={{ marginTop: 0 }}>
        <div className="maintenance-container">
          <div className="maintenance-header">
            <h1>Maintenance Requests</h1>
            <p>Request maintenance services for your home</p>
            <button 
              className="btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Cancel' : '+ New Request'}
            </button>
          </div>

          {showForm && (
            <div className="maintenance-form-card">
              <h2>{editingRequest ? 'Edit Maintenance Request' : 'Create Maintenance Request'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Maintenance Type *</label>
                  <select
                    required
                    value={formData.maintenance_type}
                    onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })}
                  >
                    <option value="">Select type...</option>
                    {MAINTENANCE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the maintenance needed in detail..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Preferred Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.preferred_date}
                      onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      disabled={editingRequest ? isDateTimePassed(editingRequest.preferred_date, editingRequest.preferred_time) : false}
                      title={editingRequest && isDateTimePassed(editingRequest.preferred_date, editingRequest.preferred_time) 
                        ? "Cannot change date/time as the preferred date and time have already passed" 
                        : ""}
                    />
                    {editingRequest && isDateTimePassed(editingRequest.preferred_date, editingRequest.preferred_time) && (
                      <small style={{ color: '#f44336', display: 'block', marginTop: '4px' }}>
                        ⚠️ Date/time has passed and cannot be changed
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Preferred Time *</label>
                    <input
                      type="time"
                      required
                      value={formData.preferred_time}
                      onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                      disabled={editingRequest ? isDateTimePassed(editingRequest.preferred_date, editingRequest.preferred_time) : false}
                      title={editingRequest && isDateTimePassed(editingRequest.preferred_date, editingRequest.preferred_time) 
                        ? "Cannot change date/time as the preferred date and time have already passed" 
                        : ""}
                    />
                  </div>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_urgent}
                      onChange={(e) => setFormData({ ...formData, is_urgent: e.target.checked })}
                    />
                    <span className="urgent-label">⚠️ Urgent Request</span>
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.use_external_contractor}
                      onChange={(e) => setFormData({ ...formData, use_external_contractor: e.target.checked })}
                    />
                    <span>I want to use an external contractor (outside subdivision)</span>
                  </label>
                </div>

                {formData.use_external_contractor && (
                  <div className="external-contractor-section">
                    <h3>External Contractor Information</h3>
                    <div className="form-group">
                      <label>Contractor Name *</label>
                      <input
                        type="text"
                        required={formData.use_external_contractor}
                        value={formData.external_contractor_name}
                        onChange={(e) => setFormData({ ...formData, external_contractor_name: e.target.value })}
                        placeholder="Contractor's full name"
                      />
                    </div>

                    <div className="form-group">
                      <label>Contact Number *</label>
                      <input
                        type="tel"
                        required={formData.use_external_contractor}
                        value={formData.external_contractor_contact}
                        onChange={(e) => setFormData({ ...formData, external_contractor_contact: e.target.value })}
                        placeholder="Phone number"
                      />
                    </div>

                    <div className="form-group">
                      <label>Company Name (Optional)</label>
                      <input
                        type="text"
                        value={formData.external_contractor_company}
                        onChange={(e) => setFormData({ ...formData, external_contractor_company: e.target.value })}
                        placeholder="Company name"
                      />
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? (editingRequest ? 'Updating...' : 'Submitting...') : (editingRequest ? 'Update Request' : 'Submit Request')}
                  </button>
                  {editingRequest && (
                    <button type="button" className="btn-cancel" onClick={handleCancelEdit} disabled={loading}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          <div className="requests-list">
            <h2>My Requests</h2>
            {requests.length === 0 ? (
              <div className="empty-state">
                <p>No maintenance requests yet. Create your first request above.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="maintenance-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Urgent</th>
                      <th>External</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr 
                        key={request.id}
                        className={request.is_urgent ? 'urgent-row' : ''}
                      >
                        <td>#{request.id}</td>
                        <td>{request.maintenance_type_display}</td>
                        <td>
                          <div className="description-cell" title={request.description}>
                            {request.description.length > 50 
                              ? `${request.description.substring(0, 50)}...` 
                              : request.description}
                          </div>
                        </td>
                        <td>{new Date(request.preferred_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}</td>
                        <td>{new Date(`2000-01-01T${request.preferred_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          {request.is_urgent ? (
                            <span className="urgent-indicator">⚠️</span>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                        <td>
                          {request.use_external_contractor ? (
                            <div className="external-info">
                              <span className="external-indicator">Yes</span>
                              <div className="external-details" title={`${request.external_contractor_name} - ${request.external_contractor_contact}`}>
                                {request.external_contractor_name}
                              </div>
                            </div>
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
                        </td>
                        <td>
                          <small>{new Date(request.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}</small>
                        </td>
                        <td>
                          <div className="action-buttons-cell">
                            {request.status === 'pending' && (
                              <button
                                className="edit-btn"
                                onClick={() => handleEdit(request)}
                                title="Edit request"
                              >
                                ✏️ Edit
                              </button>
                            )}
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteClick(request)}
                              title="Delete request"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && requestToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Maintenance Request</h2>
            <p>
              <strong>Request:</strong> {requestToDelete.maintenance_type_display}
            </p>
            <p>
              <strong>Status:</strong> {requestToDelete.status_display}
            </p>
            <p>
              Are you sure you want to delete this maintenance request? This action cannot be undone.
              {requestToDelete.status === 'approved' && (
                <span style={{ display: 'block', marginTop: '8px', color: '#f44336', fontWeight: 'bold' }}>
                  Note: This request is approved. Deleting it will remove it from your list.
                </span>
              )}
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

      <Footer />
    </>
  );
};

export default MaintenanceRequestPage;

