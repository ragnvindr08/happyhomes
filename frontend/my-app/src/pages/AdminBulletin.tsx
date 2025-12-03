import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './PageStyles.css';
import './AdminDashboard.css';
import './AdminBulletin.css';
import './AdminSalePage.css';
import './AdminBooking.css';
import axios from 'axios';
import { getToken, logout } from '../utils/auth';
import API_URL from '../utils/config';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SearchIcon from '@mui/icons-material/Search';
import Sidebar from './Sidebar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Interfaces
interface BulletinItem {
  id?: number;
  title: string;
  content: string;
  is_published: boolean;
  created_by?: number;
  created_by_username?: string;
  created_at?: string;
  updated_at?: string;
}

interface BulletinComment {
  id: number;
  bulletin: number;
  user: number;
  user_id: number;
  username: string;
  is_admin: boolean;
  is_verified: boolean;
  content: string;
  created_at: string;
  updated_at: string;
}

interface NewsItem {
  id: number;
  title: string;
  content: string;
  is_published: boolean;
  created_at: string;
}

interface AlertItem {
  id: number;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  is_active: boolean;
  created_at: string;
}

interface Post {
  id: number;
  title: string;
  body: string;
  image?: string | null;
  lat?: number | null;
  lng?: number | null;
}

interface BlogComment {
  id: number;
  post: number;
  user: number;
  user_id: number;
  username: string;
  is_admin: boolean;
  content: string;
  created_at: string;
  updated_at: string;
}

interface House {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  listing_type?: 'sale' | 'rent';
  image?: string;
  user?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Booking {
  id: number;
  facility_id: number;
  facility_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "pending" | "approved" | "rejected";
  user_name?: string;
}

interface Pin {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  status?: string;
  description?: string;
  price?: string;
  occupant?: string;
  image?: string;
  square_meter?: number | string;
}

interface CommunityMediaItem {
  id?: number;
  title: string;
  description?: string;
  media_file?: File | null;
  media_url?: string;
  media_type: 'image' | 'video';
  category: 'events' | 'facilities' | 'properties' | 'activities' | 'announcements';
  is_approved: boolean;
  is_featured: boolean;
  is_public: boolean;
  order: number;
  views_count?: number;
  likes_count?: number;
  uploaded_by?: number;
  uploaded_by_username?: string;
  created_at?: string;
  updated_at?: string;
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
  reason?: string;
  one_time_pin?: string | null;
  visit_date: string;
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

type TabType = 'announcements' | 'blog-stories' | 'houses' | 'bookings' | 'pins' | 'media-gallery';

const AdminBulletin: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('announcements');
  
  // Common states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Announcements (Bulletins) states
  const [bulletins, setBulletins] = useState<BulletinItem[]>([]);
  const [bulletinEditingId, setBulletinEditingId] = useState<number | null>(null);
  const [showBulletinForm, setShowBulletinForm] = useState(false);
  const [bulletinSearchTerm, setBulletinSearchTerm] = useState('');
  const [bulletinFilterStatus, setBulletinFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [bulletinFormData, setBulletinFormData] = useState<BulletinItem>({
    title: '',
    content: '',
    is_published: true
  });

  // News & Alerts states
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [alertItems, setAlertItems] = useState<AlertItem[]>([]);
  const [newsAlertFilter, setNewsAlertFilter] = useState<'all' | 'news' | 'alert'>('all');
  const [showNewsAlertModal, setShowNewsAlertModal] = useState(false);
  const [newsAlertForm, setNewsAlertForm] = useState({
    kind: 'news' as 'news' | 'alert',
    title: '',
    body: '',
    urgent: false
  });

  // Blog Stories states
  const [posts, setPosts] = useState<Post[]>([]);
  const [postEditingId, setPostEditingId] = useState<number | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postFormData, setPostFormData] = useState<Post>({
    id: 0,
    title: '',
    body: ''
  });
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const postImageInputRef = useRef<HTMLInputElement>(null);

  // Houses states
  const [houses, setHouses] = useState<House[]>([]);
  const [houseSearch, setHouseSearch] = useState('');
  const [houseFilter, setHouseFilter] = useState<'all' | 'sale' | 'rent'>('all');
  const [modalHouse, setModalHouse] = useState<House | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  // Bookings states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [bookingSearchQuery, setBookingSearchQuery] = useState<string>("");

  // Pins states
  const [pins, setPins] = useState<Pin[]>([]);
  const [pinSearch, setPinSearch] = useState('');

  // Bulletin Comments states
  const [selectedBulletin, setSelectedBulletin] = useState<BulletinItem | null>(null);
  const [bulletinComments, setBulletinComments] = useState<BulletinComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Blog Post Comments states
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [blogComments, setBlogComments] = useState<BlogComment[]>([]);
  const [blogCommentText, setBlogCommentText] = useState('');
  const [loadingBlogComments, setLoadingBlogComments] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Media Gallery states
  const [mediaItems, setMediaItems] = useState<CommunityMediaItem[]>([]);
  const [mediaEditingId, setMediaEditingId] = useState<number | null>(null);
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [mediaSearchTerm, setMediaSearchTerm] = useState('');
  const [mediaFilterCategory, setMediaFilterCategory] = useState<'all' | 'events' | 'facilities' | 'properties' | 'activities' | 'announcements'>('all');
  const [mediaFormData, setMediaFormData] = useState<CommunityMediaItem>({
    title: '',
    description: '',
    media_file: null,
    media_type: 'image',
    category: 'activities',
    is_approved: true,
    is_featured: false,
    is_public: true,
    order: 0
  });
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  // Visitor Requests states
  const [visitorRequests, setVisitorRequests] = useState<VisitorRequestItem[]>([]);
  const [visitorRequestFilter, setVisitorRequestFilter] = useState<'all' | 'pending_admin' | 'approved' | 'declined'>('all');
  const [visitorRequestSearch, setVisitorRequestSearch] = useState('');

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (!token) {
        toast.error('Please login to access this page');
        navigate('/login');
        return;
      }

      // Verify token is valid and user is admin
      try {
        const response = await axios.get(`${API_URL}/profile/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.data.is_staff) {
          toast.error('Access denied. Admin only.');
          navigate('/home');
          return;
        }

        // Set admin status and current user ID
        setIsAdmin(true);
        setCurrentUserId(response.data.id);

        // Token is valid and user is admin, fetch data
        fetchAllData();
      } catch (err: any) {
        console.error('Auth check error:', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          toast.error('Session expired or invalid token. Please login again.');
          logout();
          navigate('/login');
        } else {
          toast.error('Failed to verify authentication');
          navigate('/login');
        }
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBulletins(),
        fetchNewsAndAlerts(),
        fetchPosts(),
        fetchHouses(),
        fetchBookings(),
        fetchPins(),
        fetchMedia(),
        fetchVisitorRequests()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch functions
  const fetchBulletins = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }
      const headers: any = {
        Authorization: `Bearer ${token}`
      };
      const response = await axios.get(`${API_URL}/bulletins/`, { headers });
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setBulletins(data);
    } catch (err: any) {
      console.error('Error fetching bulletins:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        logout();
        navigate('/login');
      }
    }
  };

  const fetchNewsAndAlerts = async () => {
    try {
      const [newsRes, alertsRes] = await Promise.all([
        axios.get(`${API_URL}/news/`),
        axios.get(`${API_URL}/alerts/`)
      ]);
      setNewsItems(Array.isArray(newsRes.data) ? newsRes.data : []);
      setAlertItems(Array.isArray(alertsRes.data) ? alertsRes.data : []);
    } catch (err: any) {
      console.error('Error fetching news and alerts:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }
      const headers: any = {
        Authorization: `Bearer ${token}`
      };
      const response = await axios.get(`${API_URL}/posts/`, { headers });
      setPosts(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        logout();
        navigate('/login');
      }
    }
  };

  const fetchHouses = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await axios.get(`${API_URL}/houses/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHouses(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Error fetching houses:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        logout();
        navigate('/login');
      }
    }
  };

  const fetchBookings = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await axios.get(`${API_URL}/bookings/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        logout();
        navigate('/login');
      }
    }
  };

  const fetchPins = async () => {
    try {
      const response = await axios.get(`${API_URL}/pins/`);
      setPins(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Error fetching pins:', err);
    }
  };

  // Media Gallery fetch function
  const fetchMedia = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await axios.get(`${API_URL}/community-media/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setMediaItems(data);
    } catch (err: any) {
      console.error('Error fetching media:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        logout();
        navigate('/login');
      }
    }
  };

