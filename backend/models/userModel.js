const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const { Schema } = mongoose;

// Helper function to generate a 7-character referral ID
const generateReferralId = () => {
  return `REF-${Math.random().toString(36).substr(2, 7).toUpperCase()}`; // Generates a 7-character referral ID
};

// User schema definition
const userSchema = new Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  name: { 
    type: String, 
    required: true, 
    trim: true,
    maxLength: [100, 'Name cannot be longer than 100 characters'],
    minLength: [3, 'Name must be at least 3 characters long']
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true,
    validate: {
      validator: function(v) {
        return validator.isEmail(v); // Use validator to check if email is valid
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  emailVerified: { 
    type: Boolean, 
    default: false
  },
  phone: { 
    type: String, 
    required: true, 
    trim: true, 
  },
  password: { 
    type: String, 
    required: true, 
    minLength: [6, 'Password must be at least 6 characters long'],
  },
  referralId: { 
    type: String, 
    unique: true, 
    default: generateReferralId,  // Automatically generates a 7-character referral ID
    trim: true, 
    minLength: [7, 'Referral ID must be at least 7 characters long']
  },
  referralbyId: { 
    type: String, 
    default: null, 
    trim: true 
  },
  otpVerified: { 
    type: Boolean, 
    default: false 
  },

  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Number,
  },
  payoutRequests: [{
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: function(v) {
          return v > 0; // Payout amount must be positive
        },
        message: 'Payout amount must be greater than 0',
      },
      validate: {
        validator: function(v) {
          // Ensure that the payout request does not exceed the total incentive amount
          return v <= this.totalIncentive;
        },
        message: 'Payout amount exceeds available incentive balance',
      },
    },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    },
    createdAt: { type: Date, default: Date.now },
  }],
  superReferral: {
    isSuperReferral: { type: Boolean, default: false },
    superReferralRequests: [{
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      createdAt: { type: Date, default: Date.now },
    }],
  },
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active',  // Default account status is 'active'
    set: function(value) {
      if (this.role === 'admin') {
        return value; // Admin can modify the account status
      }
      return this.accountStatus; // Users cannot modify this field
    }
  },
  role: {
    type: String,
    enum: ['admin', 'referral', 'trader'],
    default: 'referral',
  },
  referral: {
    directReferral: [{
      user: { type: String, required: true }, // Store user name directly
      name:{ type: String, required: false },
      history: [{
        fortnightlyProfit: [{
          history: [{
            date: { type: Date, required: true },
            fortnightlyProfit: { type: Number, required: true },
            directIncentive: { type: Number, required: true },
            profitEntryId: { type: String, default: uuidv4 } // Added profitEntryId
          }]
        }],
        createdAt: { type: Date, required: true }
      }]
    }],
    stage2Referral: [{
      user: { type: String, required: true }, // Store user name directly
      name:{ type: String, required: false },
      history: [{
        fortnightlyProfit: [{
          history: [{
            date: { type: Date, required: true },
            fortnightlyProfit: { type: Number, required: true },
            stage2Incentive: { type: Number, required: true },
            profitEntryId: { type: String, default: uuidv4 } // Added profitEntryId
          }]
        }],
        createdAt: { type: Date, required: true }
      }]
    }],
    stage3Referral: [{
      user: { type: String, required: true }, // Store user name directly
      name:{ type: String, required: false },
      history: [{
        fortnightlyProfit: [{
          history: [{
            date: { type: Date, required: true },
            fortnightlyProfit: { type: Number, required: true },
            stage3Incentive: { type: Number, required: true },
            profitEntryId: { type: String, default: uuidv4 } // Added profitEntryId
          }]
        }],
        createdAt: { type: Date, required: true }
      }]
    }]
  },
  fortnightlyProfit: [{
    history: [{
      profitEntryId: { type: String, default: uuidv4 }, // Added profitEntryId
      date: { type: Date, required: true },
      fortnightlyProfit: { type: Number, required: true }
    }]
  }],
  profile: {
    dob: { 
      type: Date 
    },
    country: { 
      type: String, 
      trim: true 
    },
    mt5Id: { 
      type: String, 
      unique: true, 
      sparse: true, 
      trim: true 
    },
    brokerName: { 
      type: String, 
      trim: true 
    },
    plan: { 
      type: String, 
      enum: ['plana', 'planb', 'planc'],
      default: null // Set a default plan
    },
    capital: { 
      type: Number,
      default: 0,
    },
  },
  verification: {
    adminVerified: { 
      type: Boolean, 
      default: false 
    },
    verificationStatus: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    },
  },

  role: {
    type: String,
    enum: ['admin', 'referral', 'trader'],
    default: 'referral',
  },

  passwordResetToken: String,  
  passwordResetExpires: Date,  
});

