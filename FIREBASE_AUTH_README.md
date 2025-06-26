# Firebase Authentication App

A React application with Firebase authentication featuring traditional login/signup and Google authentication.

## Features

- ✅ Email/Password Authentication
- ✅ Google Sign-In
- ✅ User Registration
- ✅ Password Reset
- ✅ Protected Routes
- ✅ Responsive Design
- ✅ Modern UI/UX

## Setup Instructions

### 1. Firebase Configuration

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication in the Firebase console
4. Enable Email/Password and Google sign-in methods
5. Copy your Firebase configuration object

### 2. Configure Firebase

Replace the placeholder values in `src/firebase/config.js` with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-actual-auth-domain",
  projectId: "your-actual-project-id",
  storageBucket: "your-actual-storage-bucket",
  messagingSenderId: "your-actual-messaging-sender-id",
  appId: "your-actual-app-id"
};
```

### 3. Enable Authentication Methods

In Firebase Console:
1. Go to Authentication > Sign-in method
2. Enable "Email/Password"
3. Enable "Google" and configure OAuth consent screen
4. Add your domain to authorized domains

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Application

```bash
npm run dev
```

## Project Structure

```
src/
├── components/
│   ├── Auth.css           # Authentication styles
│   ├── Dashboard.css      # Dashboard styles
│   ├── Dashboard.jsx      # Main dashboard component
│   ├── Login.jsx          # Login/signup component
│   └── PrivateRoute.jsx   # Route protection component
├── contexts/
│   └── AuthContext.jsx    # Authentication context
├── firebase/
│   └── config.js          # Firebase configuration
├── App.jsx                # Main app component
└── main.jsx               # App entry point
```

## Usage

### Login Page Features

- **Email/Password Login**: Traditional authentication
- **Google Sign-In**: One-click authentication with Google
- **User Registration**: Create new accounts with email/password
- **Password Reset**: Send reset emails to users
- **Form Validation**: Client-side validation with error messages
- **Responsive Design**: Works on desktop and mobile devices

### Dashboard

- Displays user information
- Secure logout functionality
- Welcome message with feature overview

### Security Features

- **Protected Routes**: Unauthorized users are redirected to login
- **Authentication State Management**: Global state management with React Context
- **Error Handling**: Comprehensive error messages for different scenarios
- **Form Validation**: Input validation and sanitization

## Deployment

Before deploying, make sure to:

1. Update Firebase configuration with production values
2. Add your production domain to Firebase authorized domains
3. Configure OAuth consent screen for Google Sign-In
4. Test all authentication flows in production environment

## Environment Variables (Optional)

For additional security, you can use environment variables for Firebase configuration:

Create a `.env` file in the root directory:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Then update `src/firebase/config.js` to use these variables:

```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

## Troubleshooting

### Common Issues

1. **Firebase Configuration Error**: Make sure all Firebase config values are correct
2. **Google Sign-In Not Working**: Ensure Google provider is enabled and OAuth consent screen is configured
3. **Redirect Issues**: Check that your domain is added to Firebase authorized domains
4. **Build Errors**: Make sure all dependencies are installed correctly

### Support

For issues related to:
- Firebase: Check [Firebase Documentation](https://firebase.google.com/docs)
- React Router: Check [React Router Documentation](https://reactrouter.com/)
- React: Check [React Documentation](https://react.dev/)

## License

This project is open source and available under the [MIT License](LICENSE).