  // Media Gallery handlers
  const handleMediaInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setMediaFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFormData(prev => ({
        ...prev,
        media_file: file,
        media_type: file.type.startsWith('video/') ? 'video' : 'image'
      }));
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMediaEdit = (media: CommunityMediaItem) => {
    setMediaFormData({
      ...media,
      media_file: null // Don't pre-set file, require re-upload
    });
    setMediaEditingId(media.id || null);
    setMediaPreview(media.media_url || null);
    setShowMediaForm(true);
  };

  const handleMediaCancel = () => {
    setMediaEditingId(null);
    setShowMediaForm(false);
    setMediaFormData({
      title: '',
      description: '',
      media_file: null,
      media_type: 'image',
      category: 'activities',
      is_approved: true,
      is_featured: false,
      is_public: true,
      order: 0
    });
    setMediaPreview(null);
    // Clear file input
    if (mediaFileInputRef.current) {
      mediaFileInputRef.current.value = '';
    }
  };

  const handleMediaSave = async () => {
    if (!mediaFormData.title.trim()) {
      toast.error('Please fill in the title.');
      return;
    }
    if (!mediaEditingId && !mediaFormData.media_file) {
      toast.error('Please select a media file to upload.');
      return;
    }
    try {
      const token = getToken();
      if (!token) {
        toast.error('You must be logged in to save media.');
        return;
      }
      
      const formData = new FormData();
      formData.append('title', mediaFormData.title.trim());
      formData.append('description', mediaFormData.description || '');
      
      if (mediaFormData.media_file) {
        formData.append('media_file', mediaFormData.media_file);
      }
      
      formData.append('media_type', mediaFormData.media_type);
      formData.append('category', mediaFormData.category);
      formData.append('is_featured', String(mediaFormData.is_featured));
      formData.append('is_public', String(mediaFormData.is_public));
      formData.append('order', String(mediaFormData.order || 0));
      
      // Debug: Log form data (excluding file for size)
      console.log('Uploading media:', {
        title: mediaFormData.title,
        media_type: mediaFormData.media_type,
        category: mediaFormData.category,
        has_file: !!mediaFormData.media_file,
        is_featured: mediaFormData.is_featured,
        is_public: mediaFormData.is_public,
        order: mediaFormData.order
      });

      if (mediaEditingId) {
        await axios.patch(`${API_URL}/community-media/${mediaEditingId}/`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`
            // Note: Don't set Content-Type - browser will set it with boundary for FormData
          }
        });
        toast.success('Media updated successfully!');
      } else {
        await axios.post(`${API_URL}/community-media/`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`
            // Note: Don't set Content-Type - browser will set it with boundary for FormData
          }
        });
        toast.success('Media uploaded successfully!');
      }
      await fetchMedia();
      handleMediaCancel();
    } catch (err: any) {
      console.error('Error saving media:', err);
      let errorMessage = 'Failed to save media.';
      
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          logout();
          navigate('/login');
        } else if (err.response.status === 403) {
          errorMessage = 'You do not have permission to perform this action.';
        } else if (err.response.data) {
          // Try to get detailed error message
          if (err.response.data.detail) {
            errorMessage = err.response.data.detail;
          } else if (err.response.data.error) {
            errorMessage = err.response.data.error;
          } else if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          } else if (err.response.data.media_file) {
            errorMessage = `Media file error: ${Array.isArray(err.response.data.media_file) ? err.response.data.media_file[0] : err.response.data.media_file}`;
          } else {
            // Try to get first error message from response
            const errorData = err.response.data as Record<string, any>;
            const keys = Object.keys(errorData);
            if (keys.length > 0 && keys[0]) {
              const firstKey = keys[0];
              const firstError = errorData[firstKey];
              errorMessage = `${firstKey}: ${Array.isArray(firstError) ? firstError[0] : firstError}`;
            }
          }
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      toast.error(errorMessage);
    }
  };

  const handleMediaDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this media?')) return;
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/community-media/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Media deleted successfully!');
      await fetchMedia();
    } catch (err: any) {
      toast.error('Failed to delete media.');
    }
  };

  const handleMediaToggleFeatured = async (media: CommunityMediaItem) => {
    try {
      const token = getToken();
      if (!token) {
        toast.error('You must be logged in to perform this action.');
        return;
      }
      
      // Only send the field that's changing
      await axios.patch(`${API_URL}/community-media/${media.id}/`, {
        is_featured: !media.is_featured
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Media ${!media.is_featured ? 'featured' : 'unfeatured'} successfully!`);
      await fetchMedia();
    } catch (err: any) {
      console.error('Error toggling featured status:', err);
      let errorMessage = 'Failed to update featured status.';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          logout();
          navigate('/login');
        } else if (err.response.data) {
          if (err.response.data.detail) {
            errorMessage = err.response.data.detail;
          } else if (err.response.data.is_featured) {
            errorMessage = `Featured status error: ${Array.isArray(err.response.data.is_featured) ? err.response.data.is_featured[0] : err.response.data.is_featured}`;
          }
        }
      }
      
      toast.error(errorMessage);
    }
  };

  // Fetch visitor requests (admin only)
  const fetchVisitorRequests = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await axios.get(`${API_URL}/visitor-requests/`, {
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
    }
  };

  // Visitor Request handlers
  const handleApproveVisitorRequest = async (id: number) => {
    try {
      const token = getToken();
      if (!token) {
        toast.error('You must be logged in to perform this action.');
        return;
      }

      const response = await axios.post(
        `${API_URL}/visitor-requests/${id}/approve/`,
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
      const token = getToken();
      if (!token) {
        toast.error('You must be logged in to perform this action.');
        return;
      }

      const response = await axios.post(
        `${API_URL}/visitor-requests/${id}/decline/`,
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

  // Announcements handlers
  const handleBulletinInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setBulletinFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleBulletinEdit = (bulletin: BulletinItem) => {
    setBulletinFormData(bulletin);
    setBulletinEditingId(bulletin.id || null);
    setShowBulletinForm(true);
  };

  const handleBulletinCancel = () => {
    setBulletinEditingId(null);
    setShowBulletinForm(false);
    setBulletinFormData({
      title: '',
      content: '',
      is_published: true
    });
  };

  const handleBulletinSave = async () => {
    if (!bulletinFormData.title.trim() || !bulletinFormData.content.trim()) {
      toast.error('Please fill in both title and content.');
      return;
    }
    try {
      const token = getToken();
      if (!token) {
        toast.error('You must be logged in to save bulletins.');
        return;
      }
      if (bulletinEditingId) {
        await axios.put(`${API_URL}/bulletins/${bulletinEditingId}/`, bulletinFormData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Bulletin updated successfully!');
      } else {
        await axios.post(`${API_URL}/bulletins/`, bulletinFormData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Bulletin created successfully!');
      }
      await fetchBulletins();
      handleBulletinCancel();
    } catch (err: any) {
      console.error('Error saving bulletin:', err);
      toast.error(err.response?.data?.detail || 'Failed to save bulletin.');
    }
  };

  const handleBulletinDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this bulletin?')) return;
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/bulletins/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Bulletin deleted successfully!');
      await fetchBulletins();
    } catch (err: any) {
      toast.error('Failed to delete bulletin.');
    }
  };

  const handleBulletinTogglePublish = async (bulletin: BulletinItem) => {
    try {
      const token = getToken();
      await axios.patch(`${API_URL}/bulletins/${bulletin.id}/`, {
        ...bulletin,
        is_published: !bulletin.is_published
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Bulletin ${!bulletin.is_published ? 'published' : 'unpublished'} successfully!`);
      await fetchBulletins();
    } catch (err: any) {
      toast.error('Failed to update publish status.');
    }
  };

  // News & Alerts handlers
  const handleNewsAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsAlertForm.title.trim() || !newsAlertForm.body.trim()) return;
    try {
      const token = getToken();
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
      if (newsAlertForm.kind === 'news') {
        await axios.post(`${API_URL}/news/`, {
          title: newsAlertForm.title,
          content: newsAlertForm.body,
          is_published: true
        }, { headers: { 'Content-Type': 'application/json', ...authHeader } });
        toast.success('News created successfully!');
      } else {
        await axios.post(`${API_URL}/alerts/`, {
          title: newsAlertForm.title,
          message: newsAlertForm.body,
          severity: newsAlertForm.urgent ? 'critical' : 'warning',
          is_active: true
        }, { headers: { 'Content-Type': 'application/json', ...authHeader } });
        toast.success('Alert created successfully!');
      }
      setShowNewsAlertModal(false);
      setNewsAlertForm({ kind: 'news', title: '', body: '', urgent: false });
      await fetchNewsAndAlerts();
    } catch (err: any) {
      toast.error('Failed to create news/alert.');
    }
  };

  const handleNewsAlertDelete = async (id: number, type: 'news' | 'alert') => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/${type === 'news' ? 'news' : 'alerts'}/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${type === 'news' ? 'News' : 'Alert'} deleted successfully!`);
      await fetchNewsAndAlerts();
    } catch (err: any) {
      toast.error(`Failed to delete ${type}.`);
    }
  };

  // Blog Posts handlers
  const handlePostImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPostImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostSave = async () => {
    if (!postFormData.title.trim() || !postFormData.body.trim()) {
      toast.error('Please fill in both title and body.');
      return;
    }
    try {
      const token = getToken();
      if (!token) {
        toast.error('You must be logged in to create posts.');
        return;
      }
      // Note: Backend only supports POST for now, not PUT/DELETE
      if (postEditingId) {
        toast.info('Post editing requires backend support. Please create a new post instead.');
        return;
      }
      
      // Use FormData if image exists, otherwise use JSON
      const formData = new FormData();
      formData.append('title', postFormData.title);
      formData.append('body', postFormData.body);
      if (postFormData.lat) formData.append('lat', postFormData.lat.toString());
      if (postFormData.lng) formData.append('lng', postFormData.lng.toString());
      if (postImageFile) {
        formData.append('image', postImageFile);
      }

      const headers: any = { Authorization: `Bearer ${token}` };
      if (!postImageFile) {
        headers['Content-Type'] = 'application/json';
      }

      await axios.post(`${API_URL}/posts/`, postImageFile ? formData : {
        title: postFormData.title,
        body: postFormData.body,
        lat: postFormData.lat,
        lng: postFormData.lng
      }, {
        headers
      });
      toast.success('Post created successfully!');
      await fetchPosts();
      setShowPostForm(false);
      setPostEditingId(null);
      setPostFormData({ id: 0, title: '', body: '' });
      setPostImageFile(null);
      setPostImagePreview(null);
      if (postImageInputRef.current) {
        postImageInputRef.current.value = '';
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save post.');
    }
  };

  const handlePostDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const token = getToken();
      if (!token) {
        toast.error('You must be logged in to delete posts.');
        return;
      }
      await axios.delete(`${API_URL}/posts/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Post deleted successfully!');
      await fetchPosts();
    } catch (err: any) {
      console.error('Error deleting post:', err);
      toast.error(err.response?.data?.detail || 'Failed to delete post.');
    }
  };

  // Houses handlers
  const handleHouseDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this house?')) return;
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/houses/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('House deleted successfully');
      setHouses(houses.filter(h => h.id !== id));
      setModalHouse(null);
    } catch (err: any) {
      toast.error('Failed to delete house');
    }
  };

  const handleHouseSaveEdit = async () => {
    if (!modalHouse) return;
    const formData = new FormData();
    formData.append('title', editTitle);
    formData.append('price', editPrice);
    formData.append('location', editLocation);
    formData.append('description', editDescription);
    if (editImage) formData.append('image', editImage);
    try {
      const token = getToken();
      const res = await axios.patch(`${API_URL}/houses/${modalHouse.id}/`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHouses(houses.map(h => (h.id === res.data.id ? res.data : h)));
      setModalHouse(res.data);
      setEditMode(false);
      toast.success('House updated successfully');
    } catch (err: any) {
      toast.error('Failed to update house');
    }
  };

  // Bookings handlers
  const handleBookingAction = async (id: number, action: "approved" | "rejected") => {
    try {
      const token = getToken();
      await axios.patch(`${API_URL}/bookings/${id}/`, { status: action }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(prev => prev.map(b => (b.id === id ? { ...b, status: action } : b)));
      toast.success(`Booking ${action} successfully!`);
    } catch (err: any) {
      toast.error("Failed to update booking status.");
    }
  };

  const handleBookingDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/bookings/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(prev => prev.filter(b => b.id !== id));
      toast.success("Booking deleted successfully.");
    } catch (err: any) {
      toast.error("Failed to delete booking.");
    }
  };

  // Pins handlers
  const handlePinDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this pin?')) return;
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/pins/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Pin deleted successfully!');
      await fetchPins();
    } catch (err: any) {
      toast.error('Failed to delete pin.');
    }
  };

  // Filtered data
  const filteredBulletins = bulletins.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(bulletinSearchTerm.toLowerCase()) ||
                         b.content.toLowerCase().includes(bulletinSearchTerm.toLowerCase());
    const matchesFilter = bulletinFilterStatus === 'all' ||
                         (bulletinFilterStatus === 'published' && b.is_published) ||
                         (bulletinFilterStatus === 'draft' && !b.is_published);
    return matchesSearch && matchesFilter;
  });

  const filteredHouses = houses.filter(h => {
    const matchesSearch = h.title.toLowerCase().includes(houseSearch.toLowerCase()) ||
                         h.location.toLowerCase().includes(houseSearch.toLowerCase()) ||
                         h.description.toLowerCase().includes(houseSearch.toLowerCase());
    const matchesFilter = houseFilter === 'all' ||
                         (houseFilter === 'sale' && h.listing_type === 'sale') ||
                         (houseFilter === 'rent' && h.listing_type === 'rent');
    return matchesSearch && matchesFilter;
  });

  const filteredBookings = bookings.filter(b => {
    const matchesDate = !selectedDate || b.date === selectedDate;
    const matchesSearch = b.facility_name.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
                         (b.user_name?.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ?? false) ||
                         b.status.toLowerCase().includes(bookingSearchQuery.toLowerCase());
    return matchesDate && matchesSearch;
  });

  const filteredPins = pins.filter(p => 
    p.name.toLowerCase().includes(pinSearch.toLowerCase()) ||
    (p.description?.toLowerCase().includes(pinSearch.toLowerCase()) ?? false)
  );

  const filteredMedia = mediaItems.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(mediaSearchTerm.toLowerCase()) ||
                         (m.description?.toLowerCase().includes(mediaSearchTerm.toLowerCase()) ?? false);
    const matchesFilter = mediaFilterCategory === 'all' || m.category === mediaFilterCategory;
    return matchesSearch && matchesFilter;
  });

  const formatTimeTo12Hour = (time24?: string): string => {
    if (!time24 || !time24.includes(":")) return "--";
    const [hourStr, minute] = time24.split(":");
    const hour = parseInt(hourStr ?? "", 10);
    if (isNaN(hour)) return "--";
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Bulletin Comments handlers
  const fetchBulletinComments = async (bulletinId: number) => {
    setLoadingComments(true);
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/bulletin-comments/?bulletin_id=${bulletinId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBulletinComments(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      toast.error('Failed to load comments.');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleBulletinClick = async (bulletin: BulletinItem) => {
    setSelectedBulletin(bulletin);
    if (bulletin.id) {
      await fetchBulletinComments(bulletin.id);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedBulletin?.id) return;

    try {
      const token = getToken();
      await axios.post(`${API_URL}/bulletin-comments/`, {
        bulletin: selectedBulletin.id,
        content: commentText.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Comment added successfully!');
      setCommentText('');
      await fetchBulletinComments(selectedBulletin.id);
    } catch (err: any) {
      console.error('Error posting comment:', err);
      toast.error(err.response?.data?.detail || 'Failed to post comment.');
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/bulletin-comments/${commentId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Comment deleted successfully!');
      if (selectedBulletin?.id) {
        await fetchBulletinComments(selectedBulletin.id);
      }
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      toast.error('Failed to delete comment.');
    }
  };

  // Blog Post Comments handlers
  const fetchBlogComments = async (postId: number) => {
    setLoadingBlogComments(true);
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/blog-comments/?post_id=${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlogComments(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Error fetching blog comments:', err);
      toast.error('Failed to load comments.');
    } finally {
      setLoadingBlogComments(false);
    }
  };

  const handlePostClick = async (post: Post) => {
    setSelectedPost(post);
    await fetchBlogComments(post.id);
  };

  const handleBlogCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogCommentText.trim() || !selectedPost?.id) return;

    try {
      const token = getToken();
      await axios.post(`${API_URL}/blog-comments/`, {
        post: selectedPost.id,
        content: blogCommentText.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Comment added successfully!');
      setBlogCommentText('');
      await fetchBlogComments(selectedPost.id);
    } catch (err: any) {
      console.error('Error posting comment:', err);
      toast.error(err.response?.data?.detail || 'Failed to post comment.');
    }
  };

  const handleBlogCommentDelete = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/blog-comments/${commentId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Comment deleted successfully!');
      if (selectedPost?.id) {
        await fetchBlogComments(selectedPost.id);
      }
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      toast.error('Failed to delete comment.');
    }
  };

  const handlePostDeleteFromModal = async () => {
    if (!selectedPost?.id) return;
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/posts/${selectedPost.id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Post deleted successfully!');
      await fetchPosts();
      setSelectedPost(null);
    } catch (err: any) {
      console.error('Error deleting post:', err);
      toast.error('Failed to delete post.');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main">
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        </main>
      </div>
    );
  }

  // Tab content components will be defined here
  const renderTabContent = () => {
    switch (activeTab) {
      case 'announcements':
        return renderAnnouncementsTab();
      case 'blog-stories':
        return renderBlogStoriesTab();
      case 'houses':
        return renderHousesTab();
      case 'bookings':
        return renderBookingsTab();
      case 'pins':
        return renderPinsTab();
      case 'media-gallery':
        return renderMediaGalleryTab();
      default:
        return renderAnnouncementsTab();
    }
  };

  const renderAnnouncementsTab = () => {
    const stats = {
      total: bulletins.length,
      published: bulletins.filter(b => b.is_published).length,
      drafts: bulletins.filter(b => !b.is_published).length
    };

    return (
      <div className="bulletin-container">
        <div className="bulletin-stats-grid">
          <div className="bulletin-stat-card">
            <div className="bulletin-stat-value">{stats.total}</div>
            <div className="bulletin-stat-label">Total Announcements</div>
          </div>
          <div className="bulletin-stat-card published">
            <div className="bulletin-stat-value">{stats.published}</div>
            <div className="bulletin-stat-label">Published</div>
          </div>
          <div className="bulletin-stat-card draft">
            <div className="bulletin-stat-value">{stats.drafts}</div>
            <div className="bulletin-stat-label">Drafts</div>
          </div>
        </div>

        <div className="bulletin-controls">
          <div className="bulletin-search">
            <SearchIcon className="bulletin-search-icon" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={bulletinSearchTerm}
              onChange={(e) => setBulletinSearchTerm(e.target.value)}
              className="bulletin-search-input"
            />
          </div>
          <div className="bulletin-filters">
            <button
              className={`bulletin-filter-btn ${bulletinFilterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setBulletinFilterStatus('all')}
            >
              All
            </button>
            <button
              className={`bulletin-filter-btn ${bulletinFilterStatus === 'published' ? 'active' : ''}`}
              onClick={() => setBulletinFilterStatus('published')}
            >
              Published
            </button>
            <button
              className={`bulletin-filter-btn ${bulletinFilterStatus === 'draft' ? 'active' : ''}`}
              onClick={() => setBulletinFilterStatus('draft')}
            >
              Drafts
            </button>
          </div>
          <button onClick={() => { setShowBulletinForm(true); setBulletinEditingId(null); setBulletinFormData({ title: '', content: '', is_published: true }); }} className="bulletin-add-btn">
            <AddIcon /> Add New
          </button>
        </div>

        {showBulletinForm && (
          <div className="bulletin-form-card">
            <h2 className="bulletin-form-title">
              {bulletinEditingId ? 'Edit Announcement' : 'Create New Announcement'}
            </h2>
            <div className="bulletin-form-content">
              <div className="bulletin-form-group">
                <label className="bulletin-form-label">Title <span className="required">*</span></label>
                <input
                  type="text"
                  name="title"
                  value={bulletinFormData.title}
                  onChange={handleBulletinInputChange}
                  className="bulletin-form-input"
                  maxLength={200}
                />
                <div className="bulletin-char-count">{bulletinFormData.title.length}/200</div>
              </div>
              <div className="bulletin-form-group">
                <label className="bulletin-form-label">Content <span className="required">*</span></label>
                <textarea
                  name="content"
                  value={bulletinFormData.content}
                  onChange={handleBulletinInputChange}
                  rows={10}
                  className="bulletin-form-textarea"
                />
              </div>
              <div className="bulletin-form-group">
                <label className="bulletin-form-checkbox">
                  <input
                    type="checkbox"
                    name="is_published"
                    checked={bulletinFormData.is_published}
                    onChange={handleBulletinInputChange}
                    className="bulletin-checkbox"
                  />
                  <span className="bulletin-checkbox-label">
                    {bulletinFormData.is_published ? '✓ Published' : 'Draft'}
                  </span>
                </label>
              </div>
              <div className="bulletin-form-actions">
                <button onClick={handleBulletinCancel} className="bulletin-btn-secondary">
                  <CancelIcon /> Cancel
                </button>
                <button onClick={handleBulletinSave} className="bulletin-btn-primary">
                  <SaveIcon /> {bulletinEditingId ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bulletin-list">
          {filteredBulletins.length === 0 ? (
            <div className="bulletin-empty">
              <p className="bulletin-empty-text">No announcements found.</p>
            </div>
          ) : (
            filteredBulletins.map((bulletin) => (
              <div 
                key={bulletin.id} 
                className={`bulletin-card ${bulletin.is_published ? 'published' : 'draft'}`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleBulletinClick(bulletin)}
              >
                <div className="bulletin-card-header">
                  <div className="bulletin-card-title-section">
                    <h3 className="bulletin-card-title">{bulletin.title}</h3>
                    <div className="bulletin-card-badges">
                      {bulletin.is_published ? (
                        <span className="bulletin-badge published-badge">
                          <VisibilityIcon style={{ fontSize: '14px' }} /> Published
                        </span>
                      ) : (
                        <span className="bulletin-badge draft-badge">
                          <VisibilityOffIcon style={{ fontSize: '14px' }} /> Draft
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bulletin-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleBulletinTogglePublish(bulletin)} className={`bulletin-action-btn ${bulletin.is_published ? 'unpublish' : 'publish'}`}>
                      {bulletin.is_published ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </button>
                    <button onClick={() => handleBulletinEdit(bulletin)} className="bulletin-action-btn edit">
                      <EditIcon />
                    </button>
                    <button onClick={() => bulletin.id && handleBulletinDelete(bulletin.id)} className="bulletin-action-btn delete">
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
                <div className="bulletin-card-content">
                  <p className="bulletin-card-text">{bulletin.content}</p>
                </div>
                <div className="bulletin-card-footer">
                  <div className="bulletin-card-meta">
                    {bulletin.created_by_username && (
                      <span className="bulletin-meta-item">Created by: <strong>{bulletin.created_by_username}</strong></span>
                    )}
                    {bulletin.created_at && (
                      <span className="bulletin-meta-item">Created: {formatDate(bulletin.created_at)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };


  const renderBlogStoriesTab = () => {
    return (
      <div className="bulletin-container">
        <div className="bulletin-controls">
          <button onClick={() => { 
            setShowPostForm(true); 
            setPostEditingId(null); 
            setPostFormData({ id: 0, title: '', body: '' }); 
            setPostImageFile(null);
            setPostImagePreview(null);
            if (postImageInputRef.current) {
              postImageInputRef.current.value = '';
            }
          }} className="bulletin-add-btn">
            <AddIcon /> Add New Post
          </button>
        </div>

        {showPostForm && (
          <div className="bulletin-form-card">
            <h2 className="bulletin-form-title">{postEditingId ? 'Edit Post' : 'Create New Post'}</h2>
            <div className="bulletin-form-content">
              <div className="bulletin-form-group">
                <label className="bulletin-form-label">Title <span className="required">*</span></label>
                <input type="text" value={postFormData.title} onChange={(e) => setPostFormData({ ...postFormData, title: e.target.value })} className="bulletin-form-input" />
              </div>
              <div className="bulletin-form-group">
                <label className="bulletin-form-label">Body <span className="required">*</span></label>
                <textarea value={postFormData.body} onChange={(e) => setPostFormData({ ...postFormData, body: e.target.value })} rows={10} className="bulletin-form-textarea" />
              </div>
              <div className="bulletin-form-group">
                <label className="bulletin-form-label">Blog Image</label>
                
                {/* Hidden file input */}
                <input
                  ref={postImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePostImageChange}
                  style={{ display: 'none' }}
                />
                
                {/* Custom upload button */}
                <button
                  type="button"
                  onClick={() => postImageInputRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    backgroundColor: postImageFile ? '#28a745' : '#2e6F40',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color 0.3s ease',
                    marginBottom: '10px'
                  }}
                  onMouseOver={(e) => {
                    if (!postImageFile) {
                      e.currentTarget.style.backgroundColor = '#24572b';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!postImageFile) {
                      e.currentTarget.style.backgroundColor = '#2e6F40';
                    }
                  }}
                >
                  {postImageFile ? (
                    <>📁 Image Selected: {postImageFile.name} - Click to Change</>
                  ) : (
                    <>📤 Choose Image to Upload</>
                  )}
                </button>
                
                {/* Show selected file name */}
                {postImageFile && (
                  <div style={{ 
                    marginBottom: '10px', 
                    padding: '8px', 
                    backgroundColor: '#f0f0f0', 
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: '#333'
                  }}>
                    <strong>Selected:</strong> {postImageFile.name} 
                    ({Math.round(postImageFile.size / 1024)} KB)
                  </div>
                )}
                
                {/* Preview */}
                {postImagePreview && (
                  <div style={{ marginTop: '15px' }}>
                    <img src={postImagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '2px solid #ddd' }} />
                    <button
                      type="button"
                      onClick={() => {
                        setPostImageFile(null);
                        setPostImagePreview(null);
                        if (postImageInputRef.current) {
                          postImageInputRef.current.value = '';
                        }
                      }}
                      style={{
                        marginTop: '10px',
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>
              <div className="bulletin-form-actions">
                <button onClick={() => { 
                  setShowPostForm(false); 
                  setPostEditingId(null);
                  setPostImageFile(null);
                  setPostImagePreview(null);
                  if (postImageInputRef.current) {
                    postImageInputRef.current.value = '';
                  }
                }} className="bulletin-btn-secondary">
                  <CancelIcon /> Cancel
                </button>
                <button onClick={handlePostSave} className="bulletin-btn-primary">
                  <SaveIcon /> {postEditingId ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bulletin-list">
          {posts.length === 0 ? (
            <div className="bulletin-empty">
              <p className="bulletin-empty-text">No blog posts found.</p>
            </div>
          ) : (
            posts.map((post) => (
              <div 
                key={post.id} 
                className="bulletin-card"
                style={{ cursor: 'pointer' }}
                onClick={() => handlePostClick(post)}
              >
                <div className="bulletin-card-header">
                  <div className="bulletin-card-title-section">
                    <h3 className="bulletin-card-title">{post.title}</h3>
                  </div>
                  <div className="bulletin-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => { setPostFormData(post); setPostEditingId(post.id); setShowPostForm(true); }} className="bulletin-action-btn edit">
                      <EditIcon />
                    </button>
                    <button onClick={() => handlePostDelete(post.id)} className="bulletin-action-btn delete">
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
                <div className="bulletin-card-content">
                  <p className="bulletin-card-text">{post.body}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderHousesTab = () => {
    return (
      <div className="bulletin-container">
        <div className="bulletin-controls">
          <div className="bulletin-search">
            <SearchIcon className="bulletin-search-icon" />
            <input type="text" placeholder="Search houses..." value={houseSearch} onChange={(e) => setHouseSearch(e.target.value)} className="bulletin-search-input" />
          </div>
          <div className="bulletin-filters">
            <button className={`bulletin-filter-btn ${houseFilter === 'all' ? 'active' : ''}`} onClick={() => setHouseFilter('all')}>All</button>
            <button className={`bulletin-filter-btn ${houseFilter === 'sale' ? 'active' : ''}`} onClick={() => setHouseFilter('sale')}>For Sale</button>
            <button className={`bulletin-filter-btn ${houseFilter === 'rent' ? 'active' : ''}`} onClick={() => setHouseFilter('rent')}>For Rent</button>
          </div>
        </div>

        <div className="houses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {filteredHouses.length === 0 ? (
            <div className="bulletin-empty" style={{ gridColumn: '1 / -1' }}>
              <p className="bulletin-empty-text">No houses found.</p>
            </div>
          ) : (
            filteredHouses.map((house) => (
              <div key={house.id} className="house-grid-card" style={{ cursor: 'pointer', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} onClick={() => { setModalHouse(house); setEditMode(false); setEditTitle(house.title); setEditPrice(house.price.toString()); setEditLocation(house.location); setEditDescription(house.description); setEditImagePreview(house.image || null); }}>
                {house.image ? (
                  <img src={house.image} alt={house.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '200px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Image</div>
                )}
                <div style={{ padding: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>{house.title}</h4>
                  <p style={{ margin: '5px 0', color: '#2e6F40', fontWeight: 'bold', fontSize: '1.2rem' }}>₱{Number(house.price).toLocaleString()}</p>
                  <p style={{ margin: '5px 0', color: '#666' }}>{house.location}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {modalHouse && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModalHouse(null)}>
            <div className="modal-content" style={{ background: 'white', borderRadius: '12px', padding: '30px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setModalHouse(null)} style={{ float: 'right', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
              {editMode ? (
                <div>
                  <h3>Edit Property</h3>
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label>Title</label>
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label>Price (₱)</label>
                    <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label>Location</label>
                    <input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label>Description</label>
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label>Image</label>
                    <input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) { setEditImage(e.target.files[0]); setEditImagePreview(URL.createObjectURL(e.target.files[0])); } }} />
                    {editImagePreview && <img src={editImagePreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', marginTop: '10px', borderRadius: '4px' }} />}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleHouseSaveEdit} className="bulletin-btn-primary">Save</button>
                    <button onClick={() => setEditMode(false)} className="bulletin-btn-secondary">Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  {modalHouse.image && <img src={modalHouse.image} alt={modalHouse.title} style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px', marginBottom: '20px' }} />}
                  <h3>{modalHouse.title}</h3>
                  <p style={{ color: '#2e6F40', fontWeight: 'bold', fontSize: '1.5rem' }}>₱{Number(modalHouse.price).toLocaleString()}</p>
                  <p><strong>Location:</strong> {modalHouse.location}</p>
                  <p><strong>Description:</strong> {modalHouse.description}</p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button onClick={() => setEditMode(true)} className="bulletin-btn-primary">Edit</button>
                    <button onClick={() => handleHouseDelete(modalHouse.id)} className="bulletin-action-btn delete">Delete</button>
                    <button onClick={() => setModalHouse(null)} className="bulletin-btn-secondary">Close</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBookingsTab = () => {
    return (
      <div className="bulletin-container">
        <div className="bulletin-controls">
          <div className="bulletin-search">
            <SearchIcon className="bulletin-search-icon" />
            <input type="text" placeholder="Search bookings..." value={bookingSearchQuery} onChange={(e) => setBookingSearchQuery(e.target.value)} className="bulletin-search-input" />
          </div>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px' }} />
          {selectedDate && <button onClick={() => setSelectedDate("")} className="bulletin-btn-secondary">Clear Date</button>}
        </div>

        <div style={{ marginTop: '20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#2e6F40', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Facility</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>User</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Time</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>No bookings found.</td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px' }}>{b.facility_name}</td>
                    <td style={{ padding: '12px' }}>{b.user_name || 'N/A'}</td>
                    <td style={{ padding: '12px' }}>{b.date}</td>
                    <td style={{ padding: '12px' }}>{formatTimeTo12Hour(b.start_time)} - {formatTimeTo12Hour(b.end_time)}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', background: b.status === 'approved' ? '#d4edda' : b.status === 'rejected' ? '#f8d7da' : '#fff3cd', color: b.status === 'approved' ? '#155724' : b.status === 'rejected' ? '#721c24' : '#856404' }}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {b.status === "pending" ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleBookingAction(b.id, "approved")} style={{ padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                          <button onClick={() => handleBookingAction(b.id, "rejected")} style={{ padding: '6px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                        </div>
                      ) : (
                        <button onClick={() => handleBookingDelete(b.id)} className="bulletin-action-btn delete">Delete</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPinsTab = () => {
    return (
      <div className="bulletin-container">
        <div className="bulletin-controls">
          <div className="bulletin-search">
            <SearchIcon className="bulletin-search-icon" />
            <input type="text" placeholder="Search pins..." value={pinSearch} onChange={(e) => setPinSearch(e.target.value)} className="bulletin-search-input" />
          </div>
          <Link to="/admin-dashboard/map" className="bulletin-add-btn" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            <AddIcon /> Manage on Map
          </Link>
        </div>

        <div className="bulletin-list">
          {filteredPins.length === 0 ? (
            <div className="bulletin-empty">
              <p className="bulletin-empty-text">No pins found.</p>
            </div>
          ) : (
            filteredPins.map((pin) => (
              <div key={pin.id} className="bulletin-card">
                <div className="bulletin-card-header">
                  <div className="bulletin-card-title-section">
                    <h3 className="bulletin-card-title">{pin.name}</h3>
                    <div className="bulletin-card-badges">
                      {pin.status && <span className="bulletin-badge published-badge">{pin.status}</span>}
                    </div>
                  </div>
                  <div className="bulletin-card-actions">
                    <button onClick={() => handlePinDelete(pin.id)} className="bulletin-action-btn delete">
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
                <div className="bulletin-card-content">
                  {pin.description && <p className="bulletin-card-text">{pin.description}</p>}
                  <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '14px', color: '#666' }}>
                    {pin.price && <span><strong>Price:</strong> {pin.price}</span>}
                    {pin.occupant && <span><strong>Occupant:</strong> {pin.occupant}</span>}
                    {pin.square_meter && <span><strong>Size:</strong> {pin.square_meter} m²</span>}
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '14px', color: '#999' }}>
                    <strong>Location:</strong> {pin.latitude.toFixed(6)}, {pin.longitude.toFixed(6)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderMediaGalleryTab = () => {
    const stats = {
      total: mediaItems.length,
      images: mediaItems.filter(m => m.media_type === 'image').length,
      videos: mediaItems.filter(m => m.media_type === 'video').length,
      featured: mediaItems.filter(m => m.is_featured).length
    };

    return (
      <div className="bulletin-container">
        <div className="bulletin-stats-grid">
          <div className="bulletin-stat-card">
            <div className="bulletin-stat-value">{stats.total}</div>
            <div className="bulletin-stat-label">Total Media</div>
          </div>
          <div className="bulletin-stat-card published">
            <div className="bulletin-stat-value">{stats.images}</div>
            <div className="bulletin-stat-label">Images</div>
          </div>
          <div className="bulletin-stat-card draft">
            <div className="bulletin-stat-value">{stats.videos}</div>
            <div className="bulletin-stat-label">Videos</div>
          </div>
          <div className="bulletin-stat-card" >
            <div className="bulletin-stat-value">{stats.featured}</div>
            <div className="bulletin-stat-label">Featured</div>
          </div>
        </div>

        <div className="bulletin-controls">
          <div className="bulletin-search">
            <SearchIcon className="bulletin-search-icon" />
            <input
              type="text"
              placeholder="Search media..."
              value={mediaSearchTerm}
              onChange={(e) => setMediaSearchTerm(e.target.value)}
              className="bulletin-search-input"
            />
          </div>
          <div className="bulletin-filters">
            <button
              className={`bulletin-filter-btn ${mediaFilterCategory === 'all' ? 'active' : ''}`}
              onClick={() => setMediaFilterCategory('all')}
            >
              All
            </button>
            <button
              className={`bulletin-filter-btn ${mediaFilterCategory === 'events' ? 'active' : ''}`}
              onClick={() => setMediaFilterCategory('events')}
            >
              Events
            </button>
            <button
              className={`bulletin-filter-btn ${mediaFilterCategory === 'facilities' ? 'active' : ''}`}
              onClick={() => setMediaFilterCategory('facilities')}
            >
              Facilities
            </button>
            <button
              className={`bulletin-filter-btn ${mediaFilterCategory === 'properties' ? 'active' : ''}`}
              onClick={() => setMediaFilterCategory('properties')}
            >
              Properties
            </button>
            <button
              className={`bulletin-filter-btn ${mediaFilterCategory === 'activities' ? 'active' : ''}`}
              onClick={() => setMediaFilterCategory('activities')}
            >
              Activities
            </button>
            <button
              className={`bulletin-filter-btn ${mediaFilterCategory === 'announcements' ? 'active' : ''}`}
              onClick={() => setMediaFilterCategory('announcements')}
            >
              Announcements
            </button>
          </div>
          <button 
            onClick={() => { 
              setShowMediaForm(true); 
              setMediaEditingId(null); 
              setMediaFormData({
                title: '',
                description: '',
                media_file: null,
                media_type: 'image',
                category: 'activities',
                is_approved: true,
                is_featured: false,
                is_public: true,
                order: 0
              });
              setMediaPreview(null);
            }} 
            className="bulletin-add-btn"
          >
            <AddIcon /> Upload Media
          </button>
        </div>

        {showMediaForm && (
          <div className="bulletin-form-card">
            <h2 className="bulletin-form-title">
              {mediaEditingId ? 'Edit Media' : 'Upload New Media'}
            </h2>
            <div className="bulletin-form-content">
              <div className="bulletin-form-group">
                <label className="bulletin-form-label">Title <span className="required">*</span></label>
                <input
                  type="text"
                  name="title"
                  value={mediaFormData.title}
                  onChange={handleMediaInputChange}
                  className="bulletin-form-input"
                  maxLength={200}
                />
              </div>
              <div className="bulletin-form-group">
                <label className="bulletin-form-label">Description</label>
                <textarea
                  name="description"
                  value={mediaFormData.description || ''}
                  onChange={handleMediaInputChange}
                  rows={4}
                  className="bulletin-form-textarea"
                />
              </div>
              <div className="bulletin-form-group">
                <label className="bulletin-form-label">Media File {!mediaEditingId && <span className="required">*</span>}</label>
                
                {/* Hidden file input */}
                <input
                  ref={mediaFileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaFileChange}
                  style={{ display: 'none' }}
                />
                
                {/* Custom upload button */}
                <button
                  type="button"
                  onClick={() => mediaFileInputRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    backgroundColor: mediaFormData.media_file ? '#28a745' : '#2e6F40',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color 0.3s ease',
                    marginBottom: '10px'
                  }}
                  onMouseOver={(e) => {
                    if (!mediaFormData.media_file) {
                      e.currentTarget.style.backgroundColor = '#24572b';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!mediaFormData.media_file) {
                      e.currentTarget.style.backgroundColor = '#2e6F40';
                    }
                  }}
                >
                  {mediaFormData.media_file ? (
                    <>📁 File Selected: {mediaFormData.media_file.name} - Click to Change</>
                  ) : (
                    <>📤 Choose Image or Video to Upload</>
                  )}
                </button>
                
                {/* Show selected file name */}
                {mediaFormData.media_file && (
                  <div style={{ 
                    marginBottom: '10px', 
                    padding: '8px', 
                    backgroundColor: '#f0f0f0', 
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: '#333'
                  }}>
                    <strong>Selected:</strong> {mediaFormData.media_file.name} 
                    ({mediaFormData.media_type === 'image' ? 'Image' : 'Video'}, 
                    {Math.round(mediaFormData.media_file.size / 1024)} KB)
                  </div>
                )}
                
                {/* Preview */}
                {mediaPreview && (
                  <div style={{ marginTop: '15px' }}>
                    {mediaFormData.media_type === 'image' ? (
                      <img src={mediaPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '2px solid #ddd' }} />
                    ) : (
                      <video src={mediaPreview} controls style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '2px solid #ddd' }} />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMediaFormData(prev => ({ ...prev, media_file: null }));
                        setMediaPreview(null);
                        if (mediaFileInputRef.current) {
                          mediaFileInputRef.current.value = '';
                        }
                      }}
                      style={{
                        marginTop: '10px',
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      Remove File
                    </button>
                  </div>
                )}
              </div>
              <div className="bulletin-form-group">
                <label className="bulletin-form-label">Category</label>
                <select
                  name="category"
                  value={mediaFormData.category}
                  onChange={handleMediaInputChange}
                  className="bulletin-form-input"
                >
                  <option value="events">Community Events</option>
                  <option value="facilities">Facilities & Amenities</option>
                  <option value="properties">Properties</option>
                  <option value="activities">Community Activities</option>
                  <option value="announcements">Announcements</option>
                </select>
              </div>
              <div className="bulletin-form-group">
                <label className="bulletin-form-label">Order (for sorting, lower numbers appear first)</label>
                <input
                  type="number"
                  name="order"
                  value={mediaFormData.order || 0}
                  onChange={handleMediaInputChange}
                  className="bulletin-form-input"
                />
              </div>
              <div className="bulletin-form-group">
                <label className="bulletin-form-checkbox">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={mediaFormData.is_featured}
                    onChange={(e) => setMediaFormData({ ...mediaFormData, is_featured: e.target.checked })}
                    className="bulletin-checkbox"
                  />
                  <span className="bulletin-checkbox-label">Featured</span>
                </label>
              </div>
              <div className="bulletin-form-group">
                <label className="bulletin-form-checkbox">
                  <input
                    type="checkbox"
                    name="is_public"
                    checked={mediaFormData.is_public}
                    onChange={(e) => setMediaFormData({ ...mediaFormData, is_public: e.target.checked })}
                    className="bulletin-checkbox"
                  />
                  <span className="bulletin-checkbox-label">Public</span>
                </label>
              </div>
              <div className="bulletin-form-actions">
                <button onClick={handleMediaCancel} className="bulletin-btn-secondary">
                  <CancelIcon /> Cancel
                </button>
                <button onClick={handleMediaSave} className="bulletin-btn-primary">
                  <SaveIcon /> {mediaEditingId ? 'Update' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bulletin-list">
          {filteredMedia.length === 0 ? (
            <div className="bulletin-empty">
              <p className="bulletin-empty-text">No media found.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {filteredMedia.map((media) => (
                <div key={media.id} className="bulletin-card">
                  <div className="bulletin-card-header">
                    <div className="bulletin-card-title-section">
                      <h3 className="bulletin-card-title">{media.title}</h3>
                      <div className="bulletin-card-badges">
                        <span className="bulletin-badge published-badge">
                          {media.media_type === 'image' ? '📷 Image' : '🎥 Video'}
                        </span>
                        {media.is_featured && (
                          <span className="bulletin-badge" style={{ background: '#667eea', color: 'white' }}>
                            ⭐ Featured
                          </span>
                        )}
                        <span className="bulletin-badge draft-badge">
                          {media.category}
                        </span>
                      </div>
                    </div>
                    <div className="bulletin-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleMediaToggleFeatured(media)} 
                        className={`bulletin-action-btn ${media.is_featured ? 'unpublish' : 'publish'}`}
                        title={media.is_featured ? 'Unfeature' : 'Feature'}
                      >
                        {media.is_featured ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </button>
                      <button onClick={() => handleMediaEdit(media)} className="bulletin-action-btn edit">
                        <EditIcon />
                      </button>
                      <button onClick={() => media.id && handleMediaDelete(media.id)} className="bulletin-action-btn delete">
                        <DeleteIcon />
                      </button>
                    </div>
                  </div>
                  <div className="bulletin-card-content">
                    {media.media_url && (
                      <div style={{ marginBottom: '15px', borderRadius: '8px', overflow: 'hidden' }}>
                        {media.media_type === 'image' ? (
                          <img 
                            src={media.media_url.startsWith('http') ? media.media_url : `http://127.0.0.1:8000${media.media_url}`}
                            alt={media.title}
                            style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                          />
                        ) : (
                          <video 
                            src={media.media_url.startsWith('http') ? media.media_url : `http://127.0.0.1:8000${media.media_url}`}
                            controls
                            style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                          />
                        )}
                      </div>
                    )}
                    {media.description && (
                      <p className="bulletin-card-text">{media.description}</p>
                    )}
                    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '10px' }}>
                      {media.views_count !== undefined && <span>Views: {media.views_count}</span>}
                      {media.created_at && (
                        <span style={{ marginLeft: '15px' }}>
                          {formatDate(media.created_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderVisitorRequestsTab = () => {
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

    const stats = {
      total: visitorRequests.length,
      pending: visitorRequests.filter(r => r.status === 'pending_admin').length,
      approved: visitorRequests.filter(r => r.status === 'approved').length,
      declined: visitorRequests.filter(r => r.status === 'declined').length,
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending_admin': return '#ff9800';
        case 'approved': return '#4CAF50';
        case 'declined': return '#f44336';
        case 'expired': return '#9e9e9e';
        case 'used': return '#2196F3';
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
        default: return status;
      }
    };

    return (
      <div>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e6F40' }}>{stats.total}</div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Total Requests</div>
          </div>
          <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>{stats.pending}</div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Pending Approval</div>
          </div>
          <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>{stats.approved}</div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Approved</div>
          </div>
          <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>{stats.declined}</div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Declined</div>
          </div>
        </div>

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
            style={{ padding: '10px 20px', backgroundColor: '#2e6F40', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
          >
            Refresh
          </button>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '16px', color: '#666' }}>No visitor requests found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                style={{
                  padding: '20px',
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  borderLeft: `4px solid ${getStatusColor(req.status)}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{req.visitor_name}</h3>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', fontSize: '14px', color: '#666' }}>
                      <span><strong>Email:</strong> {req.visitor_email}</span>
                      <span><strong>Contact:</strong> {req.visitor_contact_number || 'N/A'}</span>
                      <span><strong>Homeowner:</strong> {req.resident_name || req.resident_username}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '15px', fontSize: '14px' }}>
                  <div><strong>Visit Date:</strong> {new Date(req.visit_date).toLocaleDateString()}</div>
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

                {req.status === 'pending_admin' && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
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
                  </div>
                )}

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
    );
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main">
          <div className="bulletin-hero-section">
            <div className="bulletin-hero-content">
              <h1 className="bulletin-hero-title">Bulletin Board</h1>
              <p className="bulletin-hero-subtitle">
                Manage all community information, announcements, news, properties, bookings, map pins, and media gallery in one place
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{ background: 'white', borderBottom: '2px solid #e0e0e0', margin: '0 -20px 30px -20px', padding: '0 20px' }}>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
              {(['announcements', 'blog-stories', 'houses', 'bookings', 'pins', 'media-gallery'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    background: activeTab === tab ? '#2e6F40' : 'transparent',
                    color: activeTab === tab ? 'white' : '#666',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '15px',
                    borderBottom: activeTab === tab ? '3px solid #2e6F40' : '3px solid transparent',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab === 'media-gallery' ? 'Community Gallery' : tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </main>
      </div>

      {/* Bulletin Detail Modal with Comments */}
      {selectedBulletin && (
        <div 
          className="modal-overlay" 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0,0,0,0.7)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1000 
          }} 
          onClick={() => setSelectedBulletin(null)}
        >
          <div 
            className="modal-content" 
            style={{ 
              background: 'white', 
              borderRadius: '12px', 
              padding: '30px', 
              maxWidth: '800px', 
              width: '90%', 
              maxHeight: '90vh', 
              overflow: 'auto',
              position: 'relative'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedBulletin(null)} 
              style={{ 
                position: 'absolute', 
                top: '15px', 
                right: '15px', 
                background: 'none', 
                border: 'none', 
                fontSize: '28px', 
                cursor: 'pointer',
                color: '#666',
                fontWeight: 'bold'
              }}
            >
              ×
            </button>

            {/* Bulletin Content */}
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ marginBottom: '15px', color: '#2e6F40' }}>{selectedBulletin.title}</h2>
              <div style={{ marginBottom: '15px', color: '#666', fontSize: '14px' }}>
                {selectedBulletin.created_by_username && (
                  <span style={{ marginRight: '15px' }}>Created by: <strong>{selectedBulletin.created_by_username}</strong></span>
                )}
                {selectedBulletin.created_at && (
                  <span>Created: {formatDate(selectedBulletin.created_at)}</span>
                )}
              </div>
              <div style={{ 
                padding: '20px', 
                background: '#f8f9fa', 
                borderRadius: '8px', 
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {selectedBulletin.content}
              </div>
            </div>

            {/* Admin Actions */}
            {isAdmin && (
              <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => {
                    handleBulletinEdit(selectedBulletin);
                    setSelectedBulletin(null);
                  }} 
                  className="bulletin-btn-primary"
                  style={{ flex: 1 }}
                >
                  <EditIcon /> Edit Bulletin
                </button>
                <button 
                  onClick={() => {
                    if (selectedBulletin.id) {
                      handleBulletinDelete(selectedBulletin.id);
                      setSelectedBulletin(null);
                    }
                  }} 
                  className="bulletin-action-btn delete"
                  style={{ flex: 1 }}
                >
                  <DeleteIcon /> Delete Bulletin
                </button>
              </div>
            )}

            {/* Comments Section */}
            <div style={{ borderTop: '2px solid #e0e0e0', paddingTop: '20px' }}>
              <h3 style={{ marginBottom: '15px', color: '#2e6F40' }}>Comments</h3>
              
              {/* Comment Form */}
              <form onSubmit={handleCommentSubmit} style={{ marginBottom: '20px' }}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                    marginBottom: '10px'
                  }}
                />
                <button 
                  type="submit" 
                  className="bulletin-btn-primary"
                  style={{ width: '100%' }}
                >
                  Post Comment
                </button>
              </form>

              {/* Comments List */}
              {loadingComments ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Loading comments...</div>
              ) : bulletinComments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No comments yet. Be the first to comment!</div>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {bulletinComments.map((comment) => (
                    <div 
                      key={comment.id} 
                      style={{ 
                        padding: '15px', 
                        marginBottom: '15px', 
                        background: '#f8f9fa', 
                        borderRadius: '8px',
                        borderLeft: comment.is_admin ? '4px solid #2e6F40' : '4px solid #007bff'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <strong style={{ color: '#2e6F40' }}>
                            {comment.username}
                            {comment.is_admin && <span style={{ marginLeft: '8px', color: '#2e6F40', fontSize: '12px' }}>(Admin)</span>}
                            {comment.is_verified && !comment.is_admin && <span style={{ marginLeft: '8px', color: '#007bff', fontSize: '12px' }}>✓ Verified</span>}
                          </strong>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            {formatDate(comment.created_at)}
                          </div>
                        </div>
                        {(isAdmin || comment.user_id === currentUserId) && (
                          <button
                            onClick={() => handleCommentDelete(comment.id)}
                            className="bulletin-action-btn delete"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            title={isAdmin ? "Delete comment (Admin)" : "Delete your comment"}
                          >
                            <DeleteIcon style={{ fontSize: '16px' }} />
                          </button>
                        )}
                      </div>
                      <div style={{ color: '#333', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {comment.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Blog Post Detail Modal with Comments */}
      {selectedPost && (
        <div 
          className="modal-overlay" 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0,0,0,0.7)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1000,
            overflow: 'auto',
            padding: '20px'
          }} 
          onClick={() => setSelectedPost(null)}
        >
          <div 
            className="modal-content" 
            style={{ 
              background: 'white', 
              borderRadius: '12px', 
              padding: '40px', 
              maxWidth: '900px', 
              width: '100%', 
              maxHeight: '90vh', 
              overflow: 'auto',
              position: 'relative',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedPost(null)} 
              style={{ 
                position: 'absolute', 
                top: '20px', 
                right: '20px', 
                background: 'none', 
                border: 'none', 
                fontSize: '32px', 
                cursor: 'pointer',
                color: '#666',
                fontWeight: 'bold',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f0f0f0';
                e.currentTarget.style.color = '#333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#666';
              }}
            >
              ×
            </button>

            {/* Post Header with Illustration Placeholder */}
            <div style={{ 
              marginBottom: '30px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              padding: '40px',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: '#2e6F40',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                COMMUNITY
                <span style={{ cursor: 'pointer' }} onClick={() => setSelectedPost(null)}>×</span>
              </div>
              <div style={{
                color: 'white',
                fontSize: '48px',
                fontWeight: 'bold',
                textAlign: 'center',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}>
                🏠
              </div>
            </div>

            {/* Post Content */}
            <div style={{ marginBottom: '30px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '15px', 
                marginBottom: '20px' 
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: '#2e6F40',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  C
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
                    Community Admin
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
                <div style={{
                  background: '#f0f0f0',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  3 min read
                </div>
              </div>

              <h1 style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                color: '#2e6F40', 
                marginBottom: '20px',
                lineHeight: '1.3'
              }}>
                {selectedPost.title}
              </h1>

              <div style={{ 
                fontSize: '16px', 
                lineHeight: '1.8', 
                color: '#333',
                whiteSpace: 'pre-wrap',
                marginBottom: '30px'
              }}>
                {selectedPost.body}
              </div>
            </div>

            {/* Admin Actions */}
            <div style={{ 
              marginBottom: '30px', 
              padding: '20px', 
              background: '#f8f9fa', 
              borderRadius: '8px',
              display: 'flex',
              gap: '10px'
            }}>
              <button 
                onClick={() => {
                  setPostFormData(selectedPost);
                  setPostEditingId(selectedPost.id);
                  setShowPostForm(true);
                  setSelectedPost(null);
                }} 
                className="bulletin-btn-primary"
                style={{ flex: 1 }}
              >
                <EditIcon /> Edit Post
              </button>
              <button 
                onClick={handlePostDeleteFromModal} 
                className="bulletin-action-btn delete"
                style={{ flex: 1 }}
              >
                <DeleteIcon /> Delete Post
              </button>
            </div>

            {/* Comments Section */}
            <div style={{ borderTop: '2px solid #e0e0e0', paddingTop: '30px' }}>
              <h3 style={{ 
                marginBottom: '20px', 
                color: '#2e6F40',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                Comments ({blogComments.length})
              </h3>
              
              {/* Comment Form */}
              <form onSubmit={handleBlogCommentSubmit} style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    background: '#2e6F40',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {isAdmin ? 'A' : 'U'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <textarea
                      value={blogCommentText}
                      onChange={(e) => setBlogCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '15px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        resize: 'vertical',
                        marginBottom: '10px',
                        fontFamily: 'inherit'
                      }}
                    />
                    <button 
                      type="submit" 
                      className="bulletin-btn-primary"
                      style={{ width: '100%' }}
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              {loadingBlogComments ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  Loading comments...
                </div>
              ) : blogComments.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#999',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  No comments yet. Be the first to comment!
                </div>
              ) : (
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {blogComments.map((comment) => (
                    <div 
                      key={comment.id} 
                      style={{ 
                        padding: '20px', 
                        marginBottom: '20px', 
                        background: '#f8f9fa', 
                        borderRadius: '8px',
                        borderLeft: comment.is_admin ? '4px solid #2e6F40' : '4px solid #007bff'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start', 
                        marginBottom: '12px' 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: comment.is_admin ? '#2e6F40' : '#007bff',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            flexShrink: 0
                          }}>
                            {comment.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <strong style={{ color: '#333' }}>{comment.username}</strong>
                              {comment.is_admin && (
                                <span style={{
                                  background: '#dc3545',
                                  color: 'white',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 'bold'
                                }}>
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {formatDate(comment.created_at)}
                            </div>
                          </div>
                        </div>
                        {(isAdmin || comment.user_id === currentUserId) && (
                          <button
                            onClick={() => handleBlogCommentDelete(comment.id)}
                            className="bulletin-action-btn delete"
                            style={{
                              padding: '4px 8px',
                              fontSize: '16px'
                            }}
                            title={isAdmin ? "Delete comment (Admin)" : "Delete your comment"}
                          >
                            <DeleteIcon style={{ fontSize: '16px' }} />
                          </button>
                        )}
                      </div>
                      <div style={{ 
                        color: '#333', 
                        lineHeight: '1.6', 
                        whiteSpace: 'pre-wrap',
                        marginLeft: '52px'
                      }}>
                        {comment.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminBulletin;
