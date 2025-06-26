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

### 2. Configure Firebase (Secure Method)

**IMPORTANT**: Never commit your actual Firebase credentials to version control!

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and replace placeholder values with your actual Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your-actual-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-actual-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-actual-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-actual-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-actual-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-actual-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-actual-measurement-id
   ```

3. The `.env` file is already in `.gitignore` and will not be committed to your repository.

**Security Note**: The `.env` file contains sensitive information and should never be committed to version control. Share these credentials securely with team members through encrypted channels.

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

## Environment Variables

This project uses environment variables to securely store Firebase configuration.

### Setup
1. Copy `.env.example` to `.env`
2. Fill in your actual Firebase configuration values
3. Never commit the `.env` file to version control

### Available Variables
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### Security Best Practices
- ✅ `.env` is in `.gitignore` 
- ✅ Use `.env.example` for team onboarding
- ✅ Store production secrets in deployment platform
- ❌ Never commit actual credentials to git
- ❌ Never share credentials in plain text

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
