import React, { useState, useEffect } from 'react';
import NavBar from './NavBar';
import './PageStyles.css';
import './FAQ.css';
import axios from 'axios';
import { getToken } from '../utils/auth';
import API_URL from '../utils/config';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const FAQ: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/faq/`, {
        timeout: 10000 // 10 second timeout
      });
      // Handle both array response and paginated response
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setFaqs(data);
    } catch (err: any) {
      console.error('Error fetching FAQs:', err);
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please check your connection and try again.');
      } else if (err.response) {
        // Server responded with error status
        const errorMessage = err.response.data?.detail || err.response.data?.message || `Server error (${err.response.status})`;
        setError(errorMessage);
      } else if (err.request) {
        // Request made but no response
        setError('Unable to connect to server. Please check if the backend is running.');
      } else {
        setError('Failed to load FAQs. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <>
      <NavBar />
      {/* Hero Section */}
      <div className="faq-hero-section">
        <div className="faq-hero-content">
          <h1 className="faq-hero-title">
            Frequently Asked Questions
          </h1>
          <p className="faq-hero-subtitle">
            Find answers to common questions about our subdivision, properties, and services
          </p>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="faq-container">
        {loading && (
          <div className="faq-loading">
            <p>Loading FAQs...</p>
          </div>
        )}

        {error && (
          <div className="faq-error">
            {error}
          </div>
        )}

        {!loading && !error && faqs.length === 0 && (
          <div className="faq-empty">
            <p>No FAQs available at the moment. Please check back later.</p>
          </div>
        )}

        {!loading && !error && faqs.length > 0 && (
          <div className="faq-list">
            {faqs.map((faq) => (
              <div key={faq.id} className="faq-item">
                <button
                  onClick={() => toggleExpand(faq.id)}
                  className="faq-question-button"
                >
                  <span>{faq.question}</span>
                  {expandedId === faq.id ? (
                    <ExpandLessIcon className="faq-icon" />
                  ) : (
                    <ExpandMoreIcon className="faq-icon" />
                  )}
                </button>
                {expandedId === faq.id && (
                  <div className="faq-answer">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Additional Help Section */}
        <div className="faq-help-section">
          <h3 className="faq-help-title">Still have questions?</h3>
          <p className="faq-help-text">
            Can't find the answer you're looking for? Please get in touch with our friendly team.
          </p>
          <a href="/contact" className="faq-contact-button">
            Contact Us
          </a>
        </div>
      </div>
    </>
  );
};

export default FAQ;

