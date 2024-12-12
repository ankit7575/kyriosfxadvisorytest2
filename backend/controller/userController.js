const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const crypto = require('crypto');
const path = require("path");
const fs = require("fs");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { sendEmail } = require("../utils/sendEmail");
const otpService = require("../utils/otpService");
const generatePdf = require("./generatePdf");
const sendToken = require("../utils/jwttoken");
const { v4: uuidv4 } = require('uuid'); // Import uuid for generating unique profitEntryId

const tempUserStore = {}; // Temporary storage for unverified users
const TEMP_USER_EXPIRATION = 90 * 1000; // 1.5 minutes

// Constants
const REFERRAL_PREFIX = 'REF-';
const OTP_LENGTH = 7;
const EMAIL_VERIFY_MESSAGE = "Please verify your email to complete registration.";

// Generate unique referral ID
const generateReferralId = () => `${REFERRAL_PREFIX}${Math.random().toString(36).substr(2, OTP_LENGTH).toUpperCase()}`;

// User input validation
const validateUserInput = ({ email, phone, password }) => {
  if (!validator.isEmail(email)) throw new ErrorHandler("Invalid email format", 400);
  if (!phone || phone.length < 10) return "Please enter a valid phone number.";
  if (!validator.isStrongPassword(password, { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1 })) {
    throw new ErrorHandler("Password must be at least 6 characters and contain a mix of letters and numbers", 400);
  }
};

// Automatically clear expired temporary user after 1.5 minutes
const clearExpiredTempUser = (email) => {
  setTimeout(() => {
    delete tempUserStore[email]; // Remove user after expiration
  }, TEMP_USER_EXPIRATION);
};

exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phone, password, referralId } = req.body;

  try {
    validateUserInput({ email, phone, password });
  } catch (error) {
    return next(error);
  }

  // Check if the user already exists in temporary storage
  if (tempUserStore[email]) {
    return next(new ErrorHandler("User already exists in temporary storage", 400));
  }

  // Check if the referral ID exists
  if (referralId) {
    const referringUser = await User.findOne({ referralId });
    if (!referringUser) {
      return next(new ErrorHandler("Referral ID does not exist. Registration unsuccessful.", 400));
    }
  }

  // Generate a new referral ID
  const newReferralId = generateReferralId();

  // Create a temporary user object
  const tempUser = {
    name,
    email,
    phone,
    password, // Store the raw password, which will be hashed later
    referralbyId: referralId,
    otpVerified: false,
    referralId: newReferralId,
    createdAt: Date.now(),
  };

  // Save the temporary user
  tempUserStore[email] = tempUser;

  // Automatically clean up the temporary user after 1.5 minutes
  clearExpiredTempUser(email);

  // Generate and send OTP
  const otp = otpService.generateOtp();
  await otpService.sendOtp(email, otp);

  // Generate the registration PDF
  const pdfPath = await generatePdf.generatePdf({
    name: tempUser.name,
    email: tempUser.email,
    phone: tempUser.phone,
  });

  // Send the welcome email with OTP
  await sendEmail({
    email: tempUser.email,
    subject: "Welcome to Kyrios Fx Advisory - Registration Complete",
    message: `Dear ${tempUser.name},\n\nYour registration has been successfully completed. ${EMAIL_VERIFY_MESSAGE}`,
    attachments: [{ filename: `${tempUser.name}_registration.pdf`, path: pdfPath }],
  });

  // Respond with a success message and redirect information
  res.status(201).json({
    message: "User registered successfully. Please verify your email with the OTP.",
    otpSent: true,
    redirectTo: "/verification", // Add the redirect path
  });
});

// Verify OTP and complete registration
exports.verifyOtpAndCompleteRegistration = catchAsyncErrors(async (req, res, next) => {
  const { email, otp } = req.body;

  // Validate OTP
  if (!otp) {
    return next(new ErrorHandler("OTP is required", 400));
  }

  const tempUser = tempUserStore[email];
  if (!tempUser) {
    return next(new ErrorHandler("User not found in temporary storage", 404));
  }

  // Check if OTP has expired
  if (Date.now() - tempUser.createdAt > TEMP_USER_EXPIRATION) {
    delete tempUserStore[email];
    return next(new ErrorHandler("OTP expired, please re-register.", 400));
  }

  // Verify OTP
  const isValidOtp = otpService.verifyOtp(email, otp);
  if (!isValidOtp) {
    return next(new ErrorHandler("Invalid or expired OTP", 400));
  }

  // Mark OTP as verified
  tempUser.otpVerified = true;

  // Set role based on email (admin for specific emails, else referral)
  const userRole = (email === "ankitvashist765@gmail.com" || email === "kyriosfxadvisory01@gmail.com") ? "admin" : "referral";

  // Create new user and save to the database
  const newUser = new User({
    name: tempUser.name,
    email: tempUser.email,
    phone: tempUser.phone,
    password: tempUser.password, // Raw password will be hashed later by the schema pre-save hook
    referralbyId: tempUser.referralbyId,
    referralId: tempUser.referralId,
    emailVerified: true,
    otpVerified: true,
    status: "active",
    role: userRole, // Set role based on email
  });

  await newUser.save();

  // Handle referrals and update referral history
  if (newUser.referralbyId) {
    const referringUser = await User.findOne({ referralId: newUser.referralbyId });

    if (referringUser) {
      // Add direct referral to the referring user
      referringUser.referral.directReferral.push({
        user: newUser._id,  // Save user _id
        name: newUser.name,  // Save user name
        history: [] // Removed fortnightlyProfit history
      });
      await referringUser.save();

      // Stage 2 Referral
      if (referringUser.referralbyId) {
        const level2User = await User.findOne({ referralId: referringUser.referralbyId });
        if (level2User) {
          level2User.referral.stage2Referral.push({
            user: newUser._id,  // Save user _id
            name: newUser.name,  // Save user name
            history: [] // Removed fortnightlyProfit history
          });
          await level2User.save();

          // Stage 3 Referral
          if (level2User.referralbyId) {
            const level3User = await User.findOne({ referralId: level2User.referralbyId });
            if (level3User) {
              level3User.referral.stage3Referral.push({
                user: newUser._id,  // Save user _id
                name: newUser.name,  // Save user name
                history: [] // Removed fortnightlyProfit history
              });
              await level3User.save();
            }
          }
        }
      }

      // Handle Super Referral Incentive if the referring user is a super referrer
      if (referringUser.role === "superReferral") {
        // Apply super referral incentive (example: 10% on all stages)
        newUser.superReferralIncentive = true;
        await newUser.save();
      }
    }
  }

  // Generate a token for the new user
  sendToken(newUser, 200, res, "Email verified and registration completed successfully.");

  // Remove temporary user data from the store
  delete tempUserStore[email];
});

