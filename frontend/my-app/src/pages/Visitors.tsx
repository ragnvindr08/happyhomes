import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./VisitorPage.css";

// ---------------- Types ----------------
interface VisitorRequestDetails {
  id: number;
  visitor_name: string;
  visitor_email: string;
  visitor_contact_number: string;
  reason: string;
  visit_date: string;
  visit_end_date: string | null;
  visit_start_time: string;
  visit_end_time: string;
  status: string;
  resident_name: string;
  resident_email: string;
  visit_datetime_start: string | null;
  visit_datetime_end: string | null;
}

interface VerificationResponse {
  valid: boolean;
  pin: string;
  visitor_request: VisitorRequestDetails;
  details: {
    is_approved: boolean;
    is_used: boolean;
    is_expired: boolean;
    is_valid: boolean;
    is_pending: boolean;
    is_declined: boolean;
    status_message: string;
  };
  error?: string;
}

// ---------------- API Endpoint ----------------
const API_URL = "http://127.0.0.1:8000/api";
const VERIFY_PIN_API = `${API_URL}/visitor-requests/verify_pin/`;

// ---------------- Component ----------------
const GuardVerificationPage: React.FC = () => {
  const [pinDigits, setPinDigits] = useState<string[]>(Array(6).fill(""));
  const [verificationResult, setVerificationResult] = useState<VerificationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstPinRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (firstPinRef.current) {
      firstPinRef.current.focus();
    }
  }, []);

  // ---------------- PIN Input Handling ----------------
  const handlePinChange = (value: string, idx: number) => {
    if (/^\d?$/.test(value)) {
      const newPin = [...pinDigits];
      newPin[idx] = value;
      setPinDigits(newPin);

      if (value && idx < 5) {
        const nextInput = document.getElementById(`pin-${idx + 1}`);
        if (nextInput) (nextInput as HTMLInputElement).focus();
      } else if (!value && idx > 0) {
        const prevInput = document.getElementById(`pin-${idx - 1}`);
        if (prevInput) (prevInput as HTMLInputElement).focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Enter' && idx === 5 && pinDigits[5]) {
      handleVerifyPin();
    }
    if (e.key === 'Backspace' && !pinDigits[idx] && idx > 0) {
      const prevInput = document.getElementById(`pin-${idx - 1}`);
      if (prevInput) (prevInput as HTMLInputElement).focus();
    }
  };

  // ---------------- Verify PIN ----------------
  const handleVerifyPin = async () => {
    const pin = pinDigits.join("");

    if (pinDigits.some((digit) => digit === "")) {
      setError("Please enter complete 6-digit PIN");
      setVerificationResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      const response = await axios.post<VerificationResponse>(VERIFY_PIN_API, { pin });
      setVerificationResult(response.data);
      
      // Clear PIN after successful verification
      if (response.data.valid) {
        setTimeout(() => {
          setPinDigits(Array(6).fill(""));
          if (firstPinRef.current) firstPinRef.current.focus();
        }, 3000);
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.response?.data?.error || "Failed to verify PIN. Please try again.");
      setVerificationResult(null);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Format Date Range ----------------
  const formatDateRange = (startDate: string, startTime: string, endDate: string | null, endTime: string) => {
    if (!startDate || !startTime) return "N/A";
    
    const start = new Date(startDate);
    const startTimeParts = startTime.split(':');
    const startHours = startTimeParts[0] || '0';
    const startMinutes = startTimeParts[1] || '00';
    const startHour = parseInt(startHours, 10);
    const startAmpm = startHour >= 12 ? 'PM' : 'AM';
    const startHour12 = startHour % 12 || 12;
    
    const startFormatted = start.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    
    // If end date is different from start date, show range
    if (endDate && endDate !== startDate) {
      const end = new Date(endDate);
      const endTimeParts = endTime.split(':');
      const endHours = endTimeParts[0] || '0';
      const endMinutes = endTimeParts[1] || '00';
      const endHour = parseInt(endHours, 10);
      const endAmpm = endHour >= 12 ? 'PM' : 'AM';
      const endHour12 = endHour % 12 || 12;
      
      const endFormatted = end.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      
      // Calculate duration
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const durationText = daysDiff === 1 ? '1 day' : 
                          daysDiff < 7 ? `${daysDiff} days` :
                          daysDiff < 30 ? `${Math.floor(daysDiff / 7)} week${Math.floor(daysDiff / 7) > 1 ? 's' : ''}` :
                          `${Math.floor(daysDiff / 30)} month${Math.floor(daysDiff / 30) > 1 ? 's' : ''}`;
      
      return (
        <div>
          <div><strong>From:</strong> {startFormatted} at {startHour12}:{startMinutes} {startAmpm}</div>
          <div><strong>To:</strong> {endFormatted} at {endHour12}:{endMinutes} {endAmpm}</div>
          <div className="duration-badge">Duration: {durationText}</div>
        </div>
      );
    }
    
    // Single day visit
    const endTimeParts = endTime.split(':');
    const endHours = endTimeParts[0] || '0';
    const endMinutes = endTimeParts[1] || '00';
    const endHour = parseInt(endHours, 10);
    const endAmpm = endHour >= 12 ? 'PM' : 'AM';
    const endHour12 = endHour % 12 || 12;
    
    return (
      <div>
        <div><strong>Date:</strong> {startFormatted}</div>
        <div><strong>Time:</strong> {startHour12}:{startMinutes} {startAmpm} - {endHour12}:{endMinutes} {endAmpm}</div>
      </div>
    );
  };

  // ---------------- Clear and Reset ----------------
  const handleClear = () => {
    setPinDigits(Array(6).fill(""));
    setVerificationResult(null);
    setError(null);
    if (firstPinRef.current) firstPinRef.current.focus();
  };

  // ---------------- Render ----------------
  return (
    <div className="guard-verification-page">
      <div className="guard-verification-container">
        <div className="guard-header">
          <img src="/logo.png" alt="Logo" className="guard-logo" />
          <h1>Guard Verification</h1>
          <p className="guard-subtitle">Enter visitor PIN to verify access</p>
        </div>

        {/* PIN Input Section */}
        <div className="pin-verification-section">
          <label htmlFor="pin-0" className="pin-label">
            Enter 6-Digit PIN
          </label>
          
          <div className="pin-inputs">
            {pinDigits.map((digit, idx) => (
              <input
                key={idx}
                id={`pin-${idx}`}
                className="pin-input"
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(e.target.value, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                required
                autoComplete="off"
                disabled={loading}
                ref={idx === 0 ? firstPinRef : null}
              />
            ))}
          </div>

          <div className="guard-actions">
            <button 
              className="verify-button" 
              onClick={handleVerifyPin} 
              disabled={loading || pinDigits.some(d => d === "")}
            >
              {loading ? "Verifying..." : "Verify PIN"}
            </button>
            <button 
              className="clear-button" 
              onClick={handleClear}
              disabled={loading}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Verification Result */}
        {verificationResult && (
          <div className={`verification-result ${verificationResult.valid ? 'valid' : 'invalid'}`}>
            <div className="result-header">
              {verificationResult.valid ? (
                <>
                  <span className="result-icon">✅</span>
                  <h2>PIN VERIFIED</h2>
                </>
              ) : (
                <>
                  <span className="result-icon">❌</span>
                  <h2>PIN INVALID</h2>
                </>
              )}
            </div>

            {verificationResult.valid ? (
              <div className="visitor-details">
                <div className="detail-section">
                  <h3>Visitor Information</h3>
                  <div className="detail-item">
                    <strong>Name:</strong> {verificationResult.visitor_request.visitor_name}
                  </div>
                  <div className="detail-item">
                    <strong>Email:</strong> {verificationResult.visitor_request.visitor_email}
                  </div>
                  {verificationResult.visitor_request.visitor_contact_number && (
                    <div className="detail-item">
                      <strong>Contact:</strong> {verificationResult.visitor_request.visitor_contact_number}
                    </div>
                  )}
                  {verificationResult.visitor_request.reason && (
                    <div className="detail-item">
                      <strong>Reason:</strong> {verificationResult.visitor_request.reason}
                    </div>
                  )}
                </div>

                <div className="detail-section">
                  <h3>Visit Schedule</h3>
                  <div className="detail-item">
                    {formatDateRange(
                      verificationResult.visitor_request.visit_date,
                      verificationResult.visitor_request.visit_start_time,
                      verificationResult.visitor_request.visit_end_date,
                      verificationResult.visitor_request.visit_end_time
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Resident Information</h3>
                  <div className="detail-item">
                    <strong>Resident:</strong> {verificationResult.visitor_request.resident_name}
                  </div>
                  <div className="detail-item">
                    <strong>Email:</strong> {verificationResult.visitor_request.resident_email}
                  </div>
                </div>
              </div>
            ) : (
              <div className="invalid-details">
                <p className="status-message">
                  {verificationResult.details?.status_message || verificationResult.error || 'PIN is not valid'}
                </p>
                {verificationResult.visitor_request && (
                  <div className="detail-section">
                    <h3>Request Status</h3>
                    <div className="detail-item">
                      <strong>Status:</strong> <span className={`status-badge ${verificationResult.visitor_request.status}`}>
                        {verificationResult.visitor_request.status.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>
                    {verificationResult.visitor_request.visitor_name && (
                      <div className="detail-item">
                        <strong>Visitor:</strong> {verificationResult.visitor_request.visitor_name}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuardVerificationPage;
