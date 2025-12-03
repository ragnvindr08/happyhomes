import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useNavigate } from "react-router-dom";
import logo from '../images/logo.png';
import "./Calendar.css";
import "./AdminBooking.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import NavBar from "./NavBar";
import Footer from "./Footer";
import { getToken } from "../utils/auth";
import API_URL from "../utils/config";

const localizer = momentLocalizer(moment);

interface Facility {
  id: number;
  name: string;
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

interface Maintenance {
  id?: number;
  facility_id: number;
  facility_name?: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
}

const BookingAmenities: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<number | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]); // For admin table
  const [maintenancePeriods, setMaintenancePeriods] = useState<Maintenance[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [showMaintenanceManager, setShowMaintenanceManager] = useState(false);
  const [maintenanceStartDate, setMaintenanceStartDate] = useState<Date>(new Date());
  const [maintenanceEndDate, setMaintenanceEndDate] = useState<Date>(new Date());
  const [maintenanceStartTime, setMaintenanceStartTime] = useState("");
  const [maintenanceEndTime, setMaintenanceEndTime] = useState("");
  const [maintenanceReason, setMaintenanceReason] = useState("");
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAdminTable, setShowAdminTable] = useState(false); // Toggle between calendar and admin table
  const [showAdminBookingForm, setShowAdminBookingForm] = useState(false); // Toggle admin booking form

  // Get token from localStorage and check admin status
  useEffect(() => {
    const savedToken = getToken();
    if (savedToken) {
      setToken(savedToken);
      // Check if user is admin
      axios.get(`${API_URL}/profile/`, {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
      .then(res => {
        setIsAdmin(res.data.is_staff || false);
        if (res.data.is_staff) {
          setShowAdminTable(true); // Default to admin table for admins
        }
      })
      .catch((err: any) => {
        // Don't show error if it's just a network error (backend not running)
        if (err.code !== 'ERR_NETWORK' && err.message !== 'Network Error' && !err.message?.includes('Failed to fetch')) {
          console.error("Error checking admin status:", err);
        }
        setIsAdmin(false);
      });
    }
  }, []);

  // Axios instance with fresh token on each request
  const axiosInstance = useMemo(() => {
    const instance = axios.create({
      baseURL: `${API_URL}/`,
      timeout: 10000,
    });
    
    // Add request interceptor to always use fresh token
    instance.interceptors.request.use(
      (config) => {
        const freshToken = getToken();
        if (freshToken) {
          config.headers.Authorization = `Bearer ${freshToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor to handle 401 errors
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          // Optionally redirect to login
        }
        return Promise.reject(error);
      }
    );
    
    return instance;
  }, []);

  // Fetch facilities
  const fetchFacilities = useCallback(async () => {
    try {
      const res = await axiosInstance.get("facilities/");
      setFacilities(res.data);
    } catch (err: any) {
      console.error("Fetch facilities error:", err);
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error' || err.message?.includes('Failed to fetch')) {
        toast.error("Cannot connect to server. Please make sure the backend server is running.");
      } else if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error("Error fetching facilities. Please try again.");
      }
    }
  }, [axiosInstance]);

  // Fetch bookings for selected facility (calendar view)
  const fetchBookings = useCallback(
    async (facilityId: number) => {
      if (!token) return;
      try {
        const res = await axiosInstance.get(`bookings/?facility_id=${facilityId}`);
        setBookings(res.data);
      } catch (err: any) {
        console.error("Fetch bookings error:", err);
        if (err.code === 'ERR_NETWORK' || err.message === 'Network Error' || err.message?.includes('Failed to fetch')) {
          // Don't show error toast for network errors on initial load
          console.warn("Backend server may not be running");
        } else if (err.response?.status === 401) {
          toast.error("Session expired. Please login again.");
        } else {
          toast.error("Error fetching bookings. Please try again.");
        }
      }
    },
    [axiosInstance, token]
  );

  // Fetch all bookings (admin table view)
  const fetchAllBookings = useCallback(async () => {
    if (!token || !isAdmin) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get("bookings/");
      setAllBookings(res.data);
    } catch (err: any) {
      console.error("Fetch all bookings error:", err);
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error' || err.message?.includes('Failed to fetch')) {
        toast.error("Cannot connect to server. Please make sure the backend server is running.");
      } else if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error("Failed to load bookings. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }, [axiosInstance, token, isAdmin]);

  // Fetch maintenance periods
  const fetchMaintenance = useCallback(
    async (facilityId?: number) => {
      if (!token) return;
      try {
        const url = facilityId ? `maintenance/?facility_id=${facilityId}` : `maintenance/`;
        const res = await axiosInstance.get(url);
        setMaintenancePeriods(res.data || []);
      } catch (err: any) {
        // Silently fail for maintenance - it's not critical
        if (err.code !== 'ERR_NETWORK' && err.message !== 'Network Error' && !err.message?.includes('Failed to fetch')) {
          console.warn("Error fetching maintenance periods:", err);
        }
        setMaintenancePeriods([]);
      }
    },
    [axiosInstance, token]
  );

  useEffect(() => {
    if (token) {
      fetchFacilities();
      if (isAdmin) {
        fetchAllBookings();
      }
    }
  }, [token, fetchFacilities, isAdmin, fetchAllBookings]);

  useEffect(() => {
    if (selectedFacility) {
      fetchBookings(selectedFacility);
      fetchMaintenance(selectedFacility);
    }
    if (isAdmin) {
      fetchMaintenance(); // Fetch all maintenance for admin
    }
  }, [selectedFacility, fetchBookings, fetchMaintenance, isAdmin]);

  // Edit maintenance period (admin only)
  const handleEditMaintenance = (maint: Maintenance) => {
    setEditingMaintenance(maint);
    setMaintenanceStartDate(new Date(maint.start_date));
    setMaintenanceEndDate(new Date(maint.end_date));
    setMaintenanceStartTime(maint.start_time || "");
    setMaintenanceEndTime(maint.end_time || "");
    setMaintenanceReason(maint.reason || "");
    if (maint.facility_id) {
      setSelectedFacility(maint.facility_id);
    }
    setShowMaintenanceManager(true);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMaintenance(null);
    setMaintenanceStartDate(new Date());
    setMaintenanceEndDate(new Date());
    setMaintenanceStartTime("");
    setMaintenanceEndTime("");
    setMaintenanceReason("");
  };

  // Add or update maintenance period (admin only)
  const handleAddMaintenance = async () => {
    if (!token) {
      toast.error("You must be logged in to add maintenance.");
      return;
    }
    
    if (!isAdmin) {
      toast.error("Only administrators can add maintenance periods.");
      return;
    }
    
    if (!selectedFacility) {
      toast.error("Please select a facility first.");
      return;
    }
    
    // Validate dates
    if (maintenanceEndDate < maintenanceStartDate) {
      toast.error("End date must be after or equal to start date.");
      return;
    }
    
    // Validate times if provided
    if (maintenanceStartTime && maintenanceEndTime) {
      if (maintenanceStartDate.getTime() === maintenanceEndDate.getTime()) {
        // Same day, check times
        if (maintenanceEndTime <= maintenanceStartTime) {
          toast.error("End time must be after start time on the same day.");
          return;
        }
      }
    }
    
    const startDateStr = `${maintenanceStartDate.getFullYear()}-${(maintenanceStartDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${maintenanceStartDate.getDate().toString().padStart(2, "0")}`;
    const endDateStr = `${maintenanceEndDate.getFullYear()}-${(maintenanceEndDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${maintenanceEndDate.getDate().toString().padStart(2, "0")}`;

    try {
      const payload: any = {
        facility_id: selectedFacility,
        start_date: startDateStr,
        end_date: endDateStr,
        reason: maintenanceReason || "",
      };
      
      // Only include time fields if both are provided
      if (maintenanceStartTime && maintenanceEndTime) {
        payload.start_time = maintenanceStartTime;
        payload.end_time = maintenanceEndTime;
      }
      
      if (editingMaintenance && editingMaintenance.id) {
        // Update existing maintenance
        await axiosInstance.put(`maintenance/${editingMaintenance.id}/`, payload);
        toast.success("Maintenance period updated successfully!");
      } else {
        // Create new maintenance
        await axiosInstance.post("maintenance/", payload);
        toast.success("Maintenance period added successfully!");
      }
      
      if (selectedFacility) {
        fetchMaintenance(selectedFacility);
      }
      fetchMaintenance(); // Refresh all maintenance
      handleCancelEdit();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || err.message || "Unknown error";
      toast.error(`Failed to ${editingMaintenance ? 'update' : 'add'} maintenance: ${errorMsg}`);
    }
  };

  // Delete maintenance period (admin only)
  const handleDeleteMaintenance = async (maintenanceId: number) => {
    if (!token || !isAdmin) return;
    if (!window.confirm("Are you sure you want to delete this maintenance period?")) return;
    
    try {
      await axiosInstance.delete(`maintenance/${maintenanceId}/`);
      toast.success("Maintenance period deleted!");
      if (selectedFacility) fetchMaintenance(selectedFacility);
      fetchMaintenance(); // Refresh all maintenance
    } catch (err) {
      toast.error("Failed to delete maintenance period.");
    }
  };

  // Format 24-hour time to AM/PM
  const formatAMPM = (time?: string) => {
    if (!time) return "";
    const [hourStr, minuteStr] = time.split(":");
    let hour = Number(hourStr ?? 0);
    const minute = Number(minuteStr ?? 0);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute.toString().padStart(2, "0")} ${ampm}`;
  };

  // Check if date/time is in the past
  const isPastDateTime = () => {
    const now = new Date();
    const bookingDateTime = new Date(date);
    const timeParts = startTime.split(':');
    const hours = Number(timeParts[0]) || 0;
    const minutes = Number(timeParts[1]) || 0;
    bookingDateTime.setHours(hours, minutes, 0, 0);
    return bookingDateTime < now;
  };

  // Check if date/time is under maintenance
  const isUnderMaintenance = () => {
    if (!selectedFacility) return false;
    
    const bookingDate = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    
    return maintenancePeriods.some((maintenance) => {
      if (maintenance.facility_id !== selectedFacility) return false;
      
      const startDate = new Date(maintenance.start_date);
      const endDate = new Date(maintenance.end_date);
      const bookingDateObj = new Date(bookingDate);
      
      // Check if booking date is within maintenance period
      if (bookingDateObj < startDate || bookingDateObj > endDate) return false;
      
      // If maintenance has specific times, check them
      if (maintenance.start_time && maintenance.end_time) {
        const bookingStartMin = timeToMinutes(startTime);
        const bookingEndMin = timeToMinutes(endTime);
        const maintStartMin = timeToMinutes(maintenance.start_time);
        const maintEndMin = timeToMinutes(maintenance.end_time);
        
        // Check if booking time overlaps with maintenance time
        // Booking overlaps if it starts before maintenance ends AND ends after maintenance starts
        return bookingStartMin < maintEndMin && bookingEndMin > maintStartMin;
      }
      
      // If no specific times, entire day is blocked
      return true;
    });
  };

  // Check for duplicate booking
  const isDuplicateBooking = () =>
    bookings.some(
      (b) =>
        b.date === date.toISOString().split("T")[0] &&
        ((b.start_time <= startTime && startTime < b.end_time) ||
          (b.start_time < endTime && endTime <= b.end_time) ||
          (startTime <= b.start_time && b.end_time <= endTime))
    );

  // Book a facility
  const handleBook = async () => {
    const currentToken = getToken();
    if (!currentToken) {
      toast.error("You are not logged in! Please login again.");
      return;
    }
    
    if (!selectedFacility) {
      toast.error("Select a facility first!");
      return;
    }

    if (isPastDateTime()) {
      toast.error("Cannot book dates or times in the past. Please select a current or future date/time.");
      return;
    }
    
    if (isUnderMaintenance()) {
      const maintenance = maintenancePeriods.find(m => {
        if (m.facility_id !== selectedFacility) return false;
        const bookingDate = `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
        const startDate = new Date(m.start_date);
        const endDate = new Date(m.end_date);
        const bookingDateObj = new Date(bookingDate);
        return bookingDateObj >= startDate && bookingDateObj <= endDate;
      });
      const reason = maintenance?.reason || "Facility is under maintenance";
      toast.error(`Facility is under maintenance. ${reason}`);
      return;
    }
    
    if (isDuplicateBooking()) {
      toast.error("This time slot is already booked!");
      return;
    }

    const bookingDateStr = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

    const bookingData = {
      facility_id: selectedFacility,
      date: bookingDateStr,
      start_time: startTime,
      end_time: endTime,
    };

    console.log("📤 Sending booking request:", bookingData);
    console.log("📤 Selected facility:", selectedFacility);
    console.log("📤 Date:", bookingDateStr);
    console.log("📤 Start time:", startTime);
    console.log("📤 End time:", endTime);

    try {
      const response = await axiosInstance.post("bookings/", bookingData);
      console.log("✅ Booking response:", response.data);
      
      if (isAdmin) {
        toast.success("Booking created successfully!");
      } else {
        toast.success("Booking request submitted successfully! Waiting for admin approval.");
      }
      
      // Refresh bookings
      await fetchBookings(selectedFacility);
      if (isAdmin) {
        await fetchAllBookings();
        // Reset form after successful booking
        setShowAdminBookingForm(false);
        setSelectedFacility(null);
        setDate(new Date());
        setStartTime("10:00");
        setEndTime("11:00");
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      console.error("Full error:", JSON.stringify(err.response?.data, null, 2));
      
      let errorMsg = "Unknown error";
      
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error' || err.message?.includes('Failed to fetch')) {
        errorMsg = "Cannot connect to server. Please make sure the backend server is running at http://localhost:8000";
      } else if (err.response) {
        // Server responded with error
        const responseData = err.response.data;
        
        // Try to get the error message from various possible locations
        errorMsg = responseData?.detail || 
                   (typeof responseData === 'string' ? responseData : null) ||
                   responseData?.error || 
                   responseData?.message ||
                   `Server error: ${err.response.status} ${err.response.statusText}`;
        
        // Handle specific status codes
        if (err.response.status === 401) {
          errorMsg = "Session expired. Please login again.";
          localStorage.removeItem('access');
        } else if (err.response.status === 403) {
          errorMsg = responseData?.detail || "You don't have permission to perform this action.";
        } else if (err.response.status === 400) {
          errorMsg = responseData?.detail || "Invalid booking data. Please check your inputs.";
        } else if (err.response.status === 500) {
          errorMsg = responseData?.detail || "Server error. Please try again or contact support.";
        }
      } else if (err.request) {
        // Request made but no response
        errorMsg = "Network error. Please check your connection and ensure the backend server is running.";
      } else {
        errorMsg = err.message || "Unknown error occurred.";
      }
      
      console.error("Final error message:", errorMsg);
      // Show error with longer display time and allow full message
      toast.error(`Booking failed: ${errorMsg}`, {
        autoClose: 8000, // Show for 8 seconds to read longer messages
        style: {
          whiteSpace: 'pre-wrap', // Allow text wrapping
          wordBreak: 'break-word', // Break long words
          maxWidth: '600px', // Wider toast for longer messages
          minWidth: '400px', // Ensure minimum width
        },
      });
    }
  };

  // Delete booking
  const handleDelete = async (id: number) => {
    const currentToken = getToken();
    if (!currentToken) {
      toast.error("You are not logged in! Please login again.");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    
    try {
      const response = await axiosInstance.delete(`bookings/${id}/`);
      console.log("Delete booking response:", response.data);
      
      // Update local state immediately
      setBookings((prev) => prev.filter((b) => b.id !== id));
      
      // Also update admin table if admin
      if (isAdmin) {
        setAllBookings((prev) => prev.filter((b) => b.id !== id));
        await fetchAllBookings();
      }
      
      toast.success("Booking deleted successfully.");
      
      // Refresh bookings if viewing a specific facility
      if (selectedFacility) {
        await fetchBookings(selectedFacility);
      }
    } catch (err: any) {
      console.error("Delete booking error:", err);
      let errorMsg = "Failed to delete booking.";
      
      if (err.response) {
        errorMsg = err.response.data?.detail || 
                   err.response.data?.error || 
                   `Server error: ${err.response.status}`;
        
        if (err.response.status === 401) {
          errorMsg = "Session expired. Please login again.";
          localStorage.removeItem('access');
        } else if (err.response.status === 403) {
          errorMsg = "You don't have permission to delete this booking.";
        } else if (err.response.status === 404) {
          errorMsg = "Booking not found.";
        } else if (err.response.status === 500) {
          errorMsg = err.response.data?.detail || "Server error occurred. Please try again.";
        }
      } else if (err.request) {
        errorMsg = "Network error. Please check your connection.";
      }
      
      toast.error(errorMsg);
    }
  };

  // Admin: Approve/Reject booking
  const handleAction = async (id: number, action: "approved" | "rejected") => {
    const currentToken = getToken();
    if (!currentToken) {
      toast.error("You are not logged in! Please login again.");
      return;
    }
    
    if (!isAdmin) {
      toast.error("Only administrators can approve/reject bookings.");
      return;
    }
    
    try {
      const response = await axiosInstance.patch(`bookings/${id}/`, { status: action });
      console.log("Update booking response:", response.data);
      
      // Update local state with the response data (server's version)
      const updatedBooking = response.data;
      setAllBookings((prev) =>
        prev.map((b) => (b.id === id ? updatedBooking : b))
      );
      
      // Also update bookings for calendar view if facility is selected
      if (selectedFacility) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? updatedBooking : b))
        );
      }
      
      toast.success(`Booking ${action} successfully!`);
      
      // Refresh all bookings to ensure consistency
      if (isAdmin) {
        await fetchAllBookings();
      }
      
      // Refresh bookings if viewing a specific facility
      if (selectedFacility) {
        await fetchBookings(selectedFacility);
      }
    } catch (err: any) {
      console.error("Update booking status error:", err);
      let errorMsg = "Failed to update booking status.";
      
      if (err.response) {
        errorMsg = err.response.data?.detail || 
                   err.response.data?.error || 
                   `Server error: ${err.response.status}`;
        
        if (err.response.status === 401) {
          errorMsg = "Session expired. Please login again.";
          localStorage.removeItem('access');
        } else if (err.response.status === 403) {
          errorMsg = "You don't have permission to update this booking.";
        }
      } else if (err.request) {
        errorMsg = "Network error. Please check your connection.";
      }
      
      toast.error(errorMsg);
    }
  };

  // Admin: Delete booking from table
  const handleAdminDelete = async (id: number) => {
    const currentToken = getToken();
    if (!currentToken) {
      toast.error("You are not logged in! Please login again.");
      return;
    }
    
    if (!isAdmin) {
      toast.error("Only administrators can delete bookings.");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    
    try {
      const response = await axiosInstance.delete(`bookings/${id}/`);
      console.log("Delete booking response:", response.data);
      
      // Update local state immediately
      setAllBookings((prev) => prev.filter((b) => b.id !== id));
      
      // Also update bookings for calendar view if facility is selected
      if (selectedFacility) {
        setBookings((prev) => prev.filter((b) => b.id !== id));
      }
      
      toast.success("Booking deleted successfully.");
      
      // Refresh all bookings to ensure consistency
      if (isAdmin) {
        await fetchAllBookings();
      }
      
      // Refresh bookings if viewing a specific facility
      if (selectedFacility) {
        await fetchBookings(selectedFacility);
      }
    } catch (err: any) {
      console.error("Delete booking error:", err);
      let errorMsg = "Failed to delete booking.";
      
      if (err.response) {
        errorMsg = err.response.data?.detail || 
                   err.response.data?.error || 
                   `Server error: ${err.response.status}`;
        
        if (err.response.status === 401) {
          errorMsg = "Session expired. Please login again.";
          localStorage.removeItem('access');
        } else if (err.response.status === 403) {
          errorMsg = "You don't have permission to delete this booking.";
        } else if (err.response.status === 404) {
          errorMsg = "Booking not found.";
        } else if (err.response.status === 500) {
          errorMsg = err.response.data?.detail || "Server error occurred. Please try again.";
        }
      } else if (err.request) {
        errorMsg = "Network error. Please check your connection.";
      }
      
      toast.error(errorMsg);
    }
  };

  const formatTimeTo12Hour = (time24?: string): string => {
    if (!time24 || !time24.includes(":")) return "--";
    const [hourStr, minute] = time24.split(":");
    const hour = parseInt(hourStr ?? "", 10);
    if (isNaN(hour)) return "--";
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
  };

  // Map bookings to calendar events
  const bookingEvents = bookings.map((b) => {
    const [yearStr, monthStr, dayStr] = b.date.split("-");
    const year = Number(yearStr ?? new Date().getFullYear());
    const month = Number(monthStr ?? 1);
    const day = Number(dayStr ?? 1);

    const [startHourStr, startMinStr] = b.start_time.split(":");
    const [endHourStr, endMinStr] = b.end_time.split(":");

    const startHour = Number(startHourStr ?? 0);
    const startMin = Number(startMinStr ?? 0);
    const endHour = Number(endHourStr ?? 0);
    const endMin = Number(endMinStr ?? 0);

    let bgColor = "#f0ad4e"; // pending
    if (b.status === "approved") bgColor = "#2e6F40";
    else if (b.status === "rejected") bgColor = "#d9534f";

    return {
      title: `${b.facility_name} (${formatAMPM(b.start_time)} - ${formatAMPM(b.end_time)}) [${b.status.toUpperCase()}]`,
      start: new Date(year, month - 1, day, startHour, startMin),
      end: new Date(year, month - 1, day, endHour, endMin),
      bookingId: b.id,
      bgColor,
      isBooking: true,
    };
  });

  // Helper function to convert time string to minutes
  const timeToMinutes = (timeStr: string): number => {
    const normalized = timeStr.split(':').slice(0, 2).join(':');
    const [hours, minutes] = normalized.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };

  // Check if two time ranges overlap
  const hasTimeOverlap = (start1: number, end1: number, start2: number, end2: number): boolean => {
    return start1 < end2 && start2 < end1;
  };

  // Map maintenance periods to calendar events - show all maintenance for calendar view
  const maintenanceEvents = maintenancePeriods
    .map((maint) => {
      const startDate = new Date(maint.start_date);
      const endDate = new Date(maint.end_date);
      const facilityName = maint.facility_name || `Facility ${maint.facility_id}`;
      
      // If maintenance has specific times, use them; otherwise block entire day
      if (maint.start_time && maint.end_time) {
        const [startHourStr, startMinStr] = maint.start_time.split(":");
        const [endHourStr, endMinStr] = maint.end_time.split(":");
        const startHour = Number(startHourStr ?? 0);
        const startMin = Number(startMinStr ?? 0);
        const endHour = Number(endHourStr ?? 0);
        const endMin = Number(endMinStr ?? 0);
        
        return {
          title: `🚧 ${facilityName} - Maintenance${maint.reason ? `: ${maint.reason}` : ''}`,
          start: new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), startHour, startMin),
          end: new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), endHour, endMin),
          bgColor: "#ff6b6b",
          borderColor: "#c92a2a",
          isMaintenance: true,
          maintenanceId: maint.id,
          facilityId: maint.facility_id,
        };
      } else {
        // Block entire day(s) - create events for each day in the range
        const events = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          events.push({
            title: `🚧 ${facilityName} - Maintenance${maint.reason ? `: ${maint.reason}` : ''}`,
            start: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0),
            end: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59),
            bgColor: "#ff6b6b",
            borderColor: "#c92a2a",
            isMaintenance: true,
            maintenanceId: maint.id,
            facilityId: maint.facility_id,
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
        return events;
      }
    })
    .flat(); // Flatten array in case we have multiple events from date ranges

  const events = [...bookingEvents, ...maintenanceEvents];

  // Scrollable date row
  const DateRow: React.FC<{ currentDate: Date; onSelectDate: (d: Date) => void }> = ({
    currentDate,
    onSelectDate,
  }) => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div
        style={{
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          padding: "6px 0",
          marginBottom: "10px",
        }}
      >
        {dates.map((day) => {
          const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const isPast = dateObj < today;

          return (
            <button
              key={day}
              disabled={isPast}
              onClick={() => onSelectDate(dateObj)}
              style={{
                padding: "6px 10px",
                borderRadius: "4px",
                border:
                  dateObj.toDateString() === date.toDateString() ? "2px solid #2e6f40" : "1px solid #ccc",
                backgroundColor: isPast
                  ? "#ddd"
                  : dateObj.toDateString() === date.toDateString()
                  ? "#2e6f40"
                  : "#fff",
                color: isPast ? "#888" : dateObj.toDateString() === date.toDateString() ? "#fff" : "#000",
                cursor: isPast ? "not-allowed" : "pointer",
                minWidth: "36px",
                textAlign: "center",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    );
  };

  // Filter bookings for admin table
  let filteredBookings = selectedDate
    ? allBookings.filter((b) => b.date === selectedDate)
    : allBookings;

  filteredBookings = filteredBookings.filter((b) =>
    b.facility_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    b.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calendar view content
  const calendarView = (
    <div className="calendar-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h2>Booking Amenities</h2>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setShowAdminTable(!showAdminTable)}
              style={{
                padding: '10px 20px',
                backgroundColor: showAdminTable ? '#2e6F40' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              {showAdminTable ? 'Show Calendar' : 'Show Admin Table'}
            </button>
            <button 
              onClick={() => setShowMaintenanceManager(!showMaintenanceManager)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ff6b6b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              {showMaintenanceManager ? 'Hide' : 'Manage'} Maintenance
            </button>
            <button 
              onClick={() => setShowAdminBookingForm(!showAdminBookingForm)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2e6F40',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              {showAdminBookingForm ? 'Hide' : 'Book'} Facility
            </button>
          </div>
        )}
      </div>

      {/* Facility Selector for Homeowners */}
      {!isAdmin && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e0e0e0'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>
            Select Facility to Book
          </h3>
          <select
            value={selectedFacility || ""}
            onChange={(e) => setSelectedFacility(Number(e.target.value))}
            style={{
              padding: '12px 16px',
              borderRadius: '6px',
              border: '1px solid #e0e0e0',
              width: '100%',
              maxWidth: '400px',
              fontSize: '15px',
              backgroundColor: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <option value="">-- Choose a facility --</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          {selectedFacility && (
            <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
              Selected: <strong>{facilities.find(f => f.id === selectedFacility)?.name}</strong>
            </p>
          )}
        </div>
      )}

      {isAdmin && showMaintenanceManager && (
        <div style={{
          backgroundColor: '#fff5f5',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '2px solid #ff6b6b'
        }}>
          <h3 style={{ marginTop: 0, color: '#c92a2a' }}>
            {editingMaintenance ? 'Edit Maintenance Period' : 'Set Maintenance Period'}
          </h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Facility:</label>
              <select
                value={selectedFacility || ""}
                onChange={(e) => setSelectedFacility(Number(e.target.value))}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '150px' }}
              >
                <option value="">Select Facility</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Start Date:</label>
              <input
                type="date"
                value={`${maintenanceStartDate.getFullYear()}-${(maintenanceStartDate.getMonth() + 1)
                  .toString()
                  .padStart(2, "0")}-${maintenanceStartDate.getDate().toString().padStart(2, "0")}`}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  const [yearStr, monthStr, dayStr] = e.target.value.split("-");
                  const year = Number(yearStr ?? new Date().getFullYear());
                  const month = Number(monthStr ?? 1);
                  const day = Number(dayStr ?? 1);
                  setMaintenanceStartDate(new Date(year, month - 1, day));
                }}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>End Date:</label>
              <input
                type="date"
                value={`${maintenanceEndDate.getFullYear()}-${(maintenanceEndDate.getMonth() + 1)
                  .toString()
                  .padStart(2, "0")}-${maintenanceEndDate.getDate().toString().padStart(2, "0")}`}
                min={maintenanceStartDate.toISOString().split("T")[0]}
                onChange={(e) => {
                  const [yearStr, monthStr, dayStr] = e.target.value.split("-");
                  const year = Number(yearStr ?? new Date().getFullYear());
                  const month = Number(monthStr ?? 1);
                  const day = Number(dayStr ?? 1);
                  setMaintenanceEndDate(new Date(year, month - 1, day));
                }}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Start Time (Optional):</label>
              <input
                type="time"
                value={maintenanceStartTime}
                onChange={(e) => setMaintenanceStartTime(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                placeholder="Leave empty for all day"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>End Time (Optional):</label>
              <input
                type="time"
                value={maintenanceEndTime}
                onChange={(e) => setMaintenanceEndTime(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                placeholder="Leave empty for all day"
              />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Reason:</label>
              <input
                type="text"
                value={maintenanceReason}
                onChange={(e) => setMaintenanceReason(e.target.value)}
                placeholder="Maintenance reason (optional)"
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddMaintenance();
              }}
              disabled={!selectedFacility}
              style={{
                padding: '8px 20px',
                backgroundColor: selectedFacility ? '#ff6b6b' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: selectedFacility ? 'pointer' : 'not-allowed',
                height: 'fit-content',
                opacity: selectedFacility ? 1 : 0.6,
                pointerEvents: selectedFacility ? 'auto' : 'none',
                whiteSpace: 'nowrap'
              }}
            >
              {editingMaintenance ? 'Update Maintenance' : 'Add Maintenance'}
            </button>
            {editingMaintenance && (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  height: 'fit-content',
                  whiteSpace: 'nowrap'
                }}
              >
                Cancel
              </button>
            )}
          </div>
          
          {maintenancePeriods.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4>Current Maintenance Periods:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {maintenancePeriods
                  .filter(m => !selectedFacility || m.facility_id === selectedFacility)
                  .map((maint, idx) => (
                  <div
                    key={maint.id || idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div>
                        <strong>{maint.facility_name || `Facility ${maint.facility_id}`}</strong>
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {new Date(maint.start_date).toLocaleDateString()} - {new Date(maint.end_date).toLocaleDateString()}
                        {maint.start_time && maint.end_time && ` (${formatAMPM(maint.start_time)} - ${formatAMPM(maint.end_time)})`}
                        {maint.reason && ` - ${maint.reason}`}
                      </div>
                    </div>
                    {maint.id && (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => handleEditMaintenance(maint)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#ffc107',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMaintenance(maint.id!)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
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
          )}
        </div>
      )}

      {/* User Booking Form */}
      {!isAdmin && selectedFacility && (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '25px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e0e0e0'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', fontWeight: '600', color: '#333' }}>
            Book {facilities.find(f => f.id === selectedFacility)?.name}
          </h3>
          
          {/* Maintenance Warning for Homeowners */}
          {isUnderMaintenance() && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '15px',
              color: '#856404'
            }}>
              <strong>⚠️ Warning:</strong> This facility is under maintenance for the selected date/time. 
              {(() => {
                const maintenance = maintenancePeriods.find(m => {
                  if (m.facility_id !== selectedFacility) return false;
                  const bookingDate = `${date.getFullYear()}-${(date.getMonth() + 1)
                    .toString()
                    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
                  const startDate = new Date(m.start_date);
                  const endDate = new Date(m.end_date);
                  const bookingDateObj = new Date(bookingDate);
                  return bookingDateObj >= startDate && bookingDateObj <= endDate;
                });
                return maintenance?.reason ? ` Reason: ${maintenance.reason}` : '';
              })()}
              <br />
              <span style={{ fontSize: '13px' }}>Please select a different date/time.</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Select Date:
              </label>
              <input
                type="date"
                value={`${date.getFullYear()}-${(date.getMonth() + 1)
                  .toString()
                  .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  const [yearStr, monthStr, dayStr] = e.target.value.split("-");
                  const year = Number(yearStr ?? new Date().getFullYear());
                  const month = Number(monthStr ?? 1);
                  const day = Number(dayStr ?? 1);
                  const newDate = new Date(year, month - 1, day);
                  newDate.setHours(12, 0, 0, 0);
                  setDate(newDate);
                }}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0',
                  width: '100%',
                  maxWidth: '300px',
                  fontSize: '15px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Select Time:
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ flex: 1, maxWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Start Time:</label>
                  <input 
                    type="time" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #e0e0e0',
                      width: '100%',
                      fontSize: '15px'
                    }}
                  />
                </div>
                <div style={{ flex: 1, maxWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>End Time:</label>
                  <input 
                    type="time" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)}
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #e0e0e0',
                      width: '100%',
                      fontSize: '15px'
                    }}
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleBook}
              disabled={isUnderMaintenance() || isPastDateTime()}
              style={{
                padding: '12px 24px',
                backgroundColor: (isUnderMaintenance() || isPastDateTime()) ? '#ccc' : '#2e6F40',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: (isUnderMaintenance() || isPastDateTime()) ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                fontWeight: '500',
                maxWidth: '200px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isUnderMaintenance() && !isPastDateTime()) {
                  e.currentTarget.style.backgroundColor = '#255a35';
                }
              }}
              onMouseLeave={(e) => {
                if (!isUnderMaintenance() && !isPastDateTime()) {
                  e.currentTarget.style.backgroundColor = '#2e6F40';
                }
              }}
            >
              Submit Booking Request
            </button>
          </div>
        </div>
      )}

      {/* Admin Booking Form */}
      {isAdmin && showAdminBookingForm && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '2px solid #2e6F40'
        }}>
          <h3 style={{ marginTop: 0, color: '#2e6F40' }}>Book Facility (Admin)</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px', fontStyle: 'italic' }}>
            Book a facility on behalf of a resident or for admin use.
          </p>
          <select
            value={selectedFacility || ""}
            onChange={(e) => setSelectedFacility(Number(e.target.value))}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', marginBottom: '10px' }}
          >
            <option value="">Select Facility</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={`${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => {
              const [yearStr, monthStr, dayStr] = e.target.value.split("-");
              const year = Number(yearStr ?? new Date().getFullYear());
              const month = Number(monthStr ?? 1);
              const day = Number(dayStr ?? 1);
              const newDate = new Date(year, month - 1, day);
              newDate.setHours(12, 0, 0, 0);
              setDate(newDate);
            }}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', marginBottom: '10px' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
            <label style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>
              Select your preferred time:
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="time" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)}
                style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <input 
                type="time" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)}
                style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
          </div>

          {/* Maintenance Warning */}
          {selectedFacility && isUnderMaintenance() && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '2px solid #ffc107',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '15px',
              color: '#856404'
            }}>
              <strong>⚠️ Warning:</strong> This facility is under maintenance for the selected date/time. 
              {(() => {
                const maintenance = maintenancePeriods.find(m => {
                  if (m.facility_id !== selectedFacility) return false;
                  const bookingDate = `${date.getFullYear()}-${(date.getMonth() + 1)
                    .toString()
                    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
                  const startDate = new Date(m.start_date);
                  const endDate = new Date(m.end_date);
                  const bookingDateObj = new Date(bookingDate);
                  return bookingDateObj >= startDate && bookingDateObj <= endDate;
                });
                return maintenance?.reason ? ` Reason: ${maintenance.reason}` : '';
              })()}
              <br />
              <span style={{ fontSize: '13px' }}>You cannot book during maintenance periods.</span>
            </div>
          )}

          {/* Past Date/Time Warning */}
          {isPastDateTime() && (
            <div style={{
              backgroundColor: '#f8d7da',
              border: '2px solid #dc3545',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '15px',
              color: '#721c24'
            }}>
              <strong>⚠️ Error:</strong> Cannot book dates or times in the past. Please select a current or future date/time.
            </div>
          )}

          <button 
            onClick={handleBook}
            disabled={!selectedFacility || isUnderMaintenance() || isPastDateTime()}
            style={{
              padding: '10px 20px',
              backgroundColor: (!selectedFacility || isUnderMaintenance() || isPastDateTime()) ? '#ccc' : '#2e6F40',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (!selectedFacility || isUnderMaintenance() || isPastDateTime()) ? 'not-allowed' : 'pointer',
              width: '100%',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'background-color 0.3s'
            }}
          >
            Book Facility
          </button>
        </div>
      )}


      <div className="calendar-flex">
        <div className="appointments-list">
          <h3>Scheduled Appointments</h3>
          {bookings.length === 0 ? (
            <p>No bookings yet for this facility.</p>
          ) : (
            <ul>
              {bookings
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((b) => (
                  <li key={b.id} className="appointment-item">
                    <strong>{b.facility_name}</strong> — {b.date} (
                    {formatAMPM(b.start_time)} - {formatAMPM(b.end_time)})
                    <span
                      style={{
                        marginLeft: "10px",
                        fontWeight: "bold",
                        color:
                          b.status === "approved"
                            ? "#2e6F40"
                            : b.status === "rejected"
                            ? "#d9534f"
                            : "#f0ad4e",
                      }}
                    >
                      {b.status.toUpperCase()}
                    </span>
                    <button className="delete-btn" onClick={() => handleDelete(b.id)}>
                      Delete
                    </button>
                  </li>
                ))}
            </ul>
          )}

        </div>

        <div className="calendar-wrapper">
          <DateRow currentDate={date} onSelectDate={(d) => setDate(d)} />

          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            defaultView="month"
            views={["month", "week", "day", "agenda"]}
            style={{ height: "600px" }}
            date={date}
            onNavigate={(newDate) => {
              const today = new Date();
              const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

              if (newDate < startOfToday) {
                toast.warn("You cannot view past dates.");
                setDate(startOfToday);
              } else {
                setDate(newDate);
              }
            }}
            eventPropGetter={(event: any) => ({
              style: {
                backgroundColor: event.bgColor || "#2e6F40",
                color: event.isMaintenance ? "white" : "white",
                borderRadius: "6px",
                padding: "2px 4px",
                border: event.isMaintenance ? `2px solid ${event.borderColor || "#c92a2a"}` : "none",
                borderStyle: "solid",
                fontWeight: event.isMaintenance ? "bold" : "normal",
                opacity: 1,
                cursor: "default",
              },
            })}
            onSelectEvent={(event: any) => {
              // Maintenance events show info message
              if (event.isMaintenance) {
                toast.info("This facility is under maintenance during this period. Bookings are not available.");
              } else {
                toast.info(`Booking info:\n${event.title}`);
              }
            }}
            dayPropGetter={(date: Date) => {
              // Check if this date is under maintenance for the selected facility
              if (selectedFacility) {
                const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1)
                  .toString()
                  .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
                
                const isMaintenanceDay = maintenancePeriods.some((maint) => {
                  if (maint.facility_id !== selectedFacility) return false;
                  const startDate = new Date(maint.start_date);
                  const endDate = new Date(maint.end_date);
                  const checkDate = new Date(dateStr);
                  return checkDate >= startDate && checkDate <= endDate && !maint.start_time && !maint.end_time;
                });
                
                if (isMaintenanceDay) {
                  return {
                    className: 'maintenance-day',
                    style: {
                      backgroundColor: '#ffe0e0',
                      opacity: 0.6,
                      pointerEvents: 'none',
                    },
                  };
                }
              }
              
              // Block past dates
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const checkDate = new Date(date);
              checkDate.setHours(0, 0, 0, 0);
              
              if (checkDate < today) {
                return {
                  className: 'past-day',
                  style: {
                    backgroundColor: '#f0f0f0',
                    opacity: 0.5,
                    pointerEvents: 'none',
                  },
                };
              }
              
              return {};
            }}
          />
        </div>
      </div>
    </div>
  );

  // Admin table view content
  const adminTableView = (
    <div className="admin-booking-container">
      {/* Header Section */}
      <div className="header-section">
        <h2>Booking Amenities - Admin Management</h2>
        <button 
          onClick={() => setShowAdminTable(!showAdminTable)}
          className="header-button"
        >
          Show Calendar
        </button>
      </div>

      {/* Stats Cards */}
      {!loading && (
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-value">{allBookings.length}</div>
            <div className="stat-label">Total Bookings</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#f0ad4e' }}>
              {allBookings.filter(b => b.status === 'pending').length}
            </div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#2e6F40' }}>
              {allBookings.filter(b => b.status === 'approved').length}
            </div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#d9534f' }}>
              {allBookings.filter(b => b.status === 'rejected').length}
            </div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="filters-section">
        <div className="date-filter">
          <label htmlFor="date-input">Filter by Date:</label>
          <input
            id="date-input"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          {selectedDate && (
            <button className="clear-btn" onClick={() => setSelectedDate("")}>
              Clear Date
            </button>
          )}
        </div>

        <div>
          <input
            type="text"
            placeholder="Search by facility, user, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>Loading bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"></div>
          <h3>No Bookings Found</h3>
          <p>
            {selectedDate 
              ? `No bookings found for ${selectedDate}. Try selecting a different date or clearing the filter.`
              : searchQuery
              ? `No bookings match "${searchQuery}". Try a different search term.`
              : "No bookings have been made yet."}
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="booking-table">
            <thead>
              <tr>
                <th>Facility</th>
                <th>User</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600, color: '#2c3e50' }}>{b.facility_name}</td>
                  <td>{b.user_name || "N/A"}</td>
                  <td>{new Date(b.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}</td>
                  <td style={{ fontFamily: 'monospace', color: '#555' }}>
                    {formatTimeTo12Hour(b.start_time)} - {formatTimeTo12Hour(b.end_time)}
                  </td>
                  <td>
                    <span className={`status ${b.status}`}>{b.status}</span>
                  </td>
                  <td>
                    {b.status === "pending" ? (
                      <div className="action-buttons">
                        <button
                          className="approve-btn"
                          onClick={() => handleAction(b.id, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleAction(b.id, "rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    ) : b.status === "rejected" ? (
                      <button
                        className="delete-btn"
                        onClick={() => handleAdminDelete(b.id)}
                      >
                        Delete
                      </button>
                    ) : (
                      <span style={{ 
                        color: '#2e6F40', 
                        fontSize: '14px',
                        fontWeight: 600
                      }}>
                        Approved
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Main render
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    const savedToken = getToken();
    if (!savedToken) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={6000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        toastClassName="custom-toast"
      />
      {isAdmin ? (
        <div className="dashboard-layout">
          <Sidebar />
          <main className="dashboard-main">
            {showAdminTable ? adminTableView : calendarView}
          </main>
        </div>
      ) : (
        <div>
          <NavBar />
          <div style={{ minHeight: 'calc(100vh - 200px)', padding: '20px' }}>
            {calendarView}
          </div>
          <Footer />
        </div>
      )}
    </>
  );
};

export default BookingAmenities;


