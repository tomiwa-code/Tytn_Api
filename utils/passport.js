const passport = require("passport");
const User = require("../models/User");
const { generateToken } = require("./token");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// Configure the Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://tytn-api.onrender.com/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      // Check if there's an existing user with the same Google ID
      const userWithGoogleId = await User.findOne({ googleId: profile.id });

      // Check if there's an existing user with the same email address
      const userWithEmail = await User.findOne({
        email: profile.emails[0].value,
      });

      if (!userWithGoogleId && !userWithEmail) {
        // If neither Google ID nor email exists, create a new user
        const newUser = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          password: undefined,
        });

        // Save the user to the database
        const savedUser = await newUser.save();
        // Generate an access token
        const token = generateToken(savedUser);
        // Extract the email and the user id
        const { email, _id } = savedUser;

        done(null, { success: true, token, user: { email, _id } });
      } else if (userWithGoogleId) {
        const token = generateToken(userWithGoogleId);
        const { email, _id } = userWithGoogleId;
        done(null, { success: true, token, user: { email, _id } });
      } else {
        // If a user with the same email exists, inform the user
        done(null, false, {
          message:
            "This email has been used to create an account with email and password. Please use the email and password sign-in method.",
        });
      }
    }
  )
);
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: "/api/auth/google/callback",
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       const user = await User.findOne({ googleId: profile.id });
//       if (!user) {
//         const newUser = new User({
//           googleId: profile.id,
//           name: profile.displayName,
//           email: profile.emails[0].value,
//           password: undefined,
//         });
//         // Save the user to the database
//         const savedUser = await newUser.save();
//         // Generate an access token
//         const token = generateToken(savedUser);

//         done(null, { token, user: savedUser });
//       } else {
//         // Generate an access token
//         const token = generateToken(savedUser);
//         done(null, { token, user });
//       }
//     }
//   )
// );

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
