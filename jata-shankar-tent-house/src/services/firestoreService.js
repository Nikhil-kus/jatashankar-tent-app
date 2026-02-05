import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// ============ ITEMS COLLECTION ============

/**
 * Get all rental items
 * @returns {Promise<Array>} Array of items with id and data
 */
export const getItems = async () => {
  try {
    const itemsRef = collection(db, 'items');
    const snapshot = await getDocs(itemsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

/**
 * Update item price
 * @param {string} itemId - Item document ID
 * @param {number} newRate - New rate for the item
 * @returns {Promise}
 */
export const updateItemRate = async (itemId, newRate) => {
  try {
    const itemRef = doc(db, 'items', itemId);
    await updateDoc(itemRef, { rate: newRate });
  } catch (error) {
    console.error('Error updating item rate:', error);
    throw error;
  }
};

// ============ BILLS COLLECTION ============

/**
 * Create a new bill
 * @param {object} billData - Bill data object
 * @returns {Promise<string>} Bill document ID
 */
export const createBill = async (billData) => {
  try {
    const billsRef = collection(db, 'bills');
    const docRef = await addDoc(billsRef, {
      ...billData,
      createdAt: Timestamp.now(),
      // Only set status to pending if not already provided
      status: billData.status || 'pending',
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating bill:', error);
    throw error;
  }
};

/**
 * Get all bills (for owner dashboard)
 * @returns {Promise<Array>} Array of bills
 */
export const getAllBills = async () => {
  try {
    const billsRef = collection(db, 'bills');
    const q = query(billsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching bills:', error);
    throw error;
  }
};

/**
 * Get bill by ID
 * @param {string} billId - Bill document ID
 * @returns {Promise<object>} Bill data
 */
export const getBillById = async (billId) => {
  try {
    const billRef = doc(db, 'bills', billId);
    const snapshot = await getDoc(billRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching bill:', error);
    throw error;
  }
};

/**
 * Update bill status (approve/reject)
 * @param {string} billId - Bill document ID
 * @param {string} status - New status ('approved' or 'rejected')
 * @returns {Promise}
 */
export const updateBillStatus = async (billId, status) => {
  try {
    const billRef = doc(db, 'bills', billId);
    await updateDoc(billRef, { status });
  } catch (error) {
    console.error('Error updating bill status:', error);
    throw error;
  }
};

/**
 * Get bills for a specific date
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of bills for that date
 */
export const getBillsByDate = async (date) => {
  try {
    const billsRef = collection(db, 'bills');
    const q = query(billsRef, where('date', '==', date));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching bills by date:', error);
    throw error;
  }
};

// ============ BOOKINGS COLLECTION ============

/**
 * Create a booking (when bill is approved)
 * @param {object} bookingData - Booking data object
 * @returns {Promise<string>} Booking document ID
 */
export const createBooking = async (bookingData) => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const docRef = await addDoc(bookingsRef, bookingData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

/**
 * Check if date is already booked
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Promise<boolean>} True if date is booked
 */
export const isDateBooked = async (date) => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('date', '==', date));
    const snapshot = await getDocs(q);
    return snapshot.size > 0;
  } catch (error) {
    console.error('Error checking booking:', error);
    throw error;
  }
};

/**
 * Get all bookings
 * @returns {Promise<Array>} Array of bookings
 */
export const getAllBookings = async () => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, orderBy('date', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
};

/**
 * Get bookings for a date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of bookings in range
 */
export const getBookingsByDateRange = async (startDate, endDate) => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(
      bookingsRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching bookings by date range:', error);
    throw error;
  }
};
