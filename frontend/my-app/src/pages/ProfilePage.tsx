import React, { useEffect, useState } from 'react';
import { getToken, logout } from '../utils/auth';
import { useNavigate, Link } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropUtils"; 
import phFlag from '../images/philippines.png';
import defaultProfile from '../images/profile1.png';
import axios from 'axios';
import './ProfilePage.css';
import './AdminDashboard.css';
import documentImg from '../images/document.png';
import Sidebar from './Sidebar';
import logo from '../images/logo.png';

interface Profile {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  user?: {
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  profile?: {
    profile_image?: string;
    contact_number?: string;
    is_verified?: boolean;
    document?: string;
    billing_records?: string[]; // ✅ add this
  };
}
// interface Profile {
//   username: string;
//   email?: string;
//   first_name?: string;
//   last_name?: string;
//   profile?: {
//     profile_image?: string;
//     contact_number?: string;
//     is_verified?: boolean;
//     document?: string;
//   };
// }

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [contactNumber, setContactNumber] = useState('+639');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [billingFile, setBillingFile] = useState<File | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const navigate = useNavigate();
  const token = getToken();
  if (!token) navigate('/login');

  // ------------------ PROFILE ------------------
  const fetchProfile = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/profile/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      if (!data.profile) data.profile = {};

      setProfile(data);
      setIsAdmin(data.is_staff || false);
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
      setEmail(data.email || '');
      setUsername(data.username || '');
      setContactNumber(data.profile.contact_number || '+639');

