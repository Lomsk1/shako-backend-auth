import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "../models/user"; // Import User model
import crypto from "crypto";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "http://localhost:8000/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        console.log("profile:", profile.emails?.[0].value);

        const existingUser = await User.findOne({
          email: profile.emails?.[0].value,
        });

        if (existingUser) {
          return done(null, existingUser);
        }

        // Generate a random password for new users (temporary password)
        const temporaryPassword = crypto.randomBytes(16).toString("hex");

        // Create a new user if they don’t exist
        const newUser = await User.create({
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          email: profile.emails?.[0].value,
          role: "user",
          password: temporaryPassword,
          passwordConfirm: temporaryPassword,
        });

        done(null, newUser);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, (user as any).id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
