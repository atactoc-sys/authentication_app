const bcrypt = require("bcryptjs");
const passport = require("passport");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const crypto = require("crypto");

// token generator
function generateToken() {
  return crypto.randomBytes(20).toString("hex");
}

// registration form action`
exports.register = async (req, res) => {
  const { name, email, password, password2 } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (password !== password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  if (password.length < 6) {
    errors.push({ msg: "Password must be at least 6 characters" });
  }

  if (errors.length > 0) {
    return res.render("auth/signup", {
      errors,
      name,
      email,
      password,
      password2,
    });
  }

  try {
    const user = await User.findOne({ email });
    if (user) {
      errors.push({ msg: "Email already exists" });
      return res.render("auth/signup", {
        errors,
        name,
        email,
        password,
        password2,
      });
    }

    const newUser = new User({ name, email, password });
    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);
    await newUser.save();
    req.flash("success", "You are now registered and can log in");
    res.redirect("/auth/login");
  } catch (err) {
    console.error(err);
    res.render("auth/signup", {
      errors: [{ msg: "Something went wrong, please try again" }],
      name,
      email,
      password,
      password2,
    });
  }
};

// login form action
exports.login = (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/auth/login",
    failureFlash: true,
  })(req, res, next);
};

// logout action
exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "You are logged out");
    res.redirect("/auth/login");
  });
};

// reset password with email action
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash("error", "No user with that email");
      return res.redirect("/auth/forgot-password");
    }
    const token = generateToken();
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 600000; // 10minuits
    await user.save();

    const resetURL = `http://localhost:3000/auth/reset-password/${token}`;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Link",
      text:
        `You are receiving this email as you requested to reset your password. If you did not request a password reset for your account. Please ignore this email.\n\n` +
        `Or else, please click on the following link, or paste this into your browser to complete the process of resetting your password. Please note that this link will expire in 10 minutes.\n\n` +
        `${resetURL}\n\n`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        req.flash(
          "error",
          "Error sending password reset link, please try again"
        );
        return res.redirect("/auth/forgot-password");
      } else {
        console.log("Email sent: " + info.response);
        req.flash("success", "Password reset link has been sent to your email");
        res.redirect("/auth/forgot-password");
      }
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong, please try again");
    res.redirect("/auth/forgot-password");
  }
};

// Render Reset Password Form
exports.renderResetPasswordForm = async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash(
        "error",
        "Invalid or expired password reset token, please try again"
      );
      return res.redirect("/auth/forgot-password");
    }

    res.render("auth/resetPassword", { token });
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong, please try again");
    res.redirect("/auth/forgot-password");
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, password2 } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash(
        "error",
        "Invalid or expired password reset token, please try again"
      );
      return res.redirect("/auth/forgot-password");
    }

    if (password !== password2 || password.length < 6) {
      req.flash("error", "Invalid password format or passwords do not match");
      return res.redirect(`/auth/reset-password/${token}`);
    }

    // Update user's password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    req.flash("success", "Password reset successfully");
    res.redirect("/auth/login");
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong, please try again");
    res.redirect(`/auth/reset-password/${token}`);
  }
};

// change password action
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user._id;

  let errors = [];

  if (!currentPassword || !newPassword || !confirmPassword) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (newPassword !== confirmPassword) {
    errors.push({ msg: "New passwords do not match" });
  }

  if (newPassword.length < 6) {
    errors.push({ msg: "New password must be at least 6 characters" });
  }

  if (errors.length > 0) {
    return res.render("auth/changePassword", { errors });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/auth/change-password");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      req.flash("error", "Current password is incorrect");
      return res.redirect("/auth/change-password");
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    req.flash("success", "Password changed successfully");
    res.redirect("/");
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong, please try again");
    res.redirect("/auth/change-password");
  }
};
