import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase Configuration
 * Project: Jata Shankar Tent House
 * 
 * This file initializes Firebase with your project credentials
 * and exports the auth and db instances for use throughout the app
 */

const firebaseConfig = {
  apiKey: "AIzaSyC5n824-vDTwDZXXk1w9SHOmPe5VQju3xo",
  authDomain: "jata-shankar-tent-house.firebaseapp.com",
  projectId: "jata-shankar-tent-house",
  storageBucket: "jata-shankar-tent-house.firebasestorage.app",
  messagingSenderId: "10498075610",
  appId: "1:10498075610:web:f9d647a8c2c1fcb4286ee3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

/**
 * Firebase Authentication
 * Used for owner login with email/password
 * Methods: loginUser(), logoutUser(), subscribeToAuthState()
 */
export const auth = getAuth(app);

/**
 * Cloud Firestore Database
 * Used for storing:
 * - items (rental items with rates)
 * - bills (customer bills with status)
 * - bookings (confirmed bookings by date)
 */
export const db = getFirestore(app);

export default app;
