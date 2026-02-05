# Jata Shankar Tent House - Billing & Booking App

Production-ready React + Vite web application for managing tent rental billing and bookings.

## Tech Stack

- **Frontend**: React 18 + Vite
- **Routing**: React Router v6
- **Backend**: Firebase (Authentication + Firestore)
- **Styling**: CSS (Mobile-first, PWA-ready)
- **Deployment**: Vercel

## Project Structure

```
src/
├── components/
│   └── ProtectedRoute.jsx       # Route protection for owner pages
├── pages/
│   ├── Home.jsx                 # Landing page
│   ├── Login.jsx                # Owner login
│   ├── Dashboard.jsx            # Owner dashboard
│   ├── CreateBill.jsx           # Create new bill (public)
│   ├── Bills.jsx                # Bills management (owner)
│   ├── Calendar.jsx             # Booking calendar (owner)
│   └── Items.jsx                # Manage items & prices (owner)
├── services/
│   ├── authService.js           # Firebase authentication
│   └── firestoreService.js      # Firestore database operations
├── styles/
│   └── pages.css                # All styling (mobile-first)
├── firebase/
│   └── firebaseConfig.js        # Firebase configuration
├── App.jsx                      # Main app with routing
└── main.jsx                     # Entry point
```

## Setup Instructions

### 1. Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Firebase project created (https://console.firebase.google.com)

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

#### Create Firebase Project:
1. Go to https://console.firebase.google.com
2. Create a new project
3. Enable Authentication (Email/Password)
4. Create Firestore Database (Start in test mode for development)

#### Get Firebase Credentials:
1. Go to Project Settings → Service Accounts
2. Click "Generate New Private Key" or use Web SDK credentials
3. Copy your Firebase config

#### Create Collections in Firestore:
```
Collection: items
  - name (string)
  - rate (number)

Collection: bills
  - customerName (string)
  - date (string, YYYY-MM-DD)
  - items (array of objects)
  - total (number)
  - status (string: pending/approved/rejected)
  - createdAt (timestamp)

Collection: bookings
  - date (string, YYYY-MM-DD)
  - billId (string)
  - customerName (string)

Collection: users
  - role (string: owner)
```

### 4. Environment Variables

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Fill in your Firebase credentials in `.env.local`:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Add Sample Items to Firestore

Add items to the `items` collection with names and rates from the bill image:

```javascript
// Example items (add via Firebase Console)
{
  name: "अरी शीशम 15 x 15",
  rate: 500
}
{
  name: "शीशम V.I.P",
  rate: 600
}
// ... add all items from the bill
```

### 6. Create Owner Account

1. Go to Firebase Console → Authentication
2. Create a new user with email/password
3. Use these credentials to login as owner

### 7. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage

### Public User (Staff):
1. Go to home page
2. Click "Create New Bill"
3. Enter customer name and event date
4. Select items and quantities
5. Submit bill for owner approval

### Owner (Admin):
1. Click "Owner Login"
2. Login with email/password
3. View dashboard with stats
4. Review pending bills
5. Approve/Reject bills
6. View bookings on calendar
7. Edit item prices

## Features

✅ **Public User**:
- Create bills with customer details
- Select items and quantities
- Auto-calculate totals
- Submit for approval
- Cannot see other bookings

✅ **Owner**:
- Login with email/password
- Dashboard with stats
- Review all bills
- Approve/Reject bills
- Prevent double bookings
- Edit item prices
- View bookings calendar
- Date-wise booking view

✅ **Technical**:
- Firebase Authentication
- Firestore real-time database
- Protected routes
- Mobile-first responsive design
- PWA-ready structure
- Environment variable configuration
- Clean, commented code

## Deployment to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/jata-shankar-tent-house.git
git push -u origin main
```

### 2. Deploy on Vercel
1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Add environment variables (from `.env.local`)
5. Click "Deploy"

### 3. Custom Domain
1. In Vercel project settings
2. Go to "Domains"
3. Add custom domain: `app.jatashankartent.in`
4. Follow DNS configuration steps

## Important Notes

- **Test Mode**: Firestore is in test mode by default. Set up security rules before production.
- **Authentication**: Only owner can access admin pages (protected routes)
- **Double Booking**: System prevents booking same date twice
- **Mobile First**: App is optimized for mobile devices
- **PWA Ready**: Can be converted to PWA with manifest.json

## Security Rules (Firestore)

For production, update Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public can read items
    match /items/{document=**} {
      allow read: if true;
    }
    
    // Public can create bills
    match /bills/{document=**} {
      allow create: if true;
      allow read, update: if request.auth != null;
    }
    
    // Only owner can access bookings
    match /bookings/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

**Firebase not connecting?**
- Check `.env.local` has correct credentials
- Verify Firestore database is created
- Check Firebase project has Authentication enabled

**Routes not working?**
- Ensure React Router is installed: `npm install react-router-dom`
- Check all page components are imported in App.jsx

**Styling issues?**
- Clear browser cache
- Check `pages.css` is imported in main.jsx
- Verify CSS file path is correct

## Support

For issues or questions, check:
- Firebase Documentation: https://firebase.google.com/docs
- React Router: https://reactrouter.com
- Vite: https://vitejs.dev

---

**Ready to deploy!** 🚀
