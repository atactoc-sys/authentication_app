require("dotenv").config();
const express = require("express");

const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const authRoutes = require("./routes/authRoutes");
const initializePassport = require("./config/passport");

const app = express();

// Connect to the database

initializePassport(passport);

// Set view engine
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize passport and session
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Global middleware for flash messages
app.use((req, res, next) => {
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

// Routes
app.use("/auth", authRoutes);
app.get("/", (req, res) => {
  res.render("home", { user: req.user });
});

module.exports = app;
