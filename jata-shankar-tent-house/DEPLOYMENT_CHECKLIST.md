# Deployment Checklist

Complete this checklist before deploying to production.

## Pre-Deployment Setup

### Firebase Configuration
- [ ] Firebase project created at https://console.firebase.google.com
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore Database created
- [ ] Firebase credentials copied to `.env.local`
- [ ] `.env.local` added to `.gitignore` (never commit secrets)

### Firestore Collections
- [ ] `items` collection created
- [ ] All items added with names and rates (see BILL_ITEMS.md)
- [ ] `bills` collection created (auto-created on first bill)
- [ ] `bookings` collection created (auto-created on first booking)

### Owner Account
- [ ] Owner email/password created in Firebase Authentication
- [ ] Owner can login successfully
- [ ] Owner can access dashboard

### Local Testing
- [ ] `npm install` completed successfully
- [ ] `npm run dev` starts without errors
- [ ] App loads at http://localhost:5173
- [ ] Home page displays correctly
- [ ] Create Bill page works
- [ ] Owner login works
- [ ] Dashboard displays stats
- [ ] Bills management works
- [ ] Calendar displays correctly
- [ ] Items management works
- [ ] No console errors

## Code Quality

- [ ] All imports are correct
- [ ] No unused variables
- [ ] Comments explain complex logic
- [ ] Error handling implemented
- [ ] Loading states shown
- [ ] Mobile responsive tested
- [ ] All routes working

## Security

- [ ] Environment variables used for Firebase config
- [ ] No hardcoded credentials in code
- [ ] `.env.local` in `.gitignore`
- [ ] `.env.example` has placeholder values
- [ ] Protected routes working (owner pages)
- [ ] Public pages accessible without login

## Performance

- [ ] Build completes: `npm run build`
- [ ] Build size reasonable
- [ ] No console warnings
- [ ] Images optimized
- [ ] CSS minified in build

## Browser Testing

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

## Firestore Security Rules

Before production, update security rules:

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

- [ ] Security rules updated in Firebase Console
- [ ] Test mode disabled
- [ ] Rules tested with sample data

## GitHub Setup

- [ ] Repository created
- [ ] `.gitignore` configured
- [ ] `.env.local` not committed
- [ ] All files committed
- [ ] Main branch ready

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/jata-shankar-tent-house.git
git push -u origin main
```

- [ ] Repository pushed to GitHub

## Vercel Deployment

### Create Vercel Account
- [ ] Vercel account created at https://vercel.com
- [ ] GitHub connected to Vercel

### Deploy Project
- [ ] Project imported from GitHub
- [ ] Build settings correct:
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`
- [ ] Environment variables added:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
- [ ] Project deployed successfully
- [ ] Vercel URL working

### Custom Domain Setup
- [ ] Domain registered (e.g., app.jatashankartent.in)
- [ ] Domain added in Vercel settings
- [ ] DNS records configured
- [ ] SSL certificate auto-generated
- [ ] Custom domain working

## Post-Deployment Testing

### Functionality
- [ ] Home page loads
- [ ] Create Bill works
- [ ] Owner login works
- [ ] Dashboard displays
- [ ] Bills management works
- [ ] Calendar works
- [ ] Items management works
- [ ] Logout works

### Performance
- [ ] Page loads quickly
- [ ] No console errors
- [ ] Images load properly
- [ ] Responsive on mobile

### Security
- [ ] Protected routes redirect to login
- [ ] Public pages accessible
- [ ] No sensitive data exposed
- [ ] HTTPS working

## Monitoring

- [ ] Vercel analytics enabled
- [ ] Firebase monitoring enabled
- [ ] Error tracking setup
- [ ] Performance monitoring setup

## Documentation

- [ ] README.md updated
- [ ] SETUP.md complete
- [ ] QUICK_START.md complete
- [ ] API_REFERENCE.md complete
- [ ] BILL_ITEMS.md complete
- [ ] Comments in code

## Backup & Recovery

- [ ] Firebase backups enabled
- [ ] GitHub repository backed up
- [ ] Environment variables documented (securely)
- [ ] Recovery plan documented

## Final Checks

- [ ] All tests passed
- [ ] No known bugs
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Documentation complete
- [ ] Team trained on usage
- [ ] Support plan in place

## Go Live!

- [ ] All checklist items completed
- [ ] Stakeholders notified
- [ ] Users can access app
- [ ] Monitor for issues
- [ ] Collect feedback

## Post-Launch

### Week 1
- [ ] Monitor for errors
- [ ] Check performance
- [ ] Gather user feedback
- [ ] Fix critical issues

### Week 2-4
- [ ] Optimize based on feedback
- [ ] Add missing features
- [ ] Improve performance
- [ ] Plan next updates

### Ongoing
- [ ] Regular backups
- [ ] Security updates
- [ ] Performance monitoring
- [ ] User support
- [ ] Feature requests

## Rollback Plan

If issues occur:

1. Check Vercel deployment history
2. Revert to previous version
3. Fix issue locally
4. Test thoroughly
5. Redeploy

```bash
# Revert to previous deployment
# In Vercel dashboard: Deployments → Select previous → Promote to Production
```

## Support Contacts

- Firebase Support: https://firebase.google.com/support
- Vercel Support: https://vercel.com/support
- React Documentation: https://react.dev
- React Router: https://reactrouter.com

---

**Deployment Checklist Complete!** ✅

Your app is ready for production. Monitor closely after launch and gather user feedback for improvements.
