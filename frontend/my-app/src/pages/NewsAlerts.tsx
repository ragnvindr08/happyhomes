import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./PageStyles.css";
import "./AdminDashboard.css";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import NavBar from "./NavBar";
import Footer from "./Footer";
import logo from '../images/logo.png';
import newsAlertIcon from '../images/newsalert.png';
import API_URL from '../utils/config';

interface Item {
  id: number;
  message: string;
  action?: 'news' | 'alert' | string;
  data?: any;
  timestamp: string;
}

type OverridesMap = Record<string, { message: string; data?: any }>;

const LS_HIDDEN = 'hh_news_hidden_ids';
const LS_OVERRIDES = 'hh_news_overrides';

const chipStyle = (active: boolean) => ({
  padding: '8px 12px',
  borderRadius: 999,
  border: `1px solid ${active ? '#0d6efd' : '#e6e6e6'}`,
  color: active ? '#0d6efd' : '#444',
  background: active ? 'rgba(13,110,253,0.08)' : '#fff',
  cursor: 'pointer',
  fontSize: 13,
});

const NewsAlerts: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const hasScrolledRef = useRef(false);

  const [form, setForm] = useState({
    kind: 'news' as 'news' | 'alert',
    title: '',
    body: '',
    category: 'Community',
    urgent: false,
  });

  // Edit support
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: '', body: '', category: 'Community', urgent: false, kind: 'news' as 'news' | 'alert' });
  const [showEdit, setShowEdit] = useState(false);

  // Local persistence helpers
  const loadHidden = (): number[] => {
    try { return JSON.parse(localStorage.getItem(LS_HIDDEN) || '[]'); } catch { return []; }
  };
  const saveHidden = (arr: number[]) => localStorage.setItem(LS_HIDDEN, JSON.stringify(arr));
  const loadOverrides = (): OverridesMap => {
    try { return JSON.parse(localStorage.getItem(LS_OVERRIDES) || '{}'); } catch { return {}; }
  };
  const saveOverrides = (map: OverridesMap) => localStorage.setItem(LS_OVERRIDES, JSON.stringify(map));

  const [hiddenIds, setHiddenIds] = useState<number[]>(loadHidden());
  const [overrides, setOverrides] = useState<OverridesMap>(loadOverrides());

  // UI filters
  const [filter, setFilter] = useState<'all' | 'news' | 'alert'>('all');

  useEffect(() => { saveHidden(hiddenIds); }, [hiddenIds]);
  useEffect(() => { saveOverrides(overrides); }, [overrides]);

  useEffect(() => {
    // admin detection
    const token = localStorage.getItem('access');
    if (!token) { setIsAdmin(false); return; }
    fetch(`${API_URL}/profile/`, { headers: { Authorization: `Bearer ${token}` }})
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(p => setIsAdmin(!!p?.is_staff))
      .catch(() => setIsAdmin(false));
  }, []);

  // Load News and Alerts from backend APIs - extracted as reusable function
  const loadNewsAndAlerts = async () => {
    try {
      setLoading(true);
        const [newsRes, alertsRes] = await Promise.all([
          fetch(`${API_URL}/news/`),
          fetch(`${API_URL}/alerts/`),
        ]);
      if (!newsRes.ok || !alertsRes.ok) throw new Error('Failed to fetch');
      const newsData = await newsRes.json();
      const alertsData = await alertsRes.json();

      const newsItems: Item[] = (Array.isArray(newsData) ? newsData : [])
        .map((n: any) => ({
          id: n.id,
          message: `📰 ${n.title}\n\n${n.content}`,
          action: 'news',
          data: { category: 'Community', urgent: false },
          timestamp: n.created_at,
        }));

      const alertItems: Item[] = (Array.isArray(alertsData) ? alertsData : [])
        .map((a: any) => ({
          id: a.id,
          message: `🚨 ${a.title}\n\n${a.message}`,
          action: 'alert',
          data: { category: a.severity || 'warning', urgent: a.severity === 'critical' },
          timestamp: a.created_at,
        }));

      setItems([...newsItems, ...alertItems]);
      setError(null);
    } catch (e) {
      setError('Failed to load News & Alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNewsAndAlerts();
  }, []);

  const applied = useMemo(() => {
    // Apply local overrides and hidden filters
    const map = overrides;
    return items
      .filter(i => !hiddenIds.includes(i.id))
      .filter(i => filter === 'all' ? true : i.action === filter)
      .map(i => {
        const o = map[i.id];
        if (!o) return i;
        return { ...i, message: o.message ?? i.message, data: { ...i.data, ...(o.data || {}) } };
      });
  }, [items, hiddenIds, overrides, filter]);

  const sorted = useMemo(() => {
    const arr = [...applied];
    arr.sort((a, b) => {
      const au = a.data?.urgent ? 1 : 0;
      const bu = b.data?.urgent ? 1 : 0;
      if (au !== bu) return bu - au;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    return arr;
  }, [applied]);

  const ringColor = useCallback((action?: string) => action === 'alert' ? '#dc3545' : '#0d6efd', []);

  // Handle scrolling to specific item when coming from HomePage
  useEffect(() => {
    // Reset scroll flag when search params change
    if (searchParams.get('id')) {
      hasScrolledRef.current = false;
    }
  }, [searchParams]);

  // Separate effect to handle scrolling after data is loaded and sorted
  useEffect(() => {
    if (loading) return;
    
    const itemId = searchParams.get('id');
    const itemType = searchParams.get('type');
    
    if (!itemId) return;
    
    // Wait for sorted to be available
    const currentSorted = sorted;
    if (!currentSorted || currentSorted.length === 0) return;
    
    // Set filter if type is specified and different from current
    if (itemType && (itemType === 'news' || itemType === 'alert') && filter !== itemType) {
      setFilter(itemType);
      return; // Will re-run after filter changes
    }
    
    // Only scroll if filter matches (or no filter was needed) and we haven't scrolled yet
    const id = parseInt(itemId, 10);
    const item = currentSorted.find(i => i.id === id);
    if (!item || hasScrolledRef.current) return;
    
    // Wait a bit for the DOM to update, then scroll to the item
    setTimeout(() => {
      const element = itemRefs.current[id];
      if (element) {
        hasScrolledRef.current = true;
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight the item temporarily
        element.style.borderLeft = '4px solid #2e6F40';
        setTimeout(() => {
          element.style.borderLeft = `4px solid ${ringColor(item.action)}`;
        }, 3000);
        // Clear the URL params after scrolling
        setSearchParams({});
      }
    }, 300);
  }, [loading, sorted, searchParams, setSearchParams, filter, ringColor]);

  const submitNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setPosting(true);

    const token = localStorage.getItem('access');
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      if (form.kind === 'news') {
        const res = await fetch(`${API_URL}/news/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ title: form.title, content: form.body, is_published: true }),
        });
        if (!res.ok) throw new Error('Failed');
        const created = await res.json();
        setItems(prev => [{
          id: created.id,
          message: `📰 ${created.title}\n\n${created.content}`,
          action: 'news',
          data: { category: form.category, urgent: false },
          timestamp: created.created_at || new Date().toISOString(),
        }, ...prev]);
      } else {
        const res = await fetch(`${API_URL}/alerts/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ title: form.title, message: form.body, severity: form.urgent ? 'critical' : 'warning', is_active: true }),
        });
        if (!res.ok) throw new Error('Failed');
        const created = await res.json();
        setItems(prev => [{
          id: created.id,
          message: `🚨 ${created.title}\n\n${created.message}`,
          action: 'alert',
          data: { category: created.severity || 'warning', urgent: created.severity === 'critical' },
          timestamp: created.created_at || new Date().toISOString(),
        }, ...prev]);
      }

      setShowModal(false);
      setForm({ kind: 'news', title: '', body: '', category: 'Community', urgent: false });
    } catch (err) {
      setError('Failed to post');
    } finally {
      setPosting(false);
    }
  };

  // Admin-only delete - actually deletes from backend
  const onDelete = async (item: Item) => {
    if (!window.confirm(`Are you sure you want to delete this ${item.action === 'alert' ? 'alert' : 'news'}? This will permanently delete it for all users.`)) return;
    
    const token = localStorage.getItem('access');
    if (!token) {
      setError('You must be logged in to delete items');
      return;
    }

    try {
      // Determine the endpoint based on item type
      const endpoint = item.action === 'alert' 
        ? `${API_URL}/alerts/${item.id}/`
        : `${API_URL}/news/${item.id}/`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Failed to delete item' }));
        throw new Error(errorData.detail || 'Failed to delete item');
      }

      // Remove from hiddenIds if it was there
      setHiddenIds(prev => prev.filter(hiddenId => hiddenId !== item.id));
      
      // Reload data from backend to reflect deletion for all users
      await loadNewsAndAlerts();
      
      // Show success message
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
      setError(`Delete failed: ${errorMessage}`);
      console.error('Delete error:', err);
    }
  };

  const onEdit = (it: Item) => {
    setEditId(it.id);
    // Parse message into title/body if possible (split first line)
    const lines = (it.message || '').split('\n');
    const first = lines[0] || '';
    const rest = lines.slice(2).join('\n');
    const isAlert = (it.action === 'alert');
    setEditForm({
      kind: isAlert ? 'alert' : 'news',
      title: first.replace(/^((🚨|📰)\s*)?/, ''),
      body: rest || it.message,
      category: it.data?.category || 'Community',
      urgent: !!it.data?.urgent,
    });
    setShowEdit(true);
  };

  const onSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId == null) return;
    const newMessage = `${editForm.kind === 'alert' ? '🚨' : '📰'} ${editForm.title}\n\n${editForm.body}`;
    const newData = { category: editForm.category, urgent: editForm.urgent };
    setOverrides(prev => ({ ...prev, [editId]: { message: newMessage, data: newData } }));
    setShowEdit(false);
    setEditId(null);
  };

  // Main content component
  const mainContent = (
    <div className="page-container" style={{ maxWidth: '100%', width: '100%', boxSizing: 'border-box', border: '1px solid #e0e0e0', padding: '30px', margin: '20px' }}>
      {/* Header / Toolbar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12, 
        flexWrap: 'wrap', 
        justifyContent: 'space-between',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '2px solid #e0e0e0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
           <img
      src={newsAlertIcon}
      alt="News & Alerts"
      style={{ width: 60, height: 'auto', objectFit: 'contain' }}
    />
          <h1 style={{ margin: 0 }}>News & Alerts</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              style={{
                ...chipStyle(filter === 'all'),
                transition: 'all 0.2s ease',
                fontWeight: 600
              }} 
              onClick={() => setFilter('all')}
              onMouseEnter={(e) => {
                if (filter !== 'all') {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== 'all') {
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              All
            </button>
            <button 
              style={{
                ...chipStyle(filter === 'news'),
                transition: 'all 0.2s ease',
                fontWeight: 600
              }} 
              onClick={() => setFilter('news')}
              onMouseEnter={(e) => {
                if (filter !== 'news') {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== 'news') {
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              News
            </button>
            <button 
              style={{
                ...chipStyle(filter === 'alert'),
                transition: 'all 0.2s ease',
                fontWeight: 600
              }} 
              onClick={() => setFilter('alert')}
              onMouseEnter={(e) => {
                if (filter !== 'alert') {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== 'alert') {
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              Alerts
            </button>
          </div>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowModal(true)} 
            style={{
              background: '#2e6F40',
              color: '#fff', 
              border: 'none', 
              padding: '12px 24px', 
              borderRadius: 10, 
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            + New
          </button>
        )}
      </div>
      <p style={{ color: '#555', marginTop: 8, marginBottom: '30px', fontSize: '1.05rem' }}>
        Stay updated with announcements, advisories, and urgent alerts.
      </p>

      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          border: '1px solid #e0e0e0'
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
          <p style={{ color: '#666', fontSize: '1.1rem' }}>Loading news and alerts...</p>
        </div>
      )}
      {error && (
        <div style={{ 
          background: '#f8d7da', 
          border: '2px solid #dc3545', 
          borderRadius: 12, 
          padding: 20, 
          textAlign: 'center', 
          color: '#721c24',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {!loading && !error && sorted.length === 0 && (
        <div style={{ 
          border: '1px solid #e0e0e0', 
          padding: 60, 
          textAlign: 'center', 
          color: '#666'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }}>📰</div>
          <h3 style={{ marginBottom: '10px', color: '#333' }}>No News or Alerts</h3>
          <p style={{ margin: 0 }}>
            {isAdmin ? 'Click "+ New" to post an update.' : 'Please check back later.'}
          </p>
        </div>
      )}

      <div 
        className="news-alerts-list"
        style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}>
        {sorted.map((n) => (
          <div 
               key={n.id}
               ref={(el) => { itemRefs.current[n.id] = el; }}
               className="news-card"
               style={{
                 position: 'relative',
                 borderLeft: `4px solid ${ringColor(n.action)}`,
                 border: '1px solid #e0e0e0',
                 padding: '24px',
                 transition: 'transform .15s ease, border-left .3s ease',
                 width: '100%',
                 maxWidth: '100%',
                 display: 'flex',
                 flexDirection: 'column',
                 overflow: 'hidden',
                 boxSizing: 'border-box',
                 wordWrap: 'break-word',
                 overflowWrap: 'break-word',
                 cursor: 'pointer',
               }}
               onClick={() => setSelectedItem(n)}
               onMouseEnter={(e) => {
                 (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
               }}
               onMouseLeave={(e) => {
                 (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
               }}>
            {n.data?.urgent && (
              <span style={{ position: 'absolute', top: 10, right: 10, background: '#ffc107', color: '#111', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}>URGENT</span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: ringColor(n.action) }} />
              <strong style={{ color: ringColor(n.action), letterSpacing: .5, fontSize: '0.85rem' }}>{(n.action || 'news').toUpperCase()}</strong>
              {n.data?.category && <span style={{ fontSize: 12, color: '#666', paddingLeft: 6 }}>• {n.data.category}</span>}
            </div>
            <div style={{ 
              whiteSpace: 'pre-wrap', 
              color: '#2b2b2b', 
              lineHeight: 1.6, 
              fontSize: '1rem',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              marginBottom: 12,
              maxWidth: '100%',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}>{n.message}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{new Date(n.timestamp).toLocaleString()}</div>

            {isAdmin && (
              <div style={{ 
                display: 'flex', 
                gap: 8, 
                marginTop: 14, 
                justifyContent: 'flex-end',
                paddingTop: '14px',
                borderTop: '1px solid #e8e8e8'
              }}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(n);
                  }}
                  style={{ 
                    background: '#198754',
                    border: 'none',
                    color: '#fff', 
                    padding: '10px 16px', 
                    borderRadius: 8, 
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                   Edit
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(n);
                  }}
                  style={{ 
                    background: '#dc3545',
                    border: 'none',
                    color: '#fff', 
                    padding: '10px 16px', 
                    borderRadius: 8, 
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                   Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      
    </div>
  );

  const navigate = useNavigate();

  return (
    <>
      {isAdmin ? (
        <div className="dashboard-layout">
          <Sidebar />
          <main className="dashboard-main">
            {mainContent}
          </main>
        </div>
      ) : (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' }}>
          <NavBar />
          <div style={{ 
            flex: 1, 
            padding: '40px 20px', 
            maxWidth: '1200px', 
            margin: '0 auto', 
            width: '100%', 
            boxSizing: 'border-box',
            paddingTop: '40px'
          }}>
            {mainContent}
          </div>
          <Footer />
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.45)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 9999,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          onClick={() => setShowModal(false)}
        >
          <div 
            style={{ 
              width: 'min(560px, 92vw)', 
              background: '#fff', 
              borderRadius: 16, 
              padding: 50, 
              boxShadow: '0 16px 36px rgba(0,0,0,0.2)', 
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              zIndex: 10000
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <img src={newsAlertIcon} alt="News & Alerts" style={{ width: 40, height: 'auto', objectFit: 'contain' }} />
              <h3 style={{ marginTop: 0, marginBottom: 0 }}>Create News / Alert</h3>
            </div>
            <form onSubmit={submitNews}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="radio" name="kind" checked={form.kind === 'news'} onChange={() => setForm({ ...form, kind: 'news' })} /> News
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="radio" name="kind" checked={form.kind === 'alert'} onChange={() => setForm({ ...form, kind: 'alert' })} /> Alert
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                  <input type="checkbox" checked={form.urgent} onChange={(e) => setForm({ ...form, urgent: e.target.checked })} /> Mark urgent
                </label>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd' }}
                  placeholder="Headline"
                  required
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Body</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', minHeight: 120, resize: 'vertical' }}
                  placeholder="Write the content"
                  required
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', minWidth: 160 }}
                >
                  <option>Community</option>
                  <option>Policy</option>
                  <option>Maintenance</option>
                  <option>Safety</option>
                  <option>Events</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={posting} style={{ background: form.kind === 'alert' ? '#dc3545' : '#0d6efd', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}>{posting ? 'Posting…' : 'Post'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEdit && editId != null && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.45)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 9999,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          onClick={() => { setShowEdit(false); setEditId(null); }}
        >
          <div 
            style={{ 
              width: 'min(560px, 92vw)', 
              background: '#fff', 
              borderRadius: 16, 
              padding: 50, 
              boxShadow: '0 16px 36px rgba(0,0,0,0.2)', 
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              zIndex: 10000
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Edit News / Alert</h3>
            <form onSubmit={onSaveEdit}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="radio" name="edit_kind" checked={editForm.kind === 'news'} onChange={() => setEditForm({ ...editForm, kind: 'news' })} /> News
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="radio" name="edit_kind" checked={editForm.kind === 'alert'} onChange={() => setEditForm({ ...editForm, kind: 'alert' })} /> Alert
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                  <input type="checkbox" checked={editForm.urgent} onChange={(e) => setEditForm({ ...editForm, urgent: e.target.checked })} /> Mark urgent
                </label>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Title</label>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd' }}
                  placeholder="Headline"
                  required
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Body</label>
                <textarea
                  value={editForm.body}
                  onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', minHeight: 120, resize: 'vertical' }}
                  placeholder="Write the content"
                  required
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', minWidth: 160 }}
                >
                  <option>Community</option>
                  <option>Policy</option>
                  <option>Maintenance</option>
                  <option>Safety</option>
                  <option>Events</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" onClick={() => { setShowEdit(false); setEditId(null); }} style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: editForm.kind === 'alert' ? '#dc3545' : '#0d6efd', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}>Save</button>
        </div>
            </form>
        </div>
      </div>
      )}

      {/* View Full Article Modal */}
      {selectedItem && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.45)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 9999,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          onClick={() => setSelectedItem(null)}
        >
          <div 
            style={{ 
              width: 'min(800px, 92vw)', 
              background: '#fff', 
              borderRadius: 16, 
              padding: 40, 
              boxShadow: '0 16px 36px rgba(0,0,0,0.2)', 
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              zIndex: 10000
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              style={{
                position: 'absolute',
                top: 15,
                right: 15,
                background: 'transparent',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: '#666',
                width: '35px',
                height: '35px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f0f0f0';
                e.currentTarget.style.color = '#333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#666';
              }}
            >
              ×
            </button>
            
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: ringColor(selectedItem.action) }} />
                <strong style={{ color: ringColor(selectedItem.action), letterSpacing: .5, fontSize: '0.9rem' }}>
                  {(selectedItem.action || 'news').toUpperCase()}
                </strong>
                {selectedItem.data?.category && (
                  <span style={{ fontSize: 13, color: '#666', paddingLeft: 6 }}>
                    • {selectedItem.data.category}
                  </span>
                )}
                {selectedItem.data?.urgent && (
                  <span style={{ 
                    background: '#ffc107', 
                    color: '#111', 
                    padding: '4px 12px', 
                    borderRadius: 999, 
                    fontSize: 11, 
                    fontWeight: 700,
                    marginLeft: 'auto'
                  }}>
                    URGENT
                  </span>
                )}
              </div>
              
              <div style={{ 
                fontSize: 13, 
                color: '#888', 
                marginBottom: 20,
                paddingBottom: 15,
                borderBottom: '1px solid #e8e8e8'
              }}>
                {new Date(selectedItem.timestamp).toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            
            <div style={{ 
              whiteSpace: 'pre-wrap', 
              color: '#2b2b2b', 
              lineHeight: 1.8, 
              fontSize: '1.05rem',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}>
              {selectedItem.message}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewsAlerts;
