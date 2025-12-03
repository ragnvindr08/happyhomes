import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';
import { getToken, logout } from '../utils/auth';
import './HouseSalePage.css';
import houseicon from '../images/houseicon.png';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Profile {
  is_verified?: boolean;
  profile_image?: string;
}

interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email: string;
  is_staff: boolean;
  profile?: Profile;
}

interface House {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  image?: string;
  image_urls?: string[];
  images?: Array<{ id: number; image: string; image_url: string; order: number }>;
  user?: User;
  listing_type?: 'sale' | 'rent';
  property_type?: string;
  beds?: number;
  baths?: number;
  floor_area?: number;
  lot_size?: number;
  year_built?: number;
  floors?: number;
  furnishing?: string;
  parking_spaces?: number;
  has_balcony?: boolean;
  has_garden?: boolean;
  has_pool?: boolean;
  has_elevator?: boolean;
  has_security?: boolean;
  has_air_conditioning?: boolean;
  has_heating?: boolean;
  has_wifi?: boolean;
  has_cable_tv?: boolean;
  has_dishwasher?: boolean;
  has_washing_machine?: boolean;
  has_dryer?: boolean;
  has_microwave?: boolean;
  has_refrigerator?: boolean;
  has_gym?: boolean;
  has_playground?: boolean;
  has_clubhouse?: boolean;
  has_laundry_room?: boolean;
  has_storage?: boolean;
  has_fireplace?: boolean;
  has_garage?: boolean;
  has_cctv?: boolean;
  has_intercom?: boolean;
  has_generator?: boolean;
  has_water_heater?: boolean;
  has_solar_panels?: boolean;
  association_dues?: string;
  utilities_included?: boolean;
  deposit_amount?: number;
  advance_payment?: number;
  lease_term?: string;
  pet_friendly?: boolean;
  down_payment?: number;
  payment_terms?: string;
  amenities?: string;
  nearby_facilities?: string;
  days_on_market?: string;
  contact_phone?: string;
  contact_email?: string;
  property_status?: string;
  created_at?: string;
}

const API_BASE = 'http://127.0.0.1:8000/api';

const HouseSalePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = getToken();

  // User state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Houses state
  const [houses, setHouses] = useState<House[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'rent'>('all');

  // Form state
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [editingHouseId, setEditingHouseId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form fields
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    location: '',
    description: '',
    listingType: 'sale' as 'sale' | 'rent',
    propertyType: '',
    beds: '',
    baths: '',
    floorArea: '',
    lotSize: '',
    yearBuilt: '',
    floors: '1',
    furnishing: '',
    parkingSpaces: '0',
    associationDues: '',
    depositAmount: '',
    advancePayment: '',
    leaseTerm: '',
    downPayment: '',
    paymentTerms: '',
    amenities: '',
    nearbyFacilities: '',
    daysOnMarket: '',
    contactPhone: '',
    contactEmail: '',
  });

  // Features checkboxes
  const [features, setFeatures] = useState({
    hasBalcony: false,
    hasGarden: false,
    hasPool: false,
    hasElevator: false,
    hasSecurity: false,
    hasAirConditioning: false,
    hasHeating: false,
    hasWifi: false,
    hasCableTv: false,
    hasDishwasher: false,
    hasWashingMachine: false,
    hasDryer: false,
    hasMicrowave: false,
    hasRefrigerator: false,
    hasGym: false,
    hasPlayground: false,
    hasClubhouse: false,
    hasLaundryRoom: false,
    hasStorage: false,
    hasFireplace: false,
    hasGarage: false,
    hasCctv: false,
    hasIntercom: false,
    hasGenerator: false,
    hasWaterHeater: false,
    hasSolarPanels: false,
    utilitiesIncluded: false,
    petFriendly: false,
  });

  // Images
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);


  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch profile');
      }
      const data: User = await res.json();
      setUser(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load user profile');
    }
  }, [token, navigate]);

  // Fetch houses - Use guest endpoint to show ALL properties to everyone
  const fetchHouses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Always use guest endpoint to show all properties (marketplace view)
      const url = `${API_BASE}/guest/houses/`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch houses: ${res.status}`);
      }
      
      const data: House[] = await res.json();
      console.log('[fetchHouses] Fetched houses:', data.length);
      // Log first house to check image data
      if (data.length > 0) {
        console.log('[fetchHouses] First house:', {
          id: data[0].id,
          title: data[0].title,
          image_urls: data[0].image_urls,
          images: data[0].images,
          image: data[0].image
        });
      }
      setHouses(data);
    } catch (err) {
      console.error('Error fetching houses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load properties');
      toast.error('Failed to load properties. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get image URLs for a house
  const getHouseImageUrls = useCallback((house: House): string[] => {
    const urls: string[] = [];
    const baseUrl = API_BASE.replace('/api', '');
    
    // Always log for debugging
    console.log(`[getHouseImageUrls] Processing house ${house.id}:`, {
      has_image_urls: !!house.image_urls,
      image_urls_length: house.image_urls?.length || 0,
      image_urls: house.image_urls,
      has_images: !!house.images,
      images_length: house.images?.length || 0,
      images: house.images,
      has_image: !!house.image,
      image: house.image
    });
    
    // Try image_urls array first (most reliable)
    if (house.image_urls && Array.isArray(house.image_urls) && house.image_urls.length > 0) {
      console.log(`[getHouseImageUrls] Processing ${house.image_urls.length} image_urls`);
      house.image_urls.forEach((url, index) => {
        if (url && typeof url === 'string') {
          // If URL is already absolute, use it as-is
          let absoluteUrl = url;
          if (!url.startsWith('http')) {
            // Make sure we have a leading slash
            const path = url.startsWith('/') ? url : '/' + url;
            absoluteUrl = `${baseUrl}${path}`;
          }
          if (!urls.includes(absoluteUrl)) {
            urls.push(absoluteUrl);
            console.log(`[getHouseImageUrls] Added URL ${index + 1} from image_urls: ${absoluteUrl}`);
          }
        } else {
          console.warn(`[getHouseImageUrls] Invalid URL at index ${index}:`, url);
        }
      });
    }
    
    // Try images array (nested objects) - only if we don't have URLs yet
    if (urls.length === 0 && house.images && Array.isArray(house.images) && house.images.length > 0) {
      console.log(`[getHouseImageUrls] Processing ${house.images.length} images from images array`);
      house.images.forEach((img, index) => {
        if (img && typeof img === 'object') {
          const imgUrl = img.image_url || img.image;
          if (imgUrl && typeof imgUrl === 'string') {
            let absoluteUrl = imgUrl;
            if (!imgUrl.startsWith('http')) {
              const path = imgUrl.startsWith('/') ? imgUrl : '/' + imgUrl;
              absoluteUrl = `${baseUrl}${path}`;
            }
            if (!urls.includes(absoluteUrl)) {
              urls.push(absoluteUrl);
              console.log(`[getHouseImageUrls] Added URL ${index + 1} from images array: ${absoluteUrl}`);
            }
          } else {
            console.warn(`[getHouseImageUrls] Invalid image object at index ${index}:`, img);
          }
        }
      });
    }
    
    // Fallback to single image field - only if we don't have URLs yet
    if (urls.length === 0 && house.image && typeof house.image === 'string') {
      console.log(`[getHouseImageUrls] Using fallback image field`);
      let absoluteUrl = house.image;
      if (!house.image.startsWith('http')) {
        const path = house.image.startsWith('/') ? house.image : '/' + house.image;
        absoluteUrl = `${baseUrl}${path}`;
      }
      if (!urls.includes(absoluteUrl)) {
        urls.push(absoluteUrl);
        console.log(`[getHouseImageUrls] Added URL from image field: ${absoluteUrl}`);
      }
    }
    
    console.log(`[getHouseImageUrls] House ${house.id} - Final URLs (${urls.length}):`, urls);
    
    return urls;
  }, []);

  // Filtered houses - Show houses with images, or newly created houses (allow time for images to load)
  const filteredHouses = useMemo(() => {
    return houses.filter(house => {
      // Get image URLs
      const imageUrls = getHouseImageUrls(house);
      
      // Check if house was recently created (within last 2 minutes) - allow it to show even without images
      const isRecentlyCreated = house.created_at && 
        (new Date().getTime() - new Date(house.created_at).getTime()) < 120000; // 2 minutes
      
      // Show house if it has images OR if it was recently created (images might still be processing)
      if (imageUrls.length === 0 && !isRecentlyCreated) {
        return false; // Hide old houses without images
      }
      
      // Filter by type
      if (filterType !== 'all' && house.listing_type !== filterType) {
        return false;
      }
      // Filter by search
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          house.title.toLowerCase().includes(searchLower) ||
          house.location.toLowerCase().includes(searchLower) ||
          (house.description && house.description.toLowerCase().includes(searchLower))
        );
      }
      return true;
    });
  }, [houses, search, filterType, getHouseImageUrls]);

  // Handle image selection
  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;
    if (!fileInput.files || fileInput.files.length === 0) {
      return;
    }
    
    // Only take the first file (single image upload)
    const selectedFile = fileInput.files[0];
    console.log('[Image Upload] Selected file:', selectedFile.name);
    
    // If there's already an image, replace it (clean up old preview URLs)
    if (images.length > 0 || existingImageUrls.length > 0) {
      imagePreviews.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      setImages([]);
      setImagePreviews([]);
      setExistingImageUrls([]);
    }
    
    // Create preview URL for the new file
    try {
      const previewUrl = URL.createObjectURL(selectedFile);
      console.log('[Image Upload] Created preview URL for:', selectedFile.name);
      
      // Update both states with single file
      setImages([selectedFile]);
      setImagePreviews([previewUrl]);
    } catch (error) {
      console.error('[Image Upload] Error creating preview:', error);
      toast.error('Failed to create image preview');
      fileInput.value = '';
      return;
    }
    
    // Reset input
    fileInput.value = '';
  }, [images.length, existingImageUrls.length, imagePreviews]);

  // Remove image
  const removeImage = useCallback((index: number, isExisting: boolean = false) => {
    if (isExisting) {
      setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
    } else {
      setImages(prev => prev.filter((_, i) => i !== index));
      setImagePreviews(prev => {
        const newPreviews = prev.filter((_, i) => i !== index);
        // Revoke old URLs
        prev.forEach((url, i) => {
          if (i === index) URL.revokeObjectURL(url);
        });
        return newPreviews;
      });
    }
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      price: '',
      location: '',
      description: '',
      listingType: 'sale',
      propertyType: '',
      beds: '',
      baths: '',
      floorArea: '',
      lotSize: '',
      yearBuilt: '',
      floors: '1',
      furnishing: '',
      parkingSpaces: '0',
      associationDues: '',
      depositAmount: '',
      advancePayment: '',
      leaseTerm: '',
      downPayment: '',
      paymentTerms: '',
      amenities: '',
      nearbyFacilities: '',
      daysOnMarket: '',
      contactPhone: '',
      contactEmail: '',
    });
    setFeatures({
      hasBalcony: false,
      hasGarden: false,
      hasPool: false,
      hasElevator: false,
      hasSecurity: false,
      hasAirConditioning: false,
      hasHeating: false,
      hasWifi: false,
      hasCableTv: false,
      hasDishwasher: false,
      hasWashingMachine: false,
      hasDryer: false,
      hasMicrowave: false,
      hasRefrigerator: false,
      hasGym: false,
      hasPlayground: false,
      hasClubhouse: false,
      hasLaundryRoom: false,
      hasStorage: false,
      hasFireplace: false,
      hasGarage: false,
      hasCctv: false,
      hasIntercom: false,
      hasGenerator: false,
      hasWaterHeater: false,
      hasSolarPanels: false,
      utilitiesIncluded: false,
      petFriendly: false,
    });
    setImages([]);
    setImagePreviews([]);
    setExistingImageUrls([]);
    setEditingHouseId(null);
    setAcceptedTerms(false);
  }, []);

  // Handle edit
  const handleEdit = useCallback((house: House) => {
    if (!user || house.user?.id !== user.id) {
      toast.error('You can only edit your own listings');
      return;
    }

    setEditingHouseId(house.id);
    setFormData({
      title: house.title || '',
      price: house.price?.toString() || '',
      location: house.location || '',
      description: house.description || '',
      listingType: house.listing_type || 'sale',
      propertyType: house.property_type || '',
      beds: house.beds?.toString() || '',
      baths: house.baths?.toString() || '',
      floorArea: house.floor_area?.toString() || '',
      lotSize: house.lot_size?.toString() || '',
      yearBuilt: house.year_built?.toString() || '',
      floors: house.floors?.toString() || '1',
      furnishing: house.furnishing || '',
      parkingSpaces: house.parking_spaces?.toString() || '0',
      associationDues: house.association_dues || '',
      depositAmount: house.deposit_amount?.toString() || '',
      advancePayment: house.advance_payment?.toString() || '',
      leaseTerm: house.lease_term || '',
      downPayment: house.down_payment?.toString() || '',
      paymentTerms: house.payment_terms || '',
      amenities: house.amenities || '',
      nearbyFacilities: house.nearby_facilities || '',
      daysOnMarket: house.days_on_market || '',
      contactPhone: house.contact_phone || '',
      contactEmail: house.contact_email || '',
    });
    setFeatures({
      hasBalcony: house.has_balcony || false,
      hasGarden: house.has_garden || false,
      hasPool: house.has_pool || false,
      hasElevator: house.has_elevator || false,
      hasSecurity: house.has_security || false,
      hasAirConditioning: house.has_air_conditioning || false,
      hasHeating: house.has_heating || false,
      hasWifi: house.has_wifi || false,
      hasCableTv: house.has_cable_tv || false,
      hasDishwasher: house.has_dishwasher || false,
      hasWashingMachine: house.has_washing_machine || false,
      hasDryer: house.has_dryer || false,
      hasMicrowave: house.has_microwave || false,
      hasRefrigerator: house.has_refrigerator || false,
      hasGym: house.has_gym || false,
      hasPlayground: house.has_playground || false,
      hasClubhouse: house.has_clubhouse || false,
      hasLaundryRoom: house.has_laundry_room || false,
      hasStorage: house.has_storage || false,
      hasFireplace: house.has_fireplace || false,
      hasGarage: house.has_garage || false,
      hasCctv: house.has_cctv || false,
      hasIntercom: house.has_intercom || false,
      hasGenerator: house.has_generator || false,
      hasWaterHeater: house.has_water_heater || false,
      hasSolarPanels: house.has_solar_panels || false,
      utilitiesIncluded: house.utilities_included || false,
      petFriendly: house.pet_friendly || false,
    });
    
    const imageUrls = getHouseImageUrls(house);
    setExistingImageUrls(imageUrls);
    setImages([]);
    setImagePreviews([]);
    setAcceptedTerms(true);
    setIsFormExpanded(true);
    
    setTimeout(() => {
      const formElement = document.querySelector('.house-upload-form-wrapper');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, [user, getHouseImageUrls]);

  // Handle form submit - SIMPLIFIED like billing receipt upload
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[Submit] Button clicked!', {
      user: user?.username,
      isVerified: user?.profile?.is_verified,
      acceptedTerms,
      editingHouseId,
      submitting,
      hasTitle: !!formData.title,
      hasPrice: !!formData.price,
      hasLocation: !!formData.location,
      hasDescription: !!formData.description,
      imagesCount: images.length,
      existingImagesCount: existingImageUrls.length,
    });
    
    // Check verification first
    if (!user?.profile?.is_verified) {
      toast.error('Your account must be verified to list properties. Please upload your documents in your profile.');
      return;
    }
    
    // Check terms acceptance
    if (!editingHouseId && !acceptedTerms) {
      toast.error('Please accept the Terms & Policy to continue');
      return;
    }
    
    // Basic validation
    if (!formData.title || !formData.price || !formData.location || !formData.description) {
      toast.error('Please fill in all required fields (Title, Price, Location, Description)');
      return;
    }
    
    // Image is REQUIRED - must have at least 1 image
    if (images.length === 0 && existingImageUrls.length === 0) {
      toast.error('Image is required. Please upload a property image.');
      return;
    }
    
    if (images.length > 1) {
      toast.error('Only 1 image allowed');
      return;
    }
    
    const currentToken = getToken();
    if (!currentToken) {
      toast.error('You must be logged in');
      navigate('/login');
      return;
    }

    setSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Essential fields
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('location', formData.location.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('listing_type', formData.listingType);
      
      // Clean and validate price
      const cleanPrice = formData.price.toString().replace(/[₱,\s]/g, '').trim();
      if (!cleanPrice || isNaN(parseFloat(cleanPrice))) {
        toast.error('Please enter a valid price');
        setSubmitting(false);
        return;
      }
      formDataToSend.append('price', cleanPrice);
      
      // Property Details
      if (formData.propertyType) formDataToSend.append('property_type', formData.propertyType);
      if (formData.beds) formDataToSend.append('beds', formData.beds);
      if (formData.baths) formDataToSend.append('baths', formData.baths);
      if (formData.floorArea) formDataToSend.append('floor_area', formData.floorArea);
      if (formData.lotSize) formDataToSend.append('lot_size', formData.lotSize);
      if (formData.yearBuilt) formDataToSend.append('year_built', formData.yearBuilt);
      if (formData.floors) formDataToSend.append('floors', formData.floors);
      if (formData.furnishing) formDataToSend.append('furnishing', formData.furnishing);
      if (formData.parkingSpaces) formDataToSend.append('parking_spaces', formData.parkingSpaces);
      if (formData.associationDues) formDataToSend.append('association_dues', formData.associationDues);
      if (formData.amenities) formDataToSend.append('amenities', formData.amenities);
      if (formData.nearbyFacilities) formDataToSend.append('nearby_facilities', formData.nearbyFacilities);
      if (formData.daysOnMarket) formDataToSend.append('days_on_market', formData.daysOnMarket);
      if (formData.contactPhone) formDataToSend.append('contact_phone', formData.contactPhone);
      if (formData.contactEmail) formDataToSend.append('contact_email', formData.contactEmail);
      
      // Property Features (boolean fields)
      formDataToSend.append('has_balcony', features.hasBalcony.toString());
      formDataToSend.append('has_garden', features.hasGarden.toString());
      formDataToSend.append('has_pool', features.hasPool.toString());
      formDataToSend.append('has_elevator', features.hasElevator.toString());
      formDataToSend.append('has_security', features.hasSecurity.toString());
      formDataToSend.append('has_air_conditioning', features.hasAirConditioning.toString());
      formDataToSend.append('has_heating', features.hasHeating.toString());
      formDataToSend.append('has_wifi', features.hasWifi.toString());
      formDataToSend.append('has_cable_tv', features.hasCableTv.toString());
      formDataToSend.append('has_dishwasher', features.hasDishwasher.toString());
      formDataToSend.append('has_washing_machine', features.hasWashingMachine.toString());
      formDataToSend.append('has_dryer', features.hasDryer.toString());
      formDataToSend.append('has_microwave', features.hasMicrowave.toString());
      formDataToSend.append('has_refrigerator', features.hasRefrigerator.toString());
      formDataToSend.append('has_gym', features.hasGym.toString());
      formDataToSend.append('has_playground', features.hasPlayground.toString());
      formDataToSend.append('has_clubhouse', features.hasClubhouse.toString());
      formDataToSend.append('has_laundry_room', features.hasLaundryRoom.toString());
      formDataToSend.append('has_storage', features.hasStorage.toString());
      formDataToSend.append('has_fireplace', features.hasFireplace.toString());
      formDataToSend.append('has_garage', features.hasGarage.toString());
      formDataToSend.append('has_cctv', features.hasCctv.toString());
      formDataToSend.append('has_intercom', features.hasIntercom.toString());
      formDataToSend.append('has_generator', features.hasGenerator.toString());
      formDataToSend.append('has_water_heater', features.hasWaterHeater.toString());
      formDataToSend.append('has_solar_panels', features.hasSolarPanels.toString());
      formDataToSend.append('utilities_included', features.utilitiesIncluded.toString());
      formDataToSend.append('pet_friendly', features.petFriendly.toString());
      
      // Sale/Rent Specific Details
      if (formData.listingType === 'sale') {
        if (formData.downPayment) {
          const cleanDownPayment = formData.downPayment.toString().replace(/[₱,\s]/g, '').trim();
          if (cleanDownPayment && !isNaN(parseFloat(cleanDownPayment))) {
            formDataToSend.append('down_payment', cleanDownPayment);
          }
        }
        if (formData.paymentTerms) formDataToSend.append('payment_terms', formData.paymentTerms);
      } else if (formData.listingType === 'rent') {
        if (formData.depositAmount) {
          const cleanDeposit = formData.depositAmount.toString().replace(/[₱,\s]/g, '').trim();
          if (cleanDeposit && !isNaN(parseFloat(cleanDeposit))) {
            formDataToSend.append('deposit_amount', cleanDeposit);
          }
        }
        if (formData.advancePayment) {
          const cleanAdvance = formData.advancePayment.toString().replace(/[₱,\s]/g, '').trim();
          if (cleanAdvance && !isNaN(parseFloat(cleanAdvance))) {
            formDataToSend.append('advance_payment', cleanAdvance);
          }
        }
        if (formData.leaseTerm) formDataToSend.append('lease_term', formData.leaseTerm);
      }
      
      // Add image - verify it exists (single image upload)
      console.log('[Submission] Images to send:', images.length);
      if (images.length > 0) {
        const image = images[0]; // Only one image now
        if (image instanceof File) {
          formDataToSend.append('images', image); // Backend expects 'images' key even for single image
          console.log(`[Submission] Appended image:`, image.name, 'Size:', image.size, 'Type:', image.type);
          
          // Verify FormData has image
          const formDataEntries = Array.from(formDataToSend.entries());
          const imageEntries = formDataEntries.filter(([key]) => key === 'images');
          console.log('[Submission] FormData image entries:', imageEntries.length);
          console.log('[Submission] FormData keys:', formDataEntries.map(([key]) => key));
        } else {
          console.warn(`[Submission] Image is not a File:`, image);
        }
      } else {
        console.warn('[Submission] No image to send!');
      }
      
      const url = editingHouseId 
        ? `${API_BASE}/houses/${editingHouseId}/`
        : `${API_BASE}/houses/`;
      
      const method = editingHouseId ? 'PUT' : 'POST';
      
      console.log('[Submission] Submitting to:', url, 'Method:', method);
      
      // IMPORTANT: Don't set Content-Type header - browser will set it automatically with boundary for FormData
      const res = await fetch(url, {
        method,
        headers: { 
          Authorization: `Bearer ${currentToken}`
          // DO NOT set Content-Type - let browser set it automatically for FormData
        },
        body: formDataToSend,
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: `Failed to ${editingHouseId ? 'update' : 'upload'} property` }));
        
        if (res.status === 401) {
          toast.error('Session expired. Please login again.');
          logout();
          navigate('/login');
          return;
        }
        
        const errorMessage = errorData.detail || errorData.message || `Failed to ${editingHouseId ? 'update' : 'upload'} property`;
        throw new Error(errorMessage);
      }
      
      const responseData = await res.json();
      console.log('[Submission] Response received:', responseData);
      console.log('[Submission] Response image_urls:', responseData.image_urls);
      console.log('[Submission] Response images:', responseData.images);
      
      const houseId = responseData.id || editingHouseId;
      
      // Check if response already has images
      const hasImagesInResponse = (responseData.image_urls && responseData.image_urls.length > 0) || 
                                  (responseData.images && responseData.images.length > 0);
      
      console.log('[Submission] Response has images:', hasImagesInResponse);
      
      // Immediately add house to state with response data (including images if available)
      setHouses(prev => {
        const filtered = prev.filter(h => h.id !== houseId);
        // Ensure responseData has all required fields and proper image arrays
        const houseData: House = {
          ...responseData,
          image_urls: responseData.image_urls || [],
          images: responseData.images || [],
        };
        return [houseData, ...filtered];
      });
      
      // Success message
      resetForm();
      toast.success(editingHouseId ? 'Property updated successfully!' : 'Property listed successfully!');
      
      // If response doesn't have images, wait for backend to process them
      if (!hasImagesInResponse) {
        console.log('[Submission] No images in response, waiting for backend to process...');
        let houseWithImages: House | null = null;
        let retries = 5;
        let delay = 1000;
        
        for (let i = 0; i < retries; i++) {
          await new Promise(resolve => setTimeout(resolve, delay));
          
          try {
            console.log(`[Submission] Fetch attempt ${i + 1}/${retries} for house ID:`, houseId);
            const detailRes = await fetch(`${API_BASE}/guest/houses/${houseId}/`);
            if (detailRes.ok) {
              houseWithImages = await detailRes.json() as House;
              console.log(`[Submission] Attempt ${i + 1} - Detail image_urls:`, houseWithImages.image_urls?.length || 0);
              console.log(`[Submission] Attempt ${i + 1} - Detail images:`, houseWithImages.images?.length || 0);
              
              // If we found images, update the house in state and break
              if ((houseWithImages.image_urls && houseWithImages.image_urls.length > 0) || 
                  (houseWithImages.images && houseWithImages.images.length > 0)) {
                console.log('[Submission] ✅ Images found! Updating house in state...');
                
                // Update the house in state with images
                setHouses(prev => prev.map(h => 
                  h.id === houseId 
                    ? { ...h, 
                        image_urls: houseWithImages!.image_urls || [], 
                        images: houseWithImages!.images || [],
                        image: houseWithImages!.image || h.image
                      }
                    : h
                ));
                
                console.log('[Submission] House updated with images in state');
                break;
              }
            } else {
              console.warn(`[Submission] Attempt ${i + 1} failed with status:`, detailRes.status);
            }
          } catch (err) {
            console.error(`[Submission] Attempt ${i + 1} error:`, err);
          }
          
          delay += 500;
        }
        
        if (!houseWithImages || ((!houseWithImages.image_urls || houseWithImages.image_urls.length === 0) && 
            (!houseWithImages.images || houseWithImages.images.length === 0))) {
          console.warn('[Submission] ⚠️ No images found after all retries');
        }
      } else {
        console.log('[Submission] ✅ Images already in response, no need to fetch');
      }
      
      // Always refresh houses list to ensure consistency with backend
      await fetchHouses();
      
    } catch (err) {
      console.error('Property upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload property';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [formData, images, editingHouseId, acceptedTerms, user, navigate, resetForm, fetchHouses]);

  // Handle delete
  const handleDelete = useCallback(async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/houses/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        setHouses(prev => prev.filter(h => h.id !== id));
        toast.success('Property deleted successfully');
      } else {
        throw new Error('Failed to delete property');
      }
    } catch (err) {
      console.error('Error deleting property:', err);
      toast.error('Failed to delete property');
    }
  }, [token]);


  // Initialize
  useEffect(() => {
    fetchUserProfile();
    fetchHouses();
  }, [fetchUserProfile, fetchHouses]);

  // Handle edit from query parameter
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && houses.length > 0 && user) {
      const houseToEdit = houses.find(h => h.id === parseInt(editId));
      if (houseToEdit && houseToEdit.user?.id === user.id) {
        handleEdit(houseToEdit);
        window.history.replaceState({}, '', '/house-sales');
      }
    }
  }, [searchParams, houses, user, handleEdit]);

  // Cleanup image previews
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  if (loading && houses.length === 0) {
    return (
      <div className="house-sale-page">
        <NavBar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading properties...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="house-sale-page">
      <NavBar />
      <div className="house-sale-container">
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={fetchHouses}>Retry</button>
          </div>
        )}

        {/* Welcome Banner - Show for everyone */}
        <div className="welcome-banner">
          {user ? (
            <>
              <h2>Welcome back, {user.first_name || user.username}!</h2>
              <p>List your property or browse available homes in the community</p>
            </>
          ) : (
            <>
              <h2>Find Your Dream Home</h2>
              <p>Browse available properties for sale and rent in our community</p>
            </>
          )}
        </div>


        {/* House Upload Form */}
        {user && (
          <div className="house-upload-form-wrapper">
            <div 
              className="form-header-clickable" 
              onClick={() => setIsFormExpanded(!isFormExpanded)}
            >
              <div className="form-header-content">
                <div className="form-header-icon">
                  <img src={houseicon} alt="House Icon" />
                </div>
                <div>
                  <h3>{editingHouseId ? 'Edit Your Property Listing' : 'List Your Property'}</h3>
                  <p>{editingHouseId ? 'Update your property information' : 'Share your property with the community'}</p>
                </div>
              </div>
              <div className="form-toggle-icon">
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  style={{ 
                    transform: isFormExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
            
            {isFormExpanded && (
              <form className="house-upload-form" onSubmit={handleSubmit} noValidate>
                {!user.profile?.is_verified && (
                  <div className="verification-warning">
                    <div>
                      <strong>Account Verification Required</strong>
                      <p>Upload your documents in your profile to enable property listings.</p>
                    </div>
                  </div>
                )}

                {/* Listing Type */}
                <div className="form-group">
                  <label>Listing Type *</label>
                  <select
                    className="form-input"
                    value={formData.listingType}
                    onChange={e => setFormData(prev => ({ ...prev, listingType: e.target.value as 'sale' | 'rent' }))}
                    disabled={!user.profile?.is_verified}
                    required
                  >
                    <option value="sale">For Sale</option>
                    <option value="rent">For Rent</option>
                  </select>
                </div>

                {/* Basic Information */}
                <div className="form-group">
                  <label>Property Title *</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder={formData.listingType === 'sale' ? "Beautiful 3BR House for Sale" : "Cozy 2BR Apartment for Rent"} 
                    value={formData.title} 
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} 
                    required 
                    disabled={!user.profile?.is_verified} 
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>{formData.listingType === 'sale' ? 'Sale Price' : 'Monthly Rent'} *</label>
                    <div className="price-input-wrapper">
                      <span className="currency-symbol">₱</span>
                      <input 
                        type="text" 
                        className="form-input price-input"
                        placeholder="0.00" 
                        value={formData.price} 
                        onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))} 
                        required 
                        disabled={!user.profile?.is_verified} 
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Location *</label>
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="Block 5, Lot 10" 
                      value={formData.location} 
                      onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))} 
                      required 
                      disabled={!user.profile?.is_verified} 
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    className="form-textarea"
                    placeholder={formData.listingType === 'sale' 
                      ? "Spacious 3-bedroom house with modern amenities..." 
                      : "Fully furnished 2-bedroom apartment available for rent..."} 
                    value={formData.description} 
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} 
                    disabled={!user.profile?.is_verified}
                    rows={4}
                  />
                </div>

                {/* Property Details Section - Collapsible */}
                <div className="form-section">
                  <div className="form-section-header" onClick={() => {
                    const section = document.querySelector('.form-section-details');
                    if (section) {
                      section.classList.toggle('expanded');
                    }
                  }}>
                    <h4>Property Details</h4>
                    <span className="section-toggle">▼</span>
                  </div>
                  <div className="form-section-details">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Property Type</label>
                        <select 
                          className="form-input"
                          value={formData.propertyType} 
                          onChange={e => setFormData(prev => ({ ...prev, propertyType: e.target.value }))} 
                          disabled={!user.profile?.is_verified}
                        >
                          <option value="">Select property type</option>
                          <option value="house">House</option>
                          <option value="apartment">Apartment</option>
                          <option value="condo">Condo</option>
                          <option value="townhouse">Townhouse</option>
                          <option value="villa">Villa</option>
                          <option value="duplex">Duplex</option>
                          <option value="studio">Studio</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Bedrooms</label>
                        <input 
                          type="number" 
                          className="form-input"
                          placeholder="2" 
                          value={formData.beds} 
                          onChange={e => setFormData(prev => ({ ...prev, beds: e.target.value }))} 
                          min="0"
                          disabled={!user.profile?.is_verified} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Bathrooms</label>
                        <input 
                          type="number" 
                          className="form-input"
                          placeholder="2" 
                          value={formData.baths} 
                          onChange={e => setFormData(prev => ({ ...prev, baths: e.target.value }))} 
                          min="0"
                          disabled={!user.profile?.is_verified} 
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Floor Area (sqm)</label>
                        <input 
                          type="number" 
                          className="form-input"
                          placeholder="85" 
                          value={formData.floorArea} 
                          onChange={e => setFormData(prev => ({ ...prev, floorArea: e.target.value }))} 
                          min="0"
                          step="0.01"
                          disabled={!user.profile?.is_verified} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Lot Size (sqm)</label>
                        <input 
                          type="number" 
                          className="form-input"
                          placeholder="150" 
                          value={formData.lotSize} 
                          onChange={e => setFormData(prev => ({ ...prev, lotSize: e.target.value }))} 
                          min="0"
                          step="0.01"
                          disabled={!user.profile?.is_verified} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Parking Spaces</label>
                        <input 
                          type="number" 
                          className="form-input"
                          placeholder="1" 
                          value={formData.parkingSpaces} 
                          onChange={e => setFormData(prev => ({ ...prev, parkingSpaces: e.target.value }))} 
                          min="0"
                          disabled={!user.profile?.is_verified} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features Section - Collapsible */}
                <div className="form-section">
                  <div className="form-section-header" onClick={() => {
                    const section = document.querySelector('.form-section-features');
                    if (section) {
                      section.classList.toggle('expanded');
                    }
                  }}>
                    <h4>Property Features</h4>
                    <span className="section-toggle">▼</span>
                  </div>
                  <div className="form-section-features">
                    <div className="form-features-grid">
                      {Object.entries(features).filter(([key]) => !['utilitiesIncluded', 'petFriendly'].includes(key)).map(([key, value]) => (
                        <label key={key} className="feature-checkbox">
                          <input 
                            type="checkbox" 
                            checked={value} 
                            onChange={e => setFeatures(prev => ({ ...prev, [key]: e.target.checked }))} 
                            disabled={!user.profile?.is_verified}
                          />
                          <span>{key.replace('has', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rental/Sale Specific Fields */}
                {formData.listingType === 'rent' && (
                  <div className="form-section">
                    <div className="form-section-header" onClick={() => {
                      const section = document.querySelector('.form-section-rental');
                      if (section) {
                        section.classList.toggle('expanded');
                      }
                    }}>
                      <h4>Rental Details</h4>
                      <span className="section-toggle">▼</span>
                    </div>
                    <div className="form-section-rental">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Security Deposit (₱)</label>
                          <input 
                            type="text" 
                            className="form-input"
                            placeholder="0.00" 
                            value={formData.depositAmount} 
                            onChange={e => setFormData(prev => ({ ...prev, depositAmount: e.target.value }))} 
                            disabled={!user.profile?.is_verified} 
                          />
                        </div>
                        <div className="form-group">
                          <label>Advance Payment (₱)</label>
                          <input 
                            type="text" 
                            className="form-input"
                            placeholder="0.00" 
                            value={formData.advancePayment} 
                            onChange={e => setFormData(prev => ({ ...prev, advancePayment: e.target.value }))} 
                            disabled={!user.profile?.is_verified} 
                          />
                        </div>
                        <div className="form-group">
                          <label>Lease Term</label>
                          <input 
                            type="text" 
                            className="form-input"
                            placeholder="1 year, 6 months" 
                            value={formData.leaseTerm} 
                            onChange={e => setFormData(prev => ({ ...prev, leaseTerm: e.target.value }))} 
                            disabled={!user.profile?.is_verified} 
                          />
                        </div>
                      </div>
                      <label className="feature-checkbox">
                        <input 
                          type="checkbox" 
                          checked={features.petFriendly} 
                          onChange={e => setFeatures(prev => ({ ...prev, petFriendly: e.target.checked }))} 
                          disabled={!user.profile?.is_verified}
                        />
                        <span>Pet Friendly</span>
                      </label>
                    </div>
                  </div>
                )}

                {formData.listingType === 'sale' && (
                  <div className="form-section">
                    <div className="form-section-header" onClick={() => {
                      const section = document.querySelector('.form-section-sale');
                      if (section) {
                        section.classList.toggle('expanded');
                      }
                    }}>
                      <h4>Sale Details</h4>
                      <span className="section-toggle">▼</span>
                    </div>
                    <div className="form-section-sale">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Down Payment (₱)</label>
                          <input 
                            type="text" 
                            className="form-input"
                            placeholder="0.00" 
                            value={formData.downPayment} 
                            onChange={e => setFormData(prev => ({ ...prev, downPayment: e.target.value }))} 
                            disabled={!user.profile?.is_verified} 
                          />
                        </div>
                        <div className="form-group">
                          <label>Payment Terms</label>
                          <input 
                            type="text" 
                            className="form-input"
                            placeholder="e.g., 10 months PDC" 
                            value={formData.paymentTerms} 
                            onChange={e => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))} 
                            disabled={!user.profile?.is_verified} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Images */}
                <div className="form-group">
                  <label>Property Image <span style={{color: 'red'}}>*</span> (Required - 1 image only)</label>
                  <div className="file-upload-wrapper">
                    <label htmlFor="houseImages" className="custom-file-label">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      {images.length > 0 || existingImageUrls.length > 0 ? 'Replace Image' : 'Upload Property Image *'}
                    </label>
                    <input 
                      id="houseImages" 
                      name="houseImages"
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      disabled={!user.profile?.is_verified}
                    />
                  </div>
                  
                  {(existingImageUrls.length > 0 || imagePreviews.length > 0) && (
                    <div className="images-preview-grid">
                      {existingImageUrls.map((url, index) => (
                        <div key={`existing-${index}`} className="image-preview-item">
                          <img src={url} alt={`Existing ${index + 1}`} />
                          <button 
                            type="button" 
                            className="remove-image-btn"
                            onClick={() => removeImage(index, true)}
                            disabled={!user.profile?.is_verified}
                            title="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {imagePreviews.map((preview, index) => (
                        <div key={`new-${index}`} className="image-preview-item">
                          <img src={preview} alt={`Preview ${index + 1}`} />
                          <button 
                            type="button" 
                            className="remove-image-btn"
                            onClick={() => removeImage(index, false)}
                            disabled={!user.profile?.is_verified}
                            title="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {(existingImageUrls.length > 0 || imagePreviews.length > 0) && (
                    <div className="images-count">
                      {existingImageUrls.length + imagePreviews.length} / 1 image
                    </div>
                  )}
                </div>

                {/* Terms */}
                <div className="terms-policy-section">
                  <div className="terms-content">
                    <h4>Terms & Policy</h4>
                    <div className="terms-text">
                      <p><strong>By listing your property, you agree to the following terms:</strong></p>
                      <ul>
                        <li>You are the legal owner or authorized agent of the property listed.</li>
                        <li>All information provided is accurate and truthful.</li>
                        <li>You have the right to sell or rent the property as described.</li>
                        <li>Happy Homes acts as a platform and is not responsible for transactions.</li>
                      </ul>
                    </div>
                  </div>
                  <label className="terms-checkbox-label">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      disabled={!user.profile?.is_verified || editingHouseId !== null}
                      required
                    />
                    <span>
                      I have read and agree to the Terms & Policy <span className="required-asterisk">*</span>
                    </span>
                  </label>
                </div>

                <button 
                  type="submit" 
                  className="submit-btn" 
                  disabled={submitting}
                  style={{
                    position: 'relative',
                    zIndex: 1000,
                    pointerEvents: submitting ? 'none' : 'auto',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    width: '100%',
                  }}
                >
                  {submitting ? 'Processing...' : editingHouseId 
                    ? `Update ${formData.listingType === 'sale' ? 'Sale' : 'Rent'} Listing` 
                    : (formData.listingType === 'sale' ? 'List for Sale' : 'List for Rent')
                  }
                </button>
                {editingHouseId && (
                  <button 
                    type="button" 
                    className="submit-btn cancel-edit-btn" 
                    onClick={resetForm}
                  >
                    Cancel Edit
                  </button>
                )}
              </form>
            )}
          </div>
        )}

        {/* Search and Filter */}
        <div className="search-filter-section">
          <div className="search-bar-wrapper">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search by title, location, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button 
                className="clear-search" 
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <div className="filter-buttons">
            <button
              type="button"
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All Properties
            </button>
            <button
              type="button"
              className={`filter-btn filter-sale ${filterType === 'sale' ? 'active' : ''}`}
              onClick={() => setFilterType('sale')}
            >
              For Sale
            </button>
            <button
              type="button"
              className={`filter-btn filter-rent ${filterType === 'rent' ? 'active' : ''}`}
              onClick={() => setFilterType('rent')}
            >
              For Rent
            </button>
          </div>
          {filteredHouses.length > 0 && (
            <p className="results-count">{filteredHouses.length} {filteredHouses.length === 1 ? 'property' : 'properties'} found</p>
          )}
        </div>

        {/* Houses Grid */}
        <div className="houses-container">
          {filteredHouses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏠</div>
              <h3>No properties found</h3>
              <p>{search || filterType !== 'all' ? 'Try adjusting your search or filters' : 'Be the first to list a property!'}</p>
            </div>
          ) : (
            <div className="houses-grid">
              {filteredHouses.map(house => {
                const imageUrls = getHouseImageUrls(house);
                const firstImage = imageUrls[0];
                
                // Get three major property features
                const majorFeatures = [];
                if (house.beds && house.beds > 0) majorFeatures.push({ icon: '🛏️', label: `${house.beds} Bed${house.beds > 1 ? 's' : ''}` });
                if (house.baths && house.baths > 0) majorFeatures.push({ icon: '🚿', label: `${house.baths} Bath${house.baths > 1 ? 's' : ''}` });
                if (house.floor_area) majorFeatures.push({ icon: '📐', label: `${house.floor_area} m²` });
                // Fallback features if not available
                if (majorFeatures.length === 0) {
                  if (house.property_type) majorFeatures.push({ icon: '🏠', label: house.property_type });
                  if (house.parking_spaces && house.parking_spaces > 0) majorFeatures.push({ icon: '🚗', label: `${house.parking_spaces} Parking` });
                  if (house.floors && house.floors > 1) majorFeatures.push({ icon: '🏢', label: `${house.floors} Floors` });
                }
                
                return (
                  <div
                    key={house.id}
                    className="house-grid-card"
                    onClick={() => navigate(`/house-detail/${house.id}`)}
                  >
                    {/* Listing Type Badge */}
                    {house.listing_type && (
                      <div className={`house-card-listing-badge ${house.listing_type === 'rent' ? 'rent-badge' : ''}`}>
                        {house.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                      </div>
                    )}

                    {/* Image - Required, so always show if house is displayed */}
                    <div className="house-card-image-wrapper">
                      <img 
                        src={firstImage} 
                        alt={house.title || 'Property image'}
                        className="house-card-image"
                        loading="lazy"
                        onError={(e) => {
                          // If image fails to load, hide the card
                          const card = e.currentTarget.closest('.house-grid-card') as HTMLElement;
                          if (card) {
                            card.style.display = 'none';
                          }
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="house-card-content">
                      {/* Title */}
                      <h3 className="house-card-title">{house.title || 'Property Listing'}</h3>
                      
                      {/* Location */}
                      {house.location && (
                        <div className="house-card-location">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          <span>{house.location}</span>
                        </div>
                      )}
                      
                      {/* Price */}
                      <div className="house-card-price">
                        <span className="price-amount">₱{Number(house.price).toLocaleString()}</span>
                        {house.listing_type === 'rent' && <span className="price-period">/month</span>}
                      </div>
                      
                      {/* Brief Description */}
                      {house.description && (
                        <p className="house-card-description">
                          {house.description.length > 100 
                            ? `${house.description.substring(0, 100)}...` 
                            : house.description}
                        </p>
                      )}
                      
                      {/* Three Major Features */}
                      {majorFeatures.length > 0 && (
                        <div className="house-card-features">
                          {majorFeatures.slice(0, 3).map((feature, index) => (
                            <div key={index} className="house-card-feature-item">
                              <span className="feature-icon">{feature.icon}</span>
                              <span className="feature-label">{feature.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Sale Details */}
                      {house.listing_type === 'sale' && (house.down_payment || house.payment_terms) && (
                        <div className="house-card-sale-details">
                          {house.down_payment && (
                            <div className="sale-detail-item">
                              <span className="sale-detail-label">Down Payment:</span>
                              <span className="sale-detail-value">₱{Number(house.down_payment).toLocaleString()}</span>
                            </div>
                          )}
                          {house.payment_terms && (
                            <div className="sale-detail-item">
                              <span className="sale-detail-label">Terms:</span>
                              <span className="sale-detail-value">{house.payment_terms}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Rent Details */}
                      {house.listing_type === 'rent' && (house.deposit_amount || house.lease_term) && (
                        <div className="house-card-sale-details">
                          {house.deposit_amount && (
                            <div className="sale-detail-item">
                              <span className="sale-detail-label">Deposit:</span>
                              <span className="sale-detail-value">₱{Number(house.deposit_amount).toLocaleString()}</span>
                            </div>
                          )}
                          {house.lease_term && (
                            <div className="sale-detail-item">
                              <span className="sale-detail-label">Lease:</span>
                              <span className="sale-detail-value">{house.lease_term}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Feature Highlights Advertisement for Guests */}
        {!user && (
          <div className="feature-advertisement">
            <h3 className="ad-section-title">Why Join Happy Homes?</h3>
            <div className="feature-cards">
              <div className="feature-card">
                <div className="feature-card-icon">🏘️</div>
                <h4>List Your Property</h4>
                <p>Reach thousands of potential buyers and renters in the community</p>
              </div>
              <div className="feature-card">
                <div className="feature-card-icon">📅</div>
                <h4>Book Amenities</h4>
                <p>Reserve function halls, sports facilities, and community spaces</p>
              </div>
              <div className="feature-card">
                <div className="feature-card-icon">👥</div>
                <h4>Connect with Neighbors</h4>
                <p>Join a vibrant community and stay connected with your neighbors</p>
              </div>
              <div className="feature-card">
                <div className="feature-card-icon">💳</div>
                <h4>Easy Payments</h4>
                <p>Manage bills and service fees all in one place</p>
              </div>
            </div>
            <div className="ad-cta-section">
              <button 
                className="ad-primary-btn"
                onClick={() => navigate('/register')}
              >
                Get Started Today
              </button>
              <button 
                className="ad-secondary-btn"
                onClick={() => navigate('/login')}
              >
                Already have an account? Login
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default HouseSalePage;
