import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import './PageStyles.css';
import './AdminFAQ.css';
import './AdminDashboard.css';
import axios from 'axios';
import { getToken } from '../utils/auth';
import API_URL from '../utils/config';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import Sidebar from './Sidebar';

interface FAQItem {
  id?: number;
  question: string;
  answer: string;
  order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const AdminFAQ: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<FAQItem>({
    question: '',
    answer: '',
    order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const headers: any = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await axios.get(`${API_URL}/faq/`, { headers });
      // Handle both array response and paginated response
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setFaqs(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching FAQs:', err);
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to load FAQs. Please try again later.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      ...(name === 'order' && { order: parseInt(value) || 0 })
    }));
  };

  const handleEdit = (faq: FAQItem) => {
    setFormData(faq);
    setEditingId(faq.id || null);
    setShowAddForm(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({
      question: '',
      answer: '',
      order: 0,
      is_active: true
    });
  };

  const handleSave = async () => {
    try {
      const token = getToken();
      if (!token) {
        alert('You must be logged in to save FAQs.');
        return;
      }
      if (editingId) {
        // Update existing FAQ
        await axios.put(`${API_URL}/faq/${editingId}/`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Create new FAQ
        await axios.post(`${API_URL}/faq/`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      await fetchFAQs();
      handleCancel();
    } catch (err: any) {
      console.error('Error saving FAQ:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to save FAQ. Please try again.';
      alert(errorMsg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) {
      return;
    }
    try {
      const token = getToken();
      if (!token) {
        alert('You must be logged in to delete FAQs.');
        return;
      }
      await axios.delete(`${API_URL}/faq/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchFAQs();
    } catch (err: any) {
      console.error('Error deleting FAQ:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to delete FAQ. Please try again.';
      alert(errorMsg);
    }
  };

  const handleAddNew = () => {
    setShowAddForm(true);
    setEditingId(null);
    setFormData({
      question: '',
      answer: '',
      order: faqs.length > 0 ? Math.max(...faqs.map(f => f.order)) + 1 : 0,
      is_active: true
    });
  };

  const navigate = useNavigate();

  return (
    <>
      <div className="dashboard-layout">
        <Sidebar />
        <div className="dashboard-main">
      {/* Hero Section */}
      <div className="admin-faq-hero-section">
        <div className="admin-faq-hero-content">
          <h1 className="admin-faq-hero-title">
            Manage FAQs
          </h1>
          <p className="admin-faq-hero-subtitle">
            Add, edit, or delete frequently asked questions
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="admin-faq-container">
        {/* Add New Button */}
        <div className="admin-faq-add-button-container">
          <button onClick={handleAddNew} className="admin-faq-add-button">
            <AddIcon /> Add New FAQ
          </button>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingId !== null) && (
          <div className="admin-faq-form">
            <h3 className="admin-faq-form-title">
              {editingId ? 'Edit FAQ' : 'Add New FAQ'}
            </h3>
            <div className="admin-faq-form-content">
              <div className="admin-faq-form-group">
                <label className="admin-faq-form-label">
                  Question *
                </label>
                <input
                  type="text"
                  name="question"
                  value={formData.question}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter the question"
                  className="admin-faq-form-input"
                />
              </div>
              <div className="admin-faq-form-group">
                <label className="admin-faq-form-label">
                  Answer *
                </label>
                <textarea
                  name="answer"
                  value={formData.answer}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  placeholder="Enter the answer"
                  className="admin-faq-form-textarea"
                />
              </div>
              <div className="admin-faq-form-row">
                <div className="admin-faq-form-row-item">
                  <label className="admin-faq-form-label">
                    Order
                  </label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    placeholder="Display order"
                    className="admin-faq-form-input"
                  />
                </div>
                <div className="admin-faq-checkbox-group">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    id="is_active"
                  />
                  <label htmlFor="is_active" className="admin-faq-checkbox-label">
                    Active
                  </label>
                </div>
              </div>
              <div className="admin-faq-form-actions">
                <button onClick={handleCancel} className="admin-faq-button admin-faq-button-cancel">
                  <CancelIcon /> Cancel
                </button>
                <button onClick={handleSave} className="admin-faq-button admin-faq-button-save">
                  <SaveIcon /> Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAQs List */}
        {loading && (
          <div className="admin-faq-loading">
            <p>Loading FAQs...</p>
          </div>
        )}

        {error && (
          <div className="admin-faq-error">
            {error}
          </div>
        )}

        {!loading && !error && faqs.length === 0 && (
          <div className="admin-faq-empty">
            <p>No FAQs found. Click "Add New FAQ" to create one.</p>
          </div>
        )}

        {!loading && !error && faqs.length > 0 && (
          <div className="admin-faq-list">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className={`admin-faq-item ${faq.is_active ? 'admin-faq-item-active' : 'admin-faq-item-inactive'}`}
              >
                <div className="admin-faq-item-content">
                  <div className="admin-faq-item-main">
                    <h3 className="admin-faq-item-question">
                      {faq.question}
                    </h3>
                    <p className="admin-faq-item-answer">
                      {faq.answer}
                    </p>
                    <div className="admin-faq-item-meta">
                      <span>Order: {faq.order}</span>
                      <span>Status: {faq.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <div className="admin-faq-item-actions">
                    <button
                      onClick={() => handleEdit(faq)}
                      className="admin-faq-action-button admin-faq-action-button-edit"
                      title="Edit FAQ"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => faq.id && handleDelete(faq.id)}
                      className="admin-faq-action-button admin-faq-action-button-delete"
                      title="Delete FAQ"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </div>
      </div>
    </>
  );
};

export default AdminFAQ;

