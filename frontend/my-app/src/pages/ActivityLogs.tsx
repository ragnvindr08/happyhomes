// src/pages/ActivityLog.tsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./ActivityLog.css";
import "./AdminDashboard.css";
import Sidebar from "./Sidebar";
import logo from '../images/logo.png';
import API_URL from '../utils/config';

interface HistoryRecord {
  id: number;
  history_date: string;
  history_type: string; // "+", "~", "-"
  history_user: string | null;
  model_name: string;
}

const historyTypeMap: Record<string, string> = {
  "+": "Created",
  "~": "Updated",
  "-": "Deleted",
};

const ActivityLog: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterModel, setFilterModel] = useState<string>("all"); // "all" or specific model name
  const [filterUser, setFilterUser] = useState<string>("all"); // "all" or specific user

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        // Fetch all records from backend
        const res = await axios.get(`${API_URL}/user-history/`, {
          withCredentials: true,
        });
        
        // Ensure we get an array of records
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        
        if (data.length === 0) {
          toast.info("No activity records found");
        } else {
          toast.success(`Loaded ${data.length} activity records`);
        }
        
        setRecords(data);
      } catch (err: any) {
        console.error("Failed to fetch history", err);
        const errorMessage = err.response?.data?.detail || err.response?.data?.message || "Failed to fetch activity log";
        toast.error(errorMessage);
        setRecords([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Get unique values for filters
  const uniqueModels = useMemo(() => {
    return Array.from(new Set(records.map(r => r.model_name))).sort();
  }, [records]);

  const uniqueUsers = useMemo(() => {
    return Array.from(new Set(records.map(r => r.history_user || "System").filter(Boolean))).sort();
  }, [records]);

  // Filter and sort records based on selected filters - using useMemo to ensure reactivity
  const filteredRecords = useMemo(() => {
    // Start with all records
    let result = records;

    // Apply Model filter - must match exactly (case-sensitive)
    if (filterModel && filterModel !== "all") {
      result = result.filter((record) => {
        return record.model_name && record.model_name === filterModel;
      });
    }

    // Apply User filter - must match exactly (case-sensitive)
    if (filterUser && filterUser !== "all") {
      result = result.filter((record) => {
        const userName = record.history_user || "System";
        return userName === filterUser;
      });
    }

    // Sort by date (newest first)
    return [...result].sort((a, b) => {
      const dateA = new Date(a.history_date).getTime();
      const dateB = new Date(b.history_date).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
  }, [records, filterModel, filterUser]);

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main">
          <div className="activity-log-container">
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #2e6F40',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}></div>
              <p style={{ color: '#666', fontSize: '1.1rem' }}>Loading activity log...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="dashboard-layout">
        <Sidebar />

        <main className="dashboard-main">
          <div className="activity-log-container">
            <div className="header-section">
              <h2>Activity Log</h2>
            </div>

            {/* Stats Cards */}
            <div className="stats-cards">
              <div className="stat-card">
                <div className="stat-value">{records.length}</div>
                <div className="stat-label">Total Records</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#2e6F40' }}>
                  {filteredRecords.length}
                </div>
                <div className="stat-label">Filtered Results</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#007bff' }}>
                  {uniqueModels.length}
                </div>
                <div className="stat-label">Models</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#6c757d' }}>
                  {uniqueUsers.length}
                </div>
                <div className="stat-label">Users</div>
              </div>
            </div>

            {/* Filters Section */}
            <div className="filters-section">
              {/* Model Filter */}
              <div className="filter-group">
                <label>Filter by Model:</label>
                <select
                  value={filterModel}
                  onChange={(e) => setFilterModel(e.target.value)}
                >
                  <option value="all">All Models</option>
                  {uniqueModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              {/* User Filter */}
              <div className="filter-group">
                <label>Filter by User:</label>
                <select
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                >
                  <option value="all">All Users</option>
                  {uniqueUsers.map((user) => (
                    <option key={user} value={user}>
                      {user}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filters Button */}
              {(filterModel !== "all" || filterUser !== "all") && (
                <div className="filter-group">
                  <button
                    onClick={() => {
                      setFilterModel("all");
                      setFilterUser("all");
                    }}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      marginTop: "25px"
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>

            <div style={{ 
              marginBottom: '20px', 
              color: '#666', 
              fontSize: '0.9rem',
              textAlign: 'center',
              padding: '10px',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              Showing <strong>{filteredRecords.length}</strong> of <strong>{records.length}</strong> records
            </div>

          <div className="activity-log-table-container">
            <table className="activity-log-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Model</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ 
                      textAlign: 'center', 
                      padding: '60px 20px', 
                      color: '#666',
                      background: '#f8f9fa'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }}>📋</div>
                      <h3 style={{ marginBottom: '10px', color: '#333' }}>No Records Found</h3>
                      <p style={{ margin: 0 }}>
                        No activity records match your current filters. Try adjusting your filter selections.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, index) => {
                    const dateObj = new Date(record.history_date);
                    // Create a unique key by combining id, model_name, and history_date to avoid duplicates
                    const uniqueKey = `${record.id}-${record.model_name}-${record.history_date}-${index}`;
                    const actionType = historyTypeMap[record.history_type] || record.history_type;
                    const actionClass = actionType.toLowerCase();
                    return (
                      <tr key={uniqueKey}>
                        <td style={{ fontWeight: 500, color: '#2c3e50' }}>
                          {dateObj.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>
                        <td style={{ color: '#666', fontFamily: 'monospace' }}>
                          {dateObj.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true 
                          })}
                        </td>
                        <td style={{ fontWeight: 500 }}>{record.history_user || "System"}</td>
                        <td>
                          <span className={`action-badge ${actionClass}`}>
                            {actionType}
                          </span>
                        </td>
                        <td style={{ color: '#555' }}>{record.model_name}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ActivityLog;
