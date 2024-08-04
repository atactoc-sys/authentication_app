const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

module.exports = function (passport) {
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await User.findOne({ email });
          if (!user) {
            return done(null, false, {
              message: "That email is not registered",
            });
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: "Password incorrect" });
          }

          return done(null, user);
        } catch (err) {
          console.error(err);
          return done(err);
        }
      }
    )
  );

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        const newUser = {
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
        };

        try {
          let user = await User.findOne({ googleId: profile.id });
          if (user) {
            return done(null, user);
          }

          user = await User.findOne({ email: newUser.email });
          if (user) {
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
          }

          user = new User(newUser);
          await user.save();
          return done(null, user);
        } catch (err) {
          console.error(err);
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};
