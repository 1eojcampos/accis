import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { auth, db } from './firebase.js';

passport.serializeUser((user, done) => {
  done(null, user.uid);
});

passport.deserializeUser(async (uid, done) => {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    done(null, userDoc.data());
  } catch (error) {
    done(error, null);
  }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists in Firebase
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(profile.emails[0].value);
      } catch (error) {
        // User doesn't exist, create new user
        const type = req.session.oauthType || 'signin';
        const role = req.session.oauthRole || 'customer';
        
        userRecord = await auth.createUser({
          email: profile.emails[0].value,
          emailVerified: true,
          displayName: profile.displayName,
          photoURL: profile.photos[0]?.value,
        });

        // Store additional user data in Firestore
        await db.collection('users').doc(userRecord.uid).set({
          email: profile.emails[0].value,
          name: profile.displayName,
          picture: profile.photos[0]?.value,
          role: role,
          provider: 'google',
          createdAt: Date.now()
        });
      }

      // Create custom token
      const token = await auth.createCustomToken(userRecord.uid);
      
      return done(null, { 
        uid: userRecord.uid,
        token
      });
    } catch (error) {
      return done(error, null);
    }
  }
));