// Refresh Token
exports.refreshToken = catchAsyncErrors(async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return next(new ErrorHandler('No refresh token provided', 401));
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new ErrorHandler('User not found', 404));

    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '1d',
    });

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    return next(new ErrorHandler('Invalid or expired refresh token', 401));
  }
});

// Login User
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler('Please enter email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.emailVerified) {
    return next(new ErrorHandler('Invalid email or password or email not verified', 401));
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler('Invalid email or password', 401));
  }

  sendToken(user, 200, res, 'Login successful');
});

// Logout User
exports.logoutUser = catchAsyncErrors(async (req, res, next) => {
  const clearCookies = (cookieName) => {
    res.cookie(cookieName, '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    });
  };

  clearCookies('refreshToken');
  clearCookies('token');

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;

  // Check if the user exists
  const user = await User.findOne({ email });
  if (!user) {
      return next(new ErrorHandler("User not found", 404));
  }

  // Generate reset token
  const resetToken = user.getResetPasswordToken();
  console.log("Generated Reset Token (unhashed):", resetToken); // Log unhashed token
  console.log("Stored Hashed Token in DB:", user.resetPasswordToken); // Log hashed token

  // Save user with reset token and expiry
  await user.save({ validateBeforeSave: false });

  // Prepare reset password URL
  const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;
  const message = `Your password reset token is:\n\n${resetPasswordUrl}\n\nIf you did not request this email, please ignore it.`;

  try {
      // Send email with reset link
      await sendEmail({
          email: user.email,
          subject: "Password Recovery",
          message,
      });

      res.status(200).json({
          success: true,
          message: `Email sent to ${user.email} successfully.`,
      });
  } catch (error) {
      // On error, clear the reset token and expiry
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new ErrorHandler(`Error sending email: ${error.message}`, 500));
  }
});

// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  // Check if token is provided
  if (!token) {
      return next(new ErrorHandler("Reset token is required", 400));
  }

  // Hash the provided token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  console.log("Provided Hashed Token:", hashedToken);

  // Find user with the hashed token and unexpired token
  const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
      return next(new ErrorHandler("Reset Password Token is invalid or has expired", 400));
  }

  // Check if passwords match
  if (password !== confirmPassword) {
      return next(new ErrorHandler("Passwords do not match", 400));
  }

  // Update user's password
  user.password = password; // Assuming password hashing is handled in a pre-save hook
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  // Save updated user
  await user.save();

  res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
  });
});


// Update User Password
exports.updateUserPassword = catchAsyncErrors(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ErrorHandler('Please provide both current and new passwords', 400));
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user) return next(new ErrorHandler('User not found', 404));

  const isPasswordMatched = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler('Current password is incorrect', 401));
  }

  if (newPassword.length < 6) {
    return next(new ErrorHandler('New password must be at least 6 characters long', 400));
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  sendToken(user, 200, res, 'Password updated successfully');
});

// Update User Profile
exports.updateUserProfile = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phone } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) return next(new ErrorHandler('User not found', 404));

  if (email && email.toLowerCase().trim() !== user.email) {
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) return next(new ErrorHandler('Email is already in use by another account.', 400));
    user.email = email.toLowerCase().trim();
  }

  user.name = name || user.name;
  user.phone = phone || user.phone;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: { name: user.name, email: user.email, phone: user.phone },
  });
});

// Get User Details
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) return next(new ErrorHandler('User not found', 404));

  res.status(200).json({
    success: true,
    user,
  });
});

// Admin: Get All Users with Pagination
exports.getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', ...filters } = req.query;
  const users = await User.find(filters, '-password')
    .sort({ [sort]: order === 'asc' ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const totalUsers = await User.countDocuments(filters);
  res.status(200).json({
    success: true,
    page: parseInt(page),
    totalPages: Math.ceil(totalUsers / limit),
    totalUsers,
    users,
  });
});

// Admin: Get Single User
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return next(new ErrorHandler('User not found', 404));

  res.status(200).json({
    success: true,
    user,
  });
});

// Admin: Update User Role
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.body;
  const allowedRoles = ['admin', 'trader', 'referral'];

  if (!allowedRoles.includes(role)) {
    return next(new ErrorHandler(`Role must be one of the following: ${allowedRoles.join(', ')}`, 400));
  }

  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorHandler('User not found', 404));

  user.role = role;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User role updated successfully',
    user,
  });
});

// Admin: Delete User
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorHandler('User not found', 404));

  await user.remove();
  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

// Update User Status
exports.updateUserStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'inactive'].includes(status)) {
    return next(new ErrorHandler("Invalid status. Status must be 'active' or 'inactive'.", 400));
  }

  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler('User not found', 404));

  user.status = status;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User status updated to ${status}.`,
  });
});