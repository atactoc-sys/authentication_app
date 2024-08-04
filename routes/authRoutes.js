const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const passport = require("passport");
const authController = require("../controllers/authController");

// signup
router.get("/signup", (req, res) => res.render("auth/signup", { errors: [] }));
router.post("/signup", authController.register);

// Login
router.get("/login", (req, res) => res.render("auth/login", { errors: [] }));
router.post("/login", authController.login);

// logout
router.get("/logout", authController.logout);

// change password
router.get("/change-password", ensureAuthenticated, (req, res) => {
  res.render("auth/changePassword", { errors: [] });
});
router.post(
  "/change-password",
  ensureAuthenticated,
  authController.changePassword
);

// reset password
router.get("/reset-password", (req, res) =>
  res.render("auth/resetPassword", { errors: [] })
);
router.post("/reset-password", authController.resetPassword);

// Forgot password
router.get("/forgot-password", (req, res) =>
  res.render("auth/forgotPassword", { errors: [] })
);
router.post("/forgot-password", authController.forgotPassword);

// qauth google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get("/reset-password/:id", authController.renderResetPasswordForm);
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/login" }),
  (req, res) => {
    res.redirect("/");
  }
);

module.exports = router;