      if (data.profile.profile_image) {
        localStorage.setItem('profileImage', data.profile.profile_image);
      }
    } catch {
      logout();
      navigate('/login');
    }
  };

  useEffect(() => {
    fetchProfile();
    const interval = setInterval(() => {
      fetchProfile();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // ------------------ PROFILE IMAGE & DOCUMENT ------------------
  const onCropComplete = (_: any, croppedArea: any) => setCroppedAreaPixels(croppedArea);
  const handleCrop = async () => {
    if (!profileImage || !croppedAreaPixels) return;
    try {
      const base64 = await getCroppedImg(URL.createObjectURL(profileImage), croppedAreaPixels);
      setCroppedImage(base64);
      const res = await fetch(base64);
      const blob = await res.blob();
      const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
      setProfileImage(file);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    const formData = new FormData();
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('email', email);
    formData.append('username', username);
    formData.append('contact_number', contactNumber);
    if (profileImage) formData.append('profile_image', profileImage);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/profile/update/', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) return alert('Update failed');
      const data = await res.json();
      if (!data.profile) data.profile = {};
      setProfile(data);
      setContactNumber(data.profile.contact_number || '+639');
      if (data.profile.profile_image) localStorage.setItem('profileImage', data.profile.profile_image);

      setEditMode(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update');
    }
  };

  // ------------------ PASSWORD ------------------
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/change-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ old_password: currentPassword, new_password: newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Failed: ${err.detail || 'Something went wrong'}`);
        return;
      }
      alert('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
    } catch (err) {
      console.error(err);
      alert('Error changing password');
    }
  };

  // ------------------ DOCUMENT ------------------
  const handleUploadDocument = async () => {
    if (!documentFile) return alert("Please select a document first.");
    const formData = new FormData();
    formData.append('document', documentFile);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/profile/upload-document/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) return alert('Failed to upload document');
      alert('Document uploaded successfully!');
      setDocumentFile(null);
      fetchProfile();
    } catch (err) {
      console.error(err);
      alert('Error uploading document');
    }
  };

  if (!profile) return <p>Loading...</p>;

  const storedImage = localStorage.getItem('profileImage');
  const profileImageUrl = croppedImage || (storedImage
    ? storedImage.startsWith('http')
      ? storedImage
      : `http://127.0.0.1:8000${storedImage}`
    : defaultProfile);




const handleUploadBilling = async () => {
  if (!billingFile) return alert("Please select a billing file first.");

  const formData = new FormData();
  formData.append('billing', billingFile);

  try {
    const res = await fetch('http://127.0.0.1:8000/api/profile/upload-billing/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) return alert('Failed to upload billing');
    alert('Billing uploaded successfully!');
    setBillingFile(null);
  } catch (err) {
    console.error(err);
    alert('Error uploading billing');
  }
};



  const fullName = `${profile.first_name || profile.user?.first_name || ''} ${profile.last_name || profile.user?.last_name || ''}`.trim() || profile.username || 'User';
  const userEmail = profile.email || '';

  // Profile content component
  const profileContent = (
    <div className="profile-container">
        <h2>My Profile</h2>
        
        {/* Decorative Banner */}
     

        {/* Content Wrapper */}
        <div className="profile-content-wrapper">
          {/* LEFT COLUMN - PROFILE SECTION */}
          <div className="profile-main-section">
          {/* --- EDIT MODE --- */}
          {editMode ? (
          <div className="profile-form">
            {/* Profile Header in Edit Mode */}
            <div className="profile-header form-group-full">
              <div className="profile-image-wrapper">
                <img src={profileImageUrl} alt="Profile" className="profile-preview" />
              </div>
              <div className="profile-name-section">
                <h3 className="profile-name">Edit Profile</h3>
                <p className="profile-email">{userEmail || '-'}</p>
              </div>
            </div>

            {/* Profile inputs in grid */}
            <div className="form-group">
              <label>First Name</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" className="responsive-input" />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" className="responsive-input" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="responsive-input" />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className="responsive-input" />
            </div>

            <div className="form-group form-group-full">
              <label>Contact Number</label>
              <div className="contact-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={phFlag} alt="PH Flag" className="flag-icon" style={{ width: '24px', height: 'auto' }} />
                <input
                  type="text"
                  value={contactNumber}
                  onChange={e => {
                    let val = e.target.value.replace(/^(\+63)?/, '').replace(/\D/g, '');
                    val = val.slice(0, 10);
                    setContactNumber(val ? '+63' + val : '+63');
                  }}
                  placeholder="+63XXXXXXXXXX"
                  className="responsive-input"
                  style={{ flex: 1 }}
                />
              </div>
            </div>

 <div className="file-upload-wrapper">
  <label htmlFor="profileImage" className="custom-file-label">
    Upload Profile Image
  </label>
  <input
    id="profileImage"
    type="file"
    accept="image/*"
    onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
  />
  {profileImage && <p className="file-name">{profileImage.name}</p>}
</div>

{profileImage && (
  <div className="cropper-container">
    <Cropper
      image={URL.createObjectURL(profileImage)}
      crop={crop}
      zoom={zoom}
      aspect={1}
      onCropChange={setCrop}
      onZoomChange={setZoom}
      onCropComplete={onCropComplete}
    />
    <button onClick={handleCrop}>Crop Image</button>
  </div>
)}

<div className="verification-upload">
  <label>Verification of Property Documents</label>
  <p className="doc-verify"><img src={documentImg} alt="Document" className="doc-icon" />
  To ensure your property’s authenticity, please upload all required house documents clearly and accurately. This includes the property title, tax declaration, deed of sale, lot plan, and other supporting certificates. Files should be original, readable, and unaltered to avoid delays in the verification process.
</p>
  {profile.profile?.is_verified ? (
    <>
      {profile.profile?.document ? (
        <p>
          <strong>Uploaded Document:</strong>{" "}
          <a
            href={
              profile.profile.document.startsWith("http")
                ? profile.profile.document
                : `http://127.0.0.1:8000${profile.profile.document}`
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            View Document
          </a>
        </p>
      ) : (
        <p>No document uploaded.</p>
      )}
      <p style={{ color: "green", fontWeight: "bold" }}>Verified</p>
    </>
  ) : (
    <>
      {/* ✅ If not verified — allow upload */}
      {profile.profile?.document ? (
        <>
          <p>
            <strong>Uploaded Document:</strong>{" "}
            <a
              href={
                profile.profile.document.startsWith("http")
                  ? profile.profile.document
                  : `http://127.0.0.1:8000${profile.profile.document}`
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              View
            </a>
          </p>
          <p style={{ color: "orange" }}>Pending verification...</p>
        </>
      ) : (
        <>
<input
  id="documentFile"
  type="file"
  accept=".pdf,.jpg,.png"
  style={{ display: "none" }}  // hidden
  onChange={(e) => {
    const file = e.target.files?.[0] || null;
    setDocumentFile(file);
    if (file) {
      // Optionally auto-upload here or keep separate button
      console.log("Selected file:", file.name);
    }
  }}
/>

{/* Button that opens file picker */}
<button
  onClick={() => {
    const fileInput = document.getElementById("documentFile") as HTMLInputElement;
    fileInput?.click(); // triggers the OS file explorer
  }}
>
  Upload Documents
</button>

{/* Show selected file name */}
{documentFile && <p className="file-name">{documentFile.name}</p>}

{/* Optional: upload button */}
{documentFile && <button onClick={handleUploadDocument}>Upload Document</button>}
        </>
      )}
    </>
  )}
</div>


<div className="buttons">
  <button onClick={handleUpdate}>Save</button>
  <button onClick={() => setEditMode(false)}>Cancel</button>
</div>
          </div>
        ) : (
          <div className="profile-details">
            {/* Profile Header with Image and Name */}
            <div className="profile-header">
              <div className="profile-image-wrapper">
                <img src={profileImageUrl} alt="Profile" className="profile-preview" />
              </div>
              <div className="profile-name-section">
                <h3 className="profile-name">{fullName}</h3>
                <p className="profile-email">{userEmail || '-'}</p>
                <button 
                  onClick={() => setEditMode(true)}
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: '12px',
                    padding: '12px 28px',
                    background: '#2e6F40',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(46, 111, 64, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#255a35';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(46, 111, 64, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#2e6F40';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 111, 64, 0.3)';
                  }}
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Profile Info Grid */}
            <div className="profile-info-grid">
              <div className="info-item">
                <span className="info-label">First Name</span>
                <div className="info-value">{profile.first_name || profile.user?.first_name || '-'}</div>
              </div>
              <div className="info-item">
                <span className="info-label">Last Name</span>
                <div className="info-value">{profile.last_name || profile.user?.last_name || '-'}</div>
              </div>
              <div className="info-item">
                <span className="info-label">Username</span>
                <div className="info-value">{profile.username || '-'}</div>
              </div>
              <div className="info-item">
                <span className="info-label">Contact Number</span>
                <div className="info-value">{profile.profile?.contact_number || '-'}</div>
              </div>
              <div className="info-item form-group-full">
                <span className="info-label">Verification Status</span>
                <div className="info-value">
                  {profile.profile?.is_verified ? (
                    <span style={{ color: '#10b981', fontWeight: '600' }}>✓ Verified</span>
                  ) : profile.profile?.document ? (
                    <span style={{ color: '#f59e0b', fontWeight: '600' }}>⏳ Pending Verification</span>
                  ) : (
                    <span style={{ color: '#ef4444', fontWeight: '600' }}>✗ Not Verified</span>
                  )}
                </div>
              </div>
              {profile.profile?.document && (
                <div className="info-item form-group-full">
                  <span className="info-label">Uploaded Document</span>
                  <div className="info-value">
                    <a
                      href={profile.profile.document.startsWith('http') ? profile.profile.document : `http://127.0.0.1:8000${profile.profile.document}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}
                    >
                      View Document →
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        </div>

        {/* RIGHT COLUMN - ADDITIONAL FEATURES */}
        <div className="profile-features-section">
          {/* CHANGE PASSWORD CARD */}
          <div className="feature-card">
            <h3>Change Password</h3>
            {!showChangePassword ? (
              <button 
                onClick={() => setShowChangePassword(!showChangePassword)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#2e6F40',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(46, 111, 64, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#255a35';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(46, 111, 64, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#2e6F40';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 111, 64, 0.3)';
                }}
              >
                Change Password
              </button>
            ) : (
              <div className="change-password">
                <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                <div className="buttons">
                  <button onClick={handleChangePassword} style={{flex: 1}}>Change Password</button>
                  <button onClick={() => setShowChangePassword(false)} style={{flex: 1, background: '#6c757d'}}>Cancel</button>
                </div>
              </div>
            )}
          </div>

        </div>
        </div>
      </div>
  );

  // Render with admin sidebar if admin, otherwise with NavBar/Footer
  if (isAdmin) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main">
          {profileContent}
        </main>
      </div>
    );
  }

  return (
    <div>
      <NavBar />
      {profileContent}
      <Footer />
    </div>
  );
};

export default ProfilePage;

// import React, { useEffect, useState } from 'react';
// import { getToken, logout } from '../utils/auth';
// import { useNavigate } from 'react-router-dom';
// import NavBar from './NavBar';
// import Footer from './Footer';
// import Cropper from "react-easy-crop";
// import { getCroppedImg } from "../utils/cropUtils"; 
// import phFlag from '../images/philippines.png';
// import defaultProfile from '../images/profile1.png';
// import './ProfilePage.css';

// interface Profile {
//   username: string;
//   email?: string;
//   first_name?: string;
//   last_name?: string;
//   profile?: {
//     profile_image?: string;
//     contact_number?: string;
//     is_verified?: boolean;
//     document?: string;
//   };
// }

// const ProfilePage: React.FC = () => {
//   const [profile, setProfile] = useState<Profile | null>(null);
//   const [editMode, setEditMode] = useState(false);
//   const [showChangePassword, setShowChangePassword] = useState(false);

//   const [firstName, setFirstName] = useState('');
//   const [lastName, setLastName] = useState('');
//   const [email, setEmail] = useState('');
//   const [username, setUsername] = useState('');
//   const [contactNumber, setContactNumber] = useState('+639');
//   const [profileImage, setProfileImage] = useState<File | null>(null);
//   const [documentFile, setDocumentFile] = useState<File | null>(null);

//   // Password fields
//   const [currentPassword, setCurrentPassword] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');

//   // Cropper states
//   const [crop, setCrop] = useState({ x: 0, y: 0 });
//   const [zoom, setZoom] = useState(1);
//   const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
//   const [croppedImage, setCroppedImage] = useState<string | null>(null);

//   const navigate = useNavigate();
//   const token = getToken();
//   if (!token) navigate('/login');

//   const fetchProfile = async () => {
//     try {
//       const res = await fetch('http://127.0.0.1:8000/api/profile/', {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!res.ok) throw new Error('Unauthorized');
//       const data = await res.json();
//       if (!data.profile) data.profile = {};

//       setProfile(data);
//       setFirstName(data.first_name || '');
//       setLastName(data.last_name || '');
//       setEmail(data.email || '');
//       setUsername(data.username || '');
//       setContactNumber(data.profile.contact_number || '+639');

//       if (data.profile.profile_image) {
//         localStorage.setItem('profileImage', data.profile.profile_image);
//       }
//     } catch {
//       logout();
//       navigate('/login');
//     }
//   };

//   useEffect(() => {
//     fetchProfile();
//     const interval = setInterval(fetchProfile, 15000); // poll every 15s
//     return () => clearInterval(interval);
//   }, []);

//   const onCropComplete = (_: any, croppedArea: any) => setCroppedAreaPixels(croppedArea);

//   const handleCrop = async () => {
//     if (!profileImage || !croppedAreaPixels) return;
//     try {
//       const base64 = await getCroppedImg(URL.createObjectURL(profileImage), croppedAreaPixels);
//       setCroppedImage(base64);

//       const res = await fetch(base64);
//       const blob = await res.blob();
//       const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
//       setProfileImage(file);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleUpdate = async () => {
//     const formData = new FormData();
//     formData.append('first_name', firstName);
//     formData.append('last_name', lastName);
//     formData.append('email', email);
//     formData.append('username', username);
//     formData.append('contact_number', contactNumber);
//     if (profileImage) formData.append('profile_image', profileImage);

//     try {
//       const res = await fetch('http://127.0.0.1:8000/api/profile/update/', {
//         method: 'PUT',
//         headers: { Authorization: `Bearer ${token}` },
//         body: formData,
//       });

//       if (!res.ok) return alert('Update failed');

//       const data = await res.json();
//       if (!data.profile) data.profile = {};
//       setProfile(data);
//       setContactNumber(data.profile.contact_number || '+639');
//       if (data.profile.profile_image) localStorage.setItem('profileImage', data.profile.profile_image);

//       setEditMode(false);
//       alert('Profile updated successfully!');
//     } catch (err) {
//       console.error(err);
//       alert('Failed to update');
//     }
//   };

//   const handleChangePassword = async () => {
//     if (newPassword !== confirmPassword) {
//       alert("New passwords do not match!");
//       return;
//     }

//     try {
//       const res = await fetch('http://127.0.0.1:8000/api/change-password/', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`
//         },
//         body: JSON.stringify({
//           old_password: currentPassword,
//           new_password: newPassword,
//         }),
//       });

//       if (!res.ok) {
//         const err = await res.json();
//         alert(`Failed: ${err.detail || 'Something went wrong'}`);
//         return;
//       }

//       alert('Password changed successfully!');
//       setCurrentPassword('');
//       setNewPassword('');
//       setConfirmPassword('');
//       setShowChangePassword(false);
//     } catch (err) {
//       console.error(err);
//       alert('Error changing password');
//     }
//   };

//   const handleUploadDocument = async () => {
//     if (!documentFile) return alert("Please select a document first.");

//     const formData = new FormData();
//     formData.append('document', documentFile);

//     try {
//       const res = await fetch('http://127.0.0.1:8000/api/profile/upload-document/', {
//         method: 'POST',
//         headers: { Authorization: `Bearer ${token}` },
//         body: formData,
//       });

//       if (!res.ok) return alert('Failed to upload document');
//       alert('Document uploaded successfully!');
//       setDocumentFile(null);
//       fetchProfile(); // refresh profile to reflect document
//     } catch (err) {
//       console.error(err);
//       alert('Error uploading document');
//     }
//   };

//   if (!profile) return <p>Loading...</p>;

//   const storedImage = localStorage.getItem('profileImage');
//   const profileImageUrl = croppedImage || (storedImage
//     ? storedImage.startsWith('http')
//       ? storedImage
//       : `http://127.0.0.1:8000${storedImage}`
//     : defaultProfile);

//   return (
//     <div>
//       <NavBar />
//       <div className="profile-container">
//         <h2>My Profile</h2>

//         {editMode ? (
//           <div className="profile-form">
//             <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" className="responsive-input" />
//             <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" className="responsive-input" />
//             <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="responsive-input" />
//             <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className="responsive-input" />

//             <div className="contact-input-wrapper">
//               <img src={phFlag} alt="PH Flag" className="flag-icon" />
//               <input
//                 type="text"
//                 value={contactNumber}
//                 onChange={e => {
//                   let val = e.target.value.replace(/^(\+639)?/, '').replace(/\D/g, '');
//                   val = val.slice(0, 9);
//                   setContactNumber(val ? '+639' + val : '+639');
//                 }}
//                 placeholder="+639XXXXXXXXX"
//                 className="responsive-input"
//               />
//             </div>

//             <input type="file" accept="image/*" onChange={e => setProfileImage(e.target.files?.[0] || null)} />

//             {profileImage && (
//               <div className="cropper-container">
//                 <Cropper
//                   image={URL.createObjectURL(profileImage)}
//                   crop={crop}
//                   zoom={zoom}
//                   aspect={1}
//                   onCropChange={setCrop}
//                   onZoomChange={setZoom}
//                   onCropComplete={onCropComplete}
//                 />
//                 <button onClick={handleCrop}>Crop Image</button>
//               </div>
//             )}

//             <div className="verification-upload">
//               <label>Upload Verification Document:</label>
//               <input type="file" accept=".pdf,.jpg,.png" onChange={e => setDocumentFile(e.target.files?.[0] || null)} />
//               <button onClick={handleUploadDocument}>Upload Document</button>
//             </div>

//             <div className="buttons">
//               <button onClick={handleUpdate}>Save</button>
//               <button onClick={() => setEditMode(false)}>Cancel</button>
//             </div>
//           </div>
//         ) : (
//           <div className="profile-details">
//             <img src={profileImageUrl} alt="Profile" className="profile-preview" />
//             <p><strong>First Name:</strong> {profile.first_name || '-'}</p>
//             <p><strong>Last Name:</strong> {profile.last_name || '-'}</p>
//             <p><strong>Email:</strong> {profile.email || '-'}</p>
//             <p><strong>Username:</strong> {profile.username || '-'}</p>
//             <p><strong>Contact Number:</strong> {profile.profile?.contact_number || '-'}</p>

//             {profile.profile?.document && (
//               <p>
//                 <strong>Uploaded Document:</strong>{" "}
//                 <a
//                   href={profile.profile.document.startsWith('http') ? profile.profile.document : `http://127.0.0.1:8000${profile.profile.document}`}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                 >
//                   View
//                 </a>
//               </p>
//             )}

//             <p>
//               <strong>Verified User:</strong>{" "}
//               {profile.profile?.is_verified ? (
//                 <span style={{ color: 'green' }}>Verified</span>
//               ) : profile.profile?.document ? (
//                 <span style={{ color: 'orange' }}>Pending Verification...</span>
//               ) : (
//                 <span style={{ color: 'red' }}>Not Verified</span>
//               )}
//             </p>


//             <div className="buttons">
//               <button onClick={() => setEditMode(true)}>Edit Profile</button>
//               <button onClick={() => setShowChangePassword(!showChangePassword)}>Change Password</button>
//             </div>
//           </div>
//         )}

//         {showChangePassword && (
//           <div style={{marginTop: '10px'}} className="change-password">
//             <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
//             <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
//             <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
//             <button onClick={handleChangePassword}>Change Password</button>
//           </div>
//         )}
//       </div>
//       <Footer />
//     </div>
//   );
// };

// export default ProfilePage;