// Modify incentives to include SuperReferral logic
userSchema.methods.calculateReferralIncentives = function (profit) {
  let directIncentive = profit * 0.15; // 15% for direct referrals
  let stage2Incentive = profit * 0.075; // 7.5% for stage2 referrals
  let stage3Incentive = profit * 0.075; // 7.5% for stage3 referrals

  if (this.superReferral) {
    // If the user is a SuperReferral, increase all incentives by 10%
    directIncentive *= 1.10;
    stage2Incentive *= 1.10;
    stage3Incentive *= 1.10;
  }

  return {
    directIncentive,
    stage2Incentive,
    stage3Incentive
  };
};

// User registration logic (make sure password is hashed)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
      return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare Password
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// JWT generation method on User schema
userSchema.methods.getJWTToken = function () {
  const token = jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
  return token;
};

// Method to add referrals with SuperReferral logic
userSchema.methods.addReferral = async function (referralUser) {
  if (referralUser) {
    const referralIncentives = this.calculateReferralIncentives(referralUser.fortnightlyProfit);

    // Direct Referral
    const directReferralExists = this.referral.directReferral.some(ref => ref.user.toString() === referralUser._id.toString());
    if (!directReferralExists) {
      this.referral.directReferral.push({
        user: referralUser._id, 
        name: referralUser.name, 
        history: [{
          fortnightlyProfit: [{
            date: new Date(),
            fortnightlyProfit: referralUser.fortnightlyProfit,
            directIncentive: referralIncentives.directIncentive,
            profitEntryId: uuidv4(),
          }]
        }]
      });
    }

    // Stage 2 Referral
    const stage2ReferralExists = referralUser.referral.directReferral.some(ref => ref.user.toString() === this._id.toString());
    if (!stage2ReferralExists) {
      referralUser.referral.stage2Referral.push({
        user: this._id, 
        name: this.name, 
        history: [{
          fortnightlyProfit: [{
            date: new Date(),
            fortnightlyProfit: referralUser.fortnightlyProfit,
            stage2Incentive: referralIncentives.stage2Incentive,
            profitEntryId: uuidv4(),
          }]
        }]
      });
    }

    // Stage 3 Referral
    const stage3ReferralExists = referralUser.referral.stage2Referral.some(ref => ref.user.toString() === this._id.toString());
    if (!stage3ReferralExists) {
      referralUser.referral.stage3Referral.push({
        user: this._id, 
        name: this.name, 
        history: [{
          fortnightlyProfit: [{
            date: new Date(),
            fortnightlyProfit: referralUser.fortnightlyProfit,
            stage3Incentive: referralIncentives.stage3Incentive,
            profitEntryId: uuidv4(),
          }]
        }]
      });
    }

    await this.save();  // Ensure the user is saved after adding the referral
  }
};

// Generating Password Reset Token
userSchema.methods.getResetPasswordToken = function () {
  // Generating Token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hashing and adding resetPasswordToken to userSchema
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

// Export the User model
const User = mongoose.model("User", userSchema);
module.exports = User;
