import React, { useState, ChangeEvent, FormEvent, useEffect, useRef } from 'react';
import './LoginPage.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setToken, getToken } from '../utils/auth';
import NavBar from './NavBar';
import Footer from './Footer';
import contactIcon from '../images/contact.png';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import aboutUsImage1 from '../images/aboutus.jpg';
import aboutUsImage2 from '../images/aboutus.png';
import aboutUsImage3 from '../images/aboutus (2).png';
import logoImage from '../images/logo.png';
import house123Image from '../images/house123.png';
import loginbgImage from '../images/loginbg.png';
import service1Image from '../images/service-1.png';
import service2Image from '../images/service-2.png';
import service3Image from '../images/service-3.png';

interface LoginPageProps {}

const ForgotPassword: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg('');
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/password-reset/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to send reset email.');
      }

      setMsg(data.message || 'Password reset link sent to your email!');
      setEmail('');
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="forgot-password-modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '10px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        }}
      >
        <img src={logoImage} className="logo" alt="Logo" />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', textAlign: 'center' }}>
          Forgot Password
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '12px',
              fontSize: '1rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              boxSizing: 'border-box',
            }}
          />
          {msg && <p style={{ color: 'green', fontSize: '0.9rem' }}>{msg}</p>}
          {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              marginTop: '10px',
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

interface Post {
  id: number;
  title: string;
  body: string;
}

interface BlogStory {
  id: number;
  title: string;
  content: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  image?: string;
  isRealPost?: boolean; // Flag to indicate if this is a real post from the database
}

interface Comment {
  id: number;
  blog_id: number;
  user: string;
  user_id?: number; // Add user_id to check ownership
  username: string;
  content: string;
  created_at: string;
  is_admin?: boolean;
}

interface User {
  id: number;
  username: string;
  email: string;
  is_staff?: boolean;
}

interface NewsItem {
  id: number;
  title: string;
  content: string;
  created_at: string;
  is_published?: boolean;
}

interface AlertItem {
  id: number;
  title: string;
  message: string;
  severity: string;
  created_at: string;
  is_active?: boolean;
}

interface MediaItem {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  type: 'image' | 'video';
  date?: string;
}

const LoginPage: React.FC<LoginPageProps> = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const [viewOnly, setViewOnly] = useState(true); // ✅ Start in View Only mode
  
  // State for Bulletin Board, News, and Blogs
  const [bulletinPosts, setBulletinPosts] = useState<Post[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [blogStories, setBlogStories] = useState<BlogStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<BlogStory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const mediaGalleryRef = useRef<HTMLDivElement>(null);
  const [currentAboutImageIndex, setCurrentAboutImageIndex] = useState(0);
  
  // Array of about us images
  const aboutUsImages = [
    aboutUsImage1,
    aboutUsImage2,
    aboutUsImage3,
  ];
  const [user, setUser] = useState<User | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [fetchingComments, setFetchingComments] = useState(false);

  const navigate = useNavigate();

  // Helper function to calculate scroll position
  const calculateScrollPosition = (pageNum: number, gallery: HTMLDivElement | null): number => {
    if (!gallery) return 0;
    
    const firstCard = gallery.querySelector('.media-card-horizontal') as HTMLElement;
    if (firstCard) {
      const cardWidth = firstCard.offsetWidth;
      const gap = 20;
      const cardsPerPage = 5;
      // Calculate the position of the first card of the requested page
      // Page 1: item 0, Page 2: item 5, Page 3: item 10, etc.
      const firstItemIndex = (pageNum - 1) * cardsPerPage;
      // Scroll to the position of that first card
      // Account for padding (20px on each side = 40px total)
      const padding = 20;
      return firstItemIndex * (cardWidth + gap) + padding;
    }
    // Fallback calculation
    const cardWidth = 300;
    const gap = 20;
    const cardsPerPage = 5;
    const firstItemIndex = (pageNum - 1) * cardsPerPage;
    const padding = 20;
    return firstItemIndex * (cardWidth + gap) + padding;
  };

  // Check if form parameter is present to skip view-only mode
  useEffect(() => {
    const showForm = searchParams.get('form') === 'true';
    if (showForm) {
      setViewOnly(false);
    }
  }, [searchParams]);

  // Fetch Bulletin Board, News, Alerts, and Media
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch bulletin board posts (public endpoint)
        let postsData: Post[] = [];
        try {
          const postsRes = await fetch('http://127.0.0.1:8000/api/posts/');
          if (postsRes.ok) {
            postsData = await postsRes.json();
          } else {
            // Silently handle non-ok responses (401, 500, etc.)
            console.warn('Could not fetch posts:', postsRes.status, postsRes.statusText);
          }
        } catch (err) {
          // Silently fail if backend is not running or network error
          console.warn('Could not fetch posts (backend may not be running)');
        }

        // Fetch news (public endpoint - read only)
        let newsData: NewsItem[] = [];
        try {
          const newsRes = await fetch('http://127.0.0.1:8000/api/news/');
          newsData = newsRes.ok ? await newsRes.json() : [];
        } catch (err) {
          console.warn('Could not fetch news (backend may not be running)');
        }

        // Fetch alerts (public endpoint - read only)
        let alertsData: AlertItem[] = [];
        try {
          const alertsRes = await fetch('http://127.0.0.1:8000/api/alerts/');
          alertsData = alertsRes.ok ? await alertsRes.json() : [];
        } catch (err) {
          console.warn('Could not fetch alerts (backend may not be running)');
        }

        // Fetch houses with images for media gallery
        let housesData = [];
        try {
          const housesRes = await fetch('http://127.0.0.1:8000/api/guest/houses/');
          housesData = housesRes.ok ? await housesRes.json() : [];
        } catch (err) {
          console.warn('Could not fetch houses (backend may not be running)');
        }

        setBulletinPosts(postsData.slice(0, 1)); // Show latest post only
        setNewsItems(newsData.filter(item => item.is_published !== false).slice(0, 3)); // Show latest 3 published news
        setAlerts(alertsData.filter(item => item.is_active !== false).slice(0, 3)); // Show latest 3 active alerts

        // Convert bulletin posts to blog stories format (using actual admin bulletin data)
        const convertedBlogs: BlogStory[] = postsData.slice(0, 3).map((post) => ({
          id: post.id,
          title: post.title,
          content: post.body,
          author: 'Community Admin',
          date: new Date().toISOString(),
          category: 'Community',
          readTime: `${Math.ceil(post.body.length / 200)} min read`,
          image: house123Image,
          isRealPost: true, // Mark as real post from database
        }));
        setBlogStories(convertedBlogs);

        // Fetch community media from API (same as HomePage and AdminBulletin)
        let communityMediaData: any[] = [];
        try {
          const mediaRes = await fetch('http://127.0.0.1:8000/api/community-media/?is_public=true');
          if (mediaRes.ok) {
            communityMediaData = await mediaRes.json();
          }
        } catch (err) {
          console.warn('Could not fetch community media (backend may not be running)');
        }

        // Convert API media to MediaItem format (same as HomePage and AdminBulletin)
        const apiMedia: MediaItem[] = communityMediaData
          .filter((item: any) => item.is_approved && item.is_public)
          .map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description || '',
            imageUrl: item.media_url 
              ? (item.media_url.startsWith('http') ? item.media_url : `http://127.0.0.1:8000${item.media_url}`)
              : '',
            type: item.media_type as 'image' | 'video',
            date: item.created_at || new Date().toISOString(),
          }));

        // Fallback: Use house images if no community media available
        if (apiMedia.length === 0) {
          const houseMedia: MediaItem[] = housesData
            .filter((house: any) => house.image)
            .map((house: any, index: number) => ({
              id: house.id || index,
              title: house.title || `House ${house.id}`,
              description: house.description || house.location || 'Beautiful home in Happy Homes community',
              imageUrl: house.image.startsWith('http') ? house.image : `http://127.0.0.1:8000${house.image}`,
              type: 'image' as const,
              date: house.created_at || new Date().toISOString(),
            }));
          setMediaItems(houseMedia);
        } else {
          // Use API media (limit to 30 items like HomePage)
          setMediaItems(apiMedia.slice(0, 30));
        }
      } catch (err: any) {
        // Only log if it's not a network error (backend not running)
        if (err?.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
          console.error('Error fetching data:', err);
        } else {
          console.warn('Backend server may not be running. Some features may not be available.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch user profile when component mounts
  useEffect(() => {
    const token = getToken();
    if (token) {
      fetch('http://127.0.0.1:8000/api/profile/', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          return null;
        })
        .then((data: User | null) => {
          if (data) {
            setUser(data);
          }
        })
        .catch(() => {
          // User not authenticated or error
          setUser(null);
        });
    } else {
      setUser(null);
    }
  }, []);

  // Fetch comments when a blog is selected - works for everyone (guests, users, admins)
  useEffect(() => {
    if (selectedBlog) {
      // Fetch comments immediately
      fetchComments(selectedBlog.id);
      
      // Poll for new comments every 3 seconds for real-time updates (works for everyone)
      const intervalId = setInterval(() => {
        if (selectedBlog) {
          fetchComments(selectedBlog.id);
        }
      }, 3000);
      
      return () => clearInterval(intervalId);
    } else {
      setComments([]);
      return;
    }
  }, [selectedBlog]);

  const fetchComments = async (blogId: number) => {
    setFetchingComments(true);
    try {
      const token = getToken();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://127.0.0.1:8000/api/blog-comments/?post_id=${blogId}`, {
        method: 'GET',
        headers: headers,
      });

      if (response.ok) {
        const data = await response.json();
        // Map API response to Comment interface
        const mappedComments: Comment[] = data.map((comment: any) => ({
          id: comment.id,
          blog_id: comment.post,
          user: comment.username,
          user_id: comment.user_id || comment.user, // Include user_id for ownership check
          username: comment.username,
          content: comment.content,
          created_at: comment.created_at,
          is_admin: comment.is_admin,
        }));
        setComments(mappedComments);
      } else {
        console.error('Error fetching comments:', response.statusText);
        setComments([]);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setComments([]);
    } finally {
      setFetchingComments(false);
    }
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedBlog || !user) return;

    // Check if this is a real post from the database (allow if isRealPost is true or undefined)
    // If undefined, we'll try to post and let the backend validate
    if (selectedBlog.isRealPost === false) {
      alert('Comments are only available for posts from the database. Please create a post first in the admin panel.');
      return;
    }
    
    // If isRealPost is undefined, we'll attempt to comment and handle errors gracefully

    setCommentLoading(true);
    try {
      const token = getToken();
      if (!token) {
        alert('Please login to comment');
        setCommentLoading(false);
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/api/blog-comments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          post: selectedBlog.id,
          content: newComment.trim(),
        }),
      });

      if (response.ok) {
        const newCommentData = await response.json();
        // Map API response to Comment interface
        const comment: Comment = {
          id: newCommentData.id,
          blog_id: newCommentData.post,
          user: newCommentData.username,
          user_id: newCommentData.user_id || newCommentData.user,
          username: newCommentData.username,
          content: newCommentData.content,
          created_at: newCommentData.created_at,
          is_admin: newCommentData.is_admin,
        };
        
        // Add new comment to the top of the list immediately
        setComments([comment, ...comments]);
        setNewComment('');
        
        // Refresh comments from server to ensure consistency (real-time update)
        if (selectedBlog) {
          fetchComments(selectedBlog.id);
        }
      } else {
        // Try to get error message from response
        let errorMessage = 'Failed to add comment. Please try again.';
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (typeof errorData === 'object') {
            // Handle validation errors
            const errors = Object.values(errorData).flat();
            errorMessage = errors.join(', ') || errorMessage;
          }
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        console.error('Comment submission error:', errorMessage, response.status);
        alert(errorMessage);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      alert(`Failed to add comment: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user) return;
    
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        alert('Please login to delete comments');
        return;
      }

      const response = await fetch(`http://127.0.0.1:8000/api/blog-comments/${commentId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok || response.status === 204) {
        // Remove comment from list immediately
        setComments(comments.filter(c => c.id !== commentId));
        
        // Refresh comments from server to ensure consistency
        if (selectedBlog) {
          fetchComments(selectedBlog.id);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.detail || 'Failed to delete comment. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await fetch('http://127.0.0.1:8000/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Invalid username or password');
        } else {
          throw new Error(`Server error: ${res.status}`);
        }
      }
      const data: { access: string } = await res.json();

      setToken(data.access);
      
      // Check if user is admin and redirect accordingly
      try {
        const profileRes = await fetch('http://127.0.0.1:8000/api/profile/', {
          headers: { Authorization: `Bearer ${data.access}` }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.is_staff) {
            navigate('/admin-dashboard');
          } else {
            navigate('/home');
          }
        } else {
          navigate('/home');
        }
      } catch (profileErr) {
        // If profile fetch fails, default to home
        navigate('/home');
      }
    } catch (err: any) {
      // Check if it's a network error (backend not running)
      if (err?.message?.includes('Failed to fetch') || 
          err?.message?.includes('NetworkError') || 
          err?.name === 'TypeError' && err?.message?.includes('fetch')) {
        setErrorMsg('Cannot connect to server. Please make sure the backend server is running at http://127.0.0.1:8000');
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An unknown error occurred. Please try again.');
      }
    }
  };

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      if (errorMsg) setErrorMsg('');
    };

  return (
    <>
      <NavBar profile={null} />
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          paddingTop: '100px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background layer */}
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            left: '-20px',
            right: '-20px',
            bottom: '-20px',
            backgroundImage: `url(${loginbgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
            backgroundColor: 'transparent',
            opacity: 1,
            overflow: 'hidden',
          }}
        />
        {/* Dark overlay for better text contrast */}
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            left: '-20px',
            right: '-20px',
            bottom: '-20px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 0,
            overflow: 'hidden',
          }}
        />
        {/* Content layer - no blur */}
        <div className="login-page" style={{ position: 'relative', zIndex: 1 }}>
{viewOnly ? (
  <div
  style={{
    backgroundColor: 'transparent',
    padding: '30px',
    borderRadius: '8px',
    textAlign: 'center',
    maxWidth: '1000px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '30px',
  }}
  > 
    <div style={{ flex: 1, textAlign: 'center' }}>
      <p style={{
        fontSize: '1.5rem', 
        textAlign: 'center',
        color: 'white',
        marginBottom: '-20px', 
        fontWeight: 'bold',
        textShadow: '1px 1px 3px rgba(0, 0, 0, 0.3)'
      }}>Happy Homes Community</p>
      <h2 style={{ 
        fontSize: '5.5rem', 
        marginBottom: '10px', 
        color: 'white', 
        textAlign: 'center', 
        fontWeight: 'bold',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.4)'
      }}>
        Happy Homes <br /> Where Life Connects
      </h2>
      <p style={{ 
        color: 'white', 
        marginBottom: '20px', 
        textAlign: 'center',
        fontSize: '1.4rem',
        textShadow: '1px 1px 3px rgba(0, 0, 0, 0.3)'
      }}>  
        Home is not a place… it's a feeling. Welcome to the happiest one.
      </p>
<div style={{ 
  display: 'flex', 
  gap: '5px', 
  justifyContent: 'center', 
  position: 'relative', 
  zIndex: 10
}}>
  <button
    style={{
      flex: 1,
      padding: '16px 32px',
      backgroundColor: 'white',
      color: '#2e6F40',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '18px',
      fontWeight: '700',
      maxWidth: '250px',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#f0f0f0';
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'white';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
    }}
    onClick={() => navigate('/house-sales')}
  >
    Explore
  </button>
  <button
    style={{
      flex: 1,
      padding: '16px 32px',
      backgroundColor: '#2e6F40',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '18px',
      fontWeight: '700',
      maxWidth: '250px',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#1e5a30';
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = '#2e6F40';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
    }}
    onClick={() => navigate('/register')}
  >
    Register
  </button>
</div>
    </div>
  </div>
          ) : (
            <div className="login-container">
              <div className="login-form">
                <img src={logoImage} className="logo" alt="Logo" />
                <form onSubmit={handleLogin}>
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={handleInputChange(setUsername)}
                  />
                  <div className="input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={handleInputChange(setPassword)}
                      className="password-input"
                    />
                    <span
                      className="toggle-password-icon"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#666',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#4CAF50';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#666';
                      }}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#4CAF50',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontSize: '14px',
                      marginBottom: '10px',
                      padding: 0,
                    }}
                  >
                    Forgot Password?
                  </button>
                  {errorMsg && <div className="error-msg">{errorMsg}</div>}
                  <button type="submit">Login</button>
                  <button
                    type="button"
                    className="register-btn"
                    onClick={() => navigate('/register')}
                  >
                    Register
                  </button>
                  <p className="privacy-text">
                    By signing in, you agree to Happy Homes' Privacy Policy and Terms of Service.
                  </p>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Find Your Dream Home Advertisement */}
      <div className="dream-home-advertisement">
        <div className="dream-home-content">
          <h2 className="dream-home-title">Find Your Dream Home Today?</h2>
          <p className="dream-home-subtitle">Browse our exclusive listings and discover your perfect home in the community</p>
          <button 
            className="dream-home-btn"
            onClick={() => navigate('/register')}
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Learn About the Community Section */}
      <div className="section-container" style={{ marginTop: '60px', marginBottom: '60px', padding: '40px 20px' }}>
        <p style={{ color: '#4CAF50', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>Community</p>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '50px', fontWeight: 'bold', textAlign: 'center' }}>Learn About the Community</h2>
        
        {/* About Us Section - Two Column Layout */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '80px',
          alignItems: 'flex-start',
          marginBottom: '80px',
          maxWidth: '1400px',
          margin: '0 auto 80px',
          padding: '0 40px',
        }}>
          {/* Left Side - About Us Content */}
          <div style={{
            flex: '1',
            padding: '0',
          }}>
            <h3 style={{
              fontSize: '2.2rem',
              fontWeight: 'bold',
              marginBottom: '25px',
              color: '#2e6F40',
            }}>
              About Happy Homes
            </h3>
            <p style={{
              fontSize: '1.15rem',
              lineHeight: '1.9',
              color: '#555',
              marginBottom: '25px',
            }}>
              At Happy Homes, we believe that a house becomes a home when neighbors become friends. Our mission is to create a thriving, connected community where families can build lasting relationships and create beautiful memories together.
            </p>
            <p style={{
              fontSize: '1.15rem',
              lineHeight: '1.9',
              color: '#555',
              marginBottom: '40px',
            }}>
              We strive to provide exceptional community management services, state-of-the-art facilities, and a platform that brings residents together. Our goal is to make Happy Homes more than just a place to live—it's a place where life connects, friendships flourish, and happiness thrives.
            </p>

            {/* Mission and Vision Section - Side by Side */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '30px',
              marginBottom: '30px',
            }}>
              {/* Mission Section */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '30px',
                borderRadius: '12px',
                flex: '1',
              }}>
                <h4 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  marginBottom: '15px',
                  color: '#2e6F40',
                }}>
                  Our Mission
                </h4>
                <p style={{
                  fontSize: '1.05rem',
                  lineHeight: '1.8',
                  color: '#555',
                  margin: 0,
                }}>
                  To create and maintain a vibrant, safe, and inclusive community where every resident feels valued, connected, and at home. We are committed to providing exceptional services, fostering meaningful relationships, and building a sustainable environment where families can thrive for generations to come.
                </p>
              </div>

              {/* Vision Section */}
              <div style={{
                backgroundColor: '#f0f7f2',
                padding: '30px',
                borderRadius: '12px',
                flex: '1',
              }}>
                <h4 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  marginBottom: '15px',
                  color: '#2e6F40',
                }}>
                  Our Vision
                </h4>
                <p style={{
                  fontSize: '1.05rem',
                  lineHeight: '1.8',
                  color: '#555',
                  margin: 0,
                }}>
                  To be the leading community management platform that sets the standard for residential living. We envision Happy Homes as a model community where innovation, sustainability, and human connection come together to create an unparalleled living experience that residents are proud to call home.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - About Us Image Carousel */}
          <div style={{
            flex: '1',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            paddingTop: '200px',
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '600px',
            }}>
              {/* Image Container */}
              <div style={{
                position: 'relative',
                width: '100%',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              }}>
                <img
                  src={aboutUsImages[currentAboutImageIndex % aboutUsImages.length]}
                  alt={`About Happy Homes ${currentAboutImageIndex + 1}`}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    objectFit: 'cover',
                    transition: 'opacity 0.3s ease',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = house123Image;
                  }}
                />
                
                {/* Left Arrow */}
                <button
                  onClick={() => {
                    setCurrentAboutImageIndex((prev) => 
                      prev > 0 ? prev - 1 : aboutUsImages.length - 1
                    );
                  }}
                  style={{
                    position: 'absolute',
                    left: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '45px',
                    height: '45px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '20px',
                    color: '#4CAF50',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.3s ease',
                    zIndex: 10,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#4CAF50';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.color = '#4CAF50';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                  aria-label="Previous image"
                >
                  ←
                </button>

                {/* Right Arrow */}
                <button
                  onClick={() => {
                    setCurrentAboutImageIndex((prev) => 
                      (prev + 1) % aboutUsImages.length
                    );
                  }}
                  style={{
                    position: 'absolute',
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '45px',
                    height: '45px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '20px',
                    color: '#4CAF50',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.3s ease',
                    zIndex: 10,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#4CAF50';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.color = '#4CAF50';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                  aria-label="Next image"
                >
                  →
                </button>

                {/* Image Indicators (Dots) */}
                <div style={{
                  position: 'absolute',
                  bottom: '15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '8px',
                  zIndex: 10,
                }}>
                  {aboutUsImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentAboutImageIndex(index)}
                      style={{
                        width: currentAboutImageIndex === index ? '24px' : '10px',
                        height: '10px',
                        borderRadius: '5px',
                        border: 'none',
                        backgroundColor: currentAboutImageIndex === index ? '#4CAF50' : 'rgba(255, 255, 255, 0.6)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        padding: 0,
                      }}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Community Gallery */}
        <div className="section-container media-gallery-container">
          <div className="section-header">
            <p className="section-label">Community Gallery</p>
            <h2 className="section-title">Pictures & Videos</h2>
          </div>
          {mediaItems.length > 0 ? (
            <>
              {/* Navigation Buttons */}
              <div className="gallery-navigation">
                {(() => {
                  const itemsPerPage = 5;
                  const totalPages = Math.ceil(mediaItems.length / itemsPerPage);
                  return Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`nav-button ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentPage(pageNum);
                      }}
                    >
                      {pageNum}
                    </button>
                  ));
                })()}
              </div>

              {/* Horizontal Scrollable Gallery with Integrated Arrows */}
              <div className="media-gallery-wrapper">
                {/* Left Arrow - Inside Gallery */}
                <button
                  className="gallery-arrow gallery-arrow-left"
                  onClick={() => {
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1);
                    }
                  }}
                  aria-label="Scroll left"
                  disabled={currentPage === 1}
                >
                  ←
                </button>

                {/* Gallery Container */}
                <div
                  ref={mediaGalleryRef}
                  className="media-gallery-horizontal"
                >
                  {(() => {
                    const itemsPerPage = 5;
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const currentPageItems = mediaItems.slice(startIndex, endIndex);
                    
                    return currentPageItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="media-card-horizontal"
                        style={{ animationDelay: `${index * 0.1}s` }}
                        onClick={() => setSelectedMedia(item)}
                      >
                        <div className="media-image-container">
                          {item.type === 'image' ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="media-image"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = house123Image;
                              }}
                            />
                          ) : (
                            <div className="media-video-placeholder">
                              <div className="play-icon">▶</div>
                            </div>
                          )}
                          <div className="media-overlay">
                            <div className="media-type-badge">
                              {item.type === 'image' ? '📷 Photo' : '🎥 Video'}
                            </div>
                          </div>
                        </div>
                        <div className="media-content">
                          <h3 className="media-title">{item.title}</h3>
                          <p className="media-description">{item.description}</p>
                          {item.date && (
                            <span className="media-date">
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {/* Right Arrow - Inside Gallery */}
                <button
                  className="gallery-arrow gallery-arrow-right"
                  onClick={() => {
                    const itemsPerPage = 5;
                    const totalPages = Math.ceil(mediaItems.length / itemsPerPage);
                    if (currentPage < totalPages) {
                      setCurrentPage(currentPage + 1);
                    }
                  }}
                  aria-label="Scroll right"
                  disabled={currentPage >= Math.ceil(mediaItems.length / 5)}
                >
                  →
                </button>
              </div>

              {/* Section Indicator */}
              <div className="section-indicator">
                <span className="scroll-hint">
                  Section <strong>{currentPage}</strong> of <strong>{Math.ceil(mediaItems.length / 5)}</strong>
                </span>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>No media available at the moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Join Happy Homes Community Advertisement */}
      <div className="join-community-advertisement">
        <div className="join-community-content">
          <h2 className="join-community-title">Join Happy Homes Community</h2>
          <p className="join-community-subtitle">Create an account to list your property, book amenities, and connect with neighbors</p>
          <button 
            className="join-community-btn"
            onClick={() => navigate('/register')}
          >
            Sign Up Free
          </button>
        </div>
      </div>

      {/* Our Main Focus Section */}
      <div
        className="section-container"
  style={{
          marginTop: '0',
          minHeight: 'auto',
  }}
>
        <p style={{ color: '#4CAF50', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>Our Services</p>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '40px', fontWeight: 'bold', textAlign: 'center' }}>Our Main Focus</h2>

  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '20px',
            width: '100%',
            maxWidth: '1200px',
    }}
  >
    {/* Buy a Home */}
    <div
      style={{
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        flex: '1 1 250px',
        maxWidth: '300px',
        textAlign: 'left',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}
    >
      <img
        src={service1Image}
        alt="Buy a Home"
        style={{
          width: '100px',
          margin: '0 auto 20px',
          display: 'block',
        }}
      />
      <h3 style={{ marginBottom: '10px' }}>Buy a home</h3>
      <p style={{ fontSize: '0.95rem', color: '#555' }}>
        With a total of 250 exclusive home slots in our community, we currently have 200 happy families who already call this home. Limited spaces are available—find the house that's waiting for you!
      </p>
    </div>

    {/* Rent a Home */}
    <div
      style={{
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        flex: '1 1 250px',
        maxWidth: '300px',
        textAlign: 'left',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}
    >
      <img
        src={service2Image}
        alt="Rent a Home"
        style={{
          width: '100px',
          margin: '0 auto 20px',
          display: 'block',
        }}
      />
      <h3 style={{ marginBottom: '10px' }}>Rent a home</h3>
      <p style={{ fontSize: '0.95rem', color: '#555' }}>
        Experience the thriving life alongside 200 established families already enjoying our 250 exclusive community slots. Limited rental opportunities are currently available.
      </p>
    </div>

    {/* Book Amenities */}
    <div
      style={{
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        flex: '1 1 250px',
        maxWidth: '300px',
        textAlign: 'left',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}
    >
      <img
        src={service3Image}
        alt="Book Amenities"
        style={{
          width: '100px',
          margin: '0 auto 20px',
          display: 'block',
        }}
      />
      <h3 style={{ marginBottom: '10px' }}>Book Amenities</h3>
      <p style={{ fontSize: '0.95rem', color: '#555' }}>
        Your next happy memory starts now. Our exclusive resident portal offers seamless, real-time access to reserve all available amenities. Secure your pool time, clubhouse for parties, or court space instantly.
      </p>
    </div>

    {/* Map Guide */}
    <div
      style={{
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        flex: '1 1 250px',
        maxWidth: '300px',
        textAlign: 'left',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        cursor: 'pointer',
      }}
      onClick={() => navigate('/map')}
    >
      <img
        src={service1Image}
        alt="Map Guide"
        style={{
          width: '100px',
          margin: '0 auto 20px',
          display: 'block',
          filter: 'brightness(0) saturate(100%) invert(40%) sepia(80%) saturate(600%) hue-rotate(90deg) brightness(90%) contrast(90%)',
        }}
      />
      <h3 style={{ marginBottom: '10px' }}>Map Guide</h3>
      <p style={{ fontSize: '0.95rem', color: '#555' }}>
        Navigate through our comprehensive map guide to explore property locations, community facilities, and get detailed directions throughout the subdivision.
      </p>
    </div>

    {/* Visitor Tracking */}
    <div
      style={{
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        flex: '1 1 250px',
        maxWidth: '300px',
        textAlign: 'left',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        cursor: 'pointer',
      }}
      onClick={() => navigate('/resident-dashboard')}
    >
      <img
        src={service2Image}
        alt="Visitor Tracking"
        style={{
          width: '100px',
          margin: '0 auto 20px',
          display: 'block',
          filter: 'brightness(0) saturate(100%) invert(40%) sepia(80%) saturate(600%) hue-rotate(90deg) brightness(90%) contrast(90%)',
        }}
      />
      <h3 style={{ marginBottom: '10px' }}>Visitor Tracking</h3>
      <p style={{ fontSize: '0.95rem', color: '#555' }}>
        Manage and track your visitors efficiently. Register visitor requests, view visitor history, and ensure secure access to the community.
      </p>
    </div>

    {/* Announcements */}
    <div
      style={{
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        flex: '1 1 250px',
        maxWidth: '300px',
        textAlign: 'left',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}
    >
      <img
        src={service3Image}
        alt="Announcements"
        style={{
          width: '100px',
          margin: '0 auto 20px',
          display: 'block',
          filter: 'brightness(0) saturate(100%) invert(40%) sepia(80%) saturate(600%) hue-rotate(90deg) brightness(90%) contrast(90%)',
        }}
      />
      <h3 style={{ marginBottom: '10px' }}>Announcements</h3>
      <p style={{ fontSize: '0.95rem', color: '#555' }}>
        Stay informed with the latest community announcements, important updates, and news from Happy Homes. Get notified about events, policy changes, and community activities to stay connected with your neighborhood.
      </p>
    </div>
  </div>
</div>

      {/* Media Modal for Full View */}
      {selectedMedia && (
        <div
          className="media-modal"
          onClick={() => setSelectedMedia(null)}
        >
          <div className="media-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="media-modal-close"
              onClick={() => setSelectedMedia(null)}
            >
              ×
            </button>
            <div className="media-modal-image">
              {selectedMedia.type === 'image' ? (
                <img
                  src={selectedMedia.imageUrl}
                  alt={selectedMedia.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = house123Image;
                  }}
                />
              ) : (
                <div className="media-video-container">
                  <div className="play-icon-large">▶</div>
                </div>
              )}
            </div>
            <div className="media-modal-info">
              <h2>{selectedMedia.title}</h2>
              <p>{selectedMedia.description}</p>
              {selectedMedia.date && (
                <span className="media-date">
                  {new Date(selectedMedia.date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Blog Story Modal for Full View */}
      {selectedBlog && (
        <div
          className="blog-modal"
          onClick={() => setSelectedBlog(null)}
        >
          <div className="blog-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="blog-modal-close"
              onClick={() => setSelectedBlog(null)}
            >
              ×
            </button>
            {selectedBlog.image && (
              <div className="blog-modal-image">
                <img
                  src={selectedBlog.image}
                  alt={selectedBlog.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="blog-modal-category-badge">{selectedBlog.category}</div>
              </div>
            )}
            <div className="blog-modal-body">
              <div className="blog-modal-header">
                <div className="blog-modal-author-info">
                  <div className="blog-modal-author-avatar">
                    {selectedBlog.author.charAt(0).toUpperCase()}
                  </div>
                  <div className="blog-modal-author-details">
                    <span className="blog-modal-author-name">{selectedBlog.author}</span>
                    <span className="blog-modal-date">
                      {new Date(selectedBlog.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <div className="blog-modal-read-time">{selectedBlog.readTime}</div>
              </div>
              <h1 className="blog-modal-title">{selectedBlog.title}</h1>
              <div className="blog-modal-content-text">
                <p>{selectedBlog.content}</p>
              </div>

              {/* Comments Section */}
              <div className="blog-comments-section">
                <h3 className="comments-section-title">
                  Comments ({comments.length})
                </h3>

                {/* Comment form - only for authenticated users on real posts */}
                {user && selectedBlog && (selectedBlog.isRealPost === true || selectedBlog.isRealPost === undefined) && (
                  <form className="comment-form" onSubmit={handleAddComment}>
                    <div className="comment-input-wrapper">
                      <div className="comment-user-avatar">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <textarea
                        className="comment-input"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                        required
                      />
                    </div>
                    <div className="comment-form-actions">
                      <button
                        type="submit"
                        className="comment-submit-btn"
                        disabled={commentLoading || !newComment.trim()}
                      >
                        {commentLoading ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </form>
                )}
                
                {/* Message for dummy posts */}
                {user && selectedBlog && selectedBlog.isRealPost === false && (
                  <div className="comment-guest-message">
                    <p>
                      Comments are only available for posts from the database. Please create a post in the admin panel to enable comments.
                    </p>
                  </div>
                )}

                {/* Message for guests */}
                {!user && (
                  <div className="comment-guest-message">
                    <p>
                      Please <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>login</a> to leave a comment.
                    </p>
                  </div>
                )}

                {/* Comments List */}
                <div className="comments-list">
                  {fetchingComments ? (
                    <div className="comments-loading">Loading comments...</div>
                  ) : comments.length > 0 ? (
                    comments.map((comment) => {
                      // Check if current user can delete this comment (owner or admin)
                      const canDelete = user && (user.is_staff || (comment.user_id && user.id === comment.user_id));
                      
                      return (
                        <div key={comment.id} className="comment-item">
                          <div className="comment-header">
                            <div className="comment-author-info">
                              <div className={`comment-author-avatar ${comment.is_admin ? 'admin' : ''}`}>
                                {comment.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="comment-author-details">
                                <span className="comment-author-name">
                                  {comment.username}
                                  {comment.is_admin && (
                                    <span className="admin-badge">Admin</span>
                                  )}
                                </span>
                                <span className="comment-date">
                                  {new Date(comment.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                            {/* Delete button for admins and comment owners */}
                            {canDelete && (
                              <button
                                className="comment-delete-btn"
                                onClick={() => handleDeleteComment(comment.id)}
                                title={user.is_staff ? "Delete comment (Admin)" : "Delete your comment"}
                              >
                                ×
                              </button>
                            )}
                          </div>
                          <div className="comment-content">{comment.content}</div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="comments-empty">
                      No comments yet. {user ? 'Be the first to comment!' : 'Login to leave a comment.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {showForgotPassword && <ForgotPassword onClose={() => setShowForgotPassword(false)} />}

      <Footer />
    </>
  );
};

export default LoginPage;





// import React, { useState, ChangeEvent, FormEvent } from 'react';
// import './LoginPage.css';
// import { useNavigate } from 'react-router-dom';
// import { setToken } from '../utils/auth';
// import NavBar from './NavBar';
// import Footer from './Footer';
// import { FaEye, FaEyeSlash } from "react-icons/fa";
// import ReCAPTCHA from 'react-google-recaptcha';

// interface LoginPageProps {}

// const LoginPage: React.FC<LoginPageProps> = () => {
//   const [username, setUsername] = useState<string>('');
//   const [password, setPassword] = useState<string>('');
//   const [errorMsg, setErrorMsg] = useState<string>('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);
//   const navigate = useNavigate();

//   const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setErrorMsg('');

//     if (!recaptchaValue) {
//       setErrorMsg('Please complete the reCAPTCHA.');
//       return;
//     }

//     try {
//       const res = await fetch('http://127.0.0.1:8000/api/token/', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ username, password, recaptcha: recaptchaValue }),
//       });

//       if (!res.ok) throw new Error('Invalid username or password');
//       const data: { access: string } = await res.json();

//       setToken(data.access);
//       navigate('/home');
//     } catch (err) {
//       if (err instanceof Error) {
//         setErrorMsg(err.message);
//       } else {
//         setErrorMsg('An unknown error occurred');
//       }
//     }
//   };

//   const handleInputChange =
//     (setter: React.Dispatch<React.SetStateAction<string>>) =>
//     (e: ChangeEvent<HTMLInputElement>) => {
//       setter(e.target.value);
//       if (errorMsg) setErrorMsg('');
//     };

//   const handleRecaptchaChange = (value: string | null) => {
//     setRecaptchaValue(value);
//   };

//   return (
//     <>
//       <NavBar profile={null} />
//             <div
//         style={{
//           minHeight: "100vh",
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           backgroundImage: `url(${require('../images/bg4.png')})`,
//           backgroundSize: "cover",
//           // background: "linear-gradient(135deg, #000000, #2e6f40)",
//           padding: "20px",
//         }}
//       >

//       <div className="login-page">
//         <div className="login-container">
//           {/* Left image/branding */}
//           <div className="login-image">
//             {/* Happy Homes */}
//           </div>

//           {/* Right login form */}
//           <div className="login-form">
//             <img
//               src={require('../images/logo.png')}
//               className="logo"
//               alt="Logo"
//             />
//             <form onSubmit={handleLogin}>
//               <input
//                 type="text"
//                 placeholder="Username"
//                 value={username}
//                 onChange={handleInputChange(setUsername)}
//               />

//               <div className="input-wrapper">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   placeholder="Password"
//                   value={password}
//                   onChange={handleInputChange(setPassword)}
//                   className="password-input"
//                 />
//                 <span
//                   className="toggle-password-icon"
//                   onClick={() => setShowPassword(!showPassword)}
//                 >
//                   {showPassword ? <FaEyeSlash /> : <FaEye />}
//                 </span>
//               </div>

//               <div className="recaptcha-container">
//                 <ReCAPTCHA
//                   sitekey="6Lc7-awrAAAAAEUEFyyYa_DQWKg9RUF-PEmuYwfD"
//                   onChange={handleRecaptchaChange}
//                 />
//               </div>

//               <p className="privacy-text">
//                 "I have read, understood, and accept Happy Homes' Privacy Policy and consent to the collection and processing of my information by the company and its authorized parties."
//               </p>

//               {errorMsg && <div className="error-msg">{errorMsg}</div>}

//               <button type="submit">Login</button>
//               <button
//                 type="button"
//                 className="register-btn"
//                 onClick={() => navigate('/register')}
//               >
//                 Register
//               </button>
//             </form>
//           </div>
//         </div>
//       </div>
//       </div>

//       <Footer />
//     </>
//   );
// };

// export default LoginPage;




// import React, { useState, ChangeEvent, FormEvent } from 'react';
// import './LoginPage.css';
// import { useNavigate } from 'react-router-dom';
// import { setToken } from '../utils/auth';
// import NavBar from './NavBar';
// import './NavBar.css';
// import { FaEye, FaEyeSlash } from "react-icons/fa";
// import Footer from './Footer';

// // Import the reCAPTCHA component
// import ReCAPTCHA from 'react-google-recaptcha';

// interface LoginPageProps {}

// const LoginPage: React.FC<LoginPageProps> = () => {
//   const [showLoginForm, setShowLoginForm] = useState(false);
//   const [username, setUsername] = useState<string>('');
//   const [password, setPassword] = useState<string>('');
//   const [errorMsg, setErrorMsg] = useState<string>('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null); // State for reCAPTCHA
//   const navigate = useNavigate();

//   const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setErrorMsg('');

//     // Check if reCAPTCHA was solved
//     if (!recaptchaValue) {
//       setErrorMsg('Please complete the reCAPTCHA.');
//       return;
//     }

//     try {
//       const res = await fetch('http://127.0.0.1:8000/api/token/', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ username, password, recaptcha: recaptchaValue }),
//       });

//       if (!res.ok) throw new Error('Invalid username or password');
//       const data: { access: string } = await res.json();

//       setToken(data.access);
//       navigate('/home');
//     } catch (err) {
//       if (err instanceof Error) {
//         setErrorMsg(err.message);
//       } else {
//         setErrorMsg('An unknown error occurred');
//       }
//     }
//   };

//   const handleInputChange =
//     (setter: React.Dispatch<React.SetStateAction<string>>) =>
//     (e: ChangeEvent<HTMLInputElement>) => {
//       setter(e.target.value);
//       if (errorMsg) setErrorMsg('');
//     };

//   // Function to handle reCAPTCHA verification
//   const handleRecaptchaChange = (value: string | null) => {
//     setRecaptchaValue(value);
//   };

//   return (
    
//     <>
//       <NavBar profile={null} />
//     <div style={{
//       minHeight: "100vh",
//       display: "flex",
//       flexDirection: "column",
//       justifyContent: "center",
//     }}>
//       <div className={`login-container ${showLoginForm ? 'show-login' : 'hide-login'}`}>
//         <aside className="login-sidebar">
//           <div className="hamburger" onClick={() => setShowLoginForm(!showLoginForm)}>
//             <div className="bar"></div>
//             <div className="bar"></div>
//             <div className="bar"></div>
//           </div>
// <div
//   style={{
//     display: "grid",
//     gridTemplateColumns: "1fr 1fr ",
//     marginLeft:"-10px",
//     alignItems: "center",
//     marginTop: "20px",
//   }}
// >
//   {/* Left column: logo + text */}
//   <div style={{ textAlign: "center" }}>
//     <img
//       src={require("../images/logo.png")}
//       alt="Happy Homes Logo"
//       style={{
//         width: "250px",
//         height: "auto",
//         marginBottom: "15px",
//         marginLeft:"-750px",
       
//       }}
//     />
//     {/* <h1 style={{ fontSize: "28px", margin: "10px 0" }}>Happy Homes</h1>
//     <p style={{ fontSize: "16px", color: "#ccc" }}>Subdivision Imus, Cavite</p> */}
//   </div>

//   {/* Right column: Map */}
//   <div
//     // className="map-container"
//     // style={{
//     //   backgroundColor: "#2b2b2b",
//     //   borderRadius: "10px",
//     //   padding: "5px",
//     // }}
//   >
//     {/* <iframe
//       src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1699!2d120.9444513!3d14.4077212!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d3acc860116d%3A0xd1c6dd43386abbdd!2sHappy%20Homes%20Subdivision%2C%20Imus%2C%20Cavite!5e0!3m2!1sen!2sph!4v1693140000000!5m2!1sen!2sph"
//       width="600"
//       height="600"
//       style={{ border: 0, borderRadius: "10px" }}
//       allowFullScreen
//       loading="lazy"
//       referrerPolicy="no-referrer-when-downgrade"
//       title="Happy Homes Satellite Map"
//     ></iframe> */}

    
//   </div>
// {/* <div style={{ textAlign: "center", color: "#fff" }}>
//   <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>Contact Us</h2>
//   <p>📞 (02) 123-4567</p>
//   <p>📧 info@happyhomes.com</p>
// </div> */}
// </div>

//         </aside>

//         <main className={`login-main ${showLoginForm ? 'slide-in' : 'slide-out'}`}>
//           <div className="login-box">
//             <img
//               src={require('../images/logo.png')}
//               alt="Logo"
//               className="login-logo-img"
//               style={{
//                 width: 'auto',
//                 height: '90px',
//                 objectFit: 'cover',
//                 margin: '0 auto 16px',
//                 display: 'block',
//                 maxWidth: '100%',
//                 paddingBottom: '10px',
//               }}
//             />
//             {/* <h1 style={{ textAlign: 'center', fontSize: '25px', color: '#2e7d32' }}>Login</h1> */}

//             <form onSubmit={handleLogin}>
//               <input
//                 type="text"
//                 placeholder="Username"
//                 value={username}
//                 onChange={handleInputChange(setUsername)}
//                 required
//                 className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />

//               <div className="input-wrapper">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   placeholder="Password"
//                   value={password}
//                   onChange={handleInputChange(setPassword)}
//                   required
//                   className="input-field password-input"
//                 />
//                 <span
//                   onClick={() => setShowPassword(!showPassword)} // Toggling the password visibility
//                   className="toggle-password-icon"
//                 >
//                   {showPassword ? <FaEyeSlash /> : <FaEye />}
//                 </span>
//               </div>

//               {/* Google reCAPTCHA */}
//               <div className="recaptcha-container">
//                 <ReCAPTCHA
//                   sitekey="6Lc7-awrAAAAAEUEFyyYa_DQWKg9RUF-PEmuYwfD" // Your site key
//                   onChange={handleRecaptchaChange}
//                 />

//               </div>
//               <p style={{ textAlign: 'center', fontSize: '12px', color: '#666', paddingBottom: '15px' }}>
//                 "I have read, understood, and accept Happy Homes' Privacy Policy and consent to the collection and processing of my information by the company and its authorized parties."
//               </p>
//               <button
//                 type="submit"
//                 className="w-full p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
//               >
//                 Login
//               </button>

//               <button
//                 type="button"
//                 className="w-full p-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
//                 onClick={() => navigate('/register')}
//               >
//                 Register
//               </button>

//               {errorMsg && <div className="text-red-600 mt-2 text-sm">{errorMsg}</div>}
//             </form>
//           </div>
//         </main>
//       </div>
//       </div>

//       <Footer />
//     </>

    
//   );
// };

// export default LoginPage;
