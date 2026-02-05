# Quick Start Guide

## 1. Install Dependencies

```bash
npm install
```

This installs:
- React 19
- React Router v6
- Firebase SDK
- Vite

## 2. Configure Firebase

### Get Firebase Credentials:
1. Go to https://console.firebase.google.com
2. Create a new project or use existing
3. Go to Project Settings (gear icon)
4. Copy your Web SDK config

### Create `.env.local` file:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Setup Firestore:
1. In Firebase Console, go to Firestore Database
2. Create database (Start in test mode)
3. Create these collections:

**Collection: items**
```
Document 1:
{
  name: "अरी शीशम 15 x 15",
  rate: 500
}

Document 2:
{
  name: "शीशम V.I.P",
  rate: 600
}
// Add more items from the bill...
```

**Collection: bills** (auto-created when first bill submitted)

**Collection: bookings** (auto-created when first bill approved)

### Create Owner Account:
1. Go to Firebase Console → Authentication
2. Click "Add user"
3. Enter email and password
4. Use these to login as owner

## 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:5173

## 4. Test the App

### As Public User:
1. Click "Create New Bill"
2. Enter customer name: "Test Customer"
3. Select date: Tomorrow
4. Click items to add them
5. Adjust quantities
6. Click "Submit Bill for Approval"

### As Owner:
1. Click "Owner Login"
2. Login with your Firebase credentials
3. View dashboard
4. Go to "Bills" → Find pending bill
5. Click "Approve & Confirm Booking"
6. Check "Calendar" to see booking

## 5. Build for Production

```bash
npm run build
```

Creates optimized build in `dist/` folder

## 6. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Follow prompts to deploy. Add environment variables in Vercel dashboard.

## File Structure Summary

```
src/
├── pages/              # All page components
├── services/           # Firebase operations
├── components/         # Reusable components
├── firebase/           # Firebase config
├── styles/             # CSS styling
├── App.jsx             # Main app with routes
└── main.jsx            # Entry point
```

## Key Features

✅ Public bill creation
✅ Owner approval workflow
✅ Double booking prevention
✅ Item price management
✅ Calendar view
✅ Mobile responsive
✅ Firebase integration
✅ Protected routes

## Troubleshooting

**Port 5173 already in use?**
```bash
npm run dev -- --port 3000
```

**Firebase errors?**
- Check `.env.local` has correct credentials
- Verify Firestore database exists
- Check Authentication is enabled

**Styling not loading?**
- Clear browser cache (Ctrl+Shift+Delete)
- Restart dev server

## Next Steps

1. Add more items to Firestore
2. Customize colors in `src/styles/pages.css`
3. Add WhatsApp sharing (optional)
4. Add PDF download (optional)
5. Deploy to custom domain

---

**Ready to go!** 🚀
