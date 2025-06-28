import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const v_User_Schema = new mongoose.Schema({
  // Custom ID format (as per your previous requirement)
  userId: {
    type: String,
    default: () => {
      const date = new Date();
      const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
      const randomStr = Math.random().toString(36).substring(2, 10);
      return `vop-${dateStr}-${randomStr}`;
    },
    unique: true,
  },

  // Form fields
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },

  country: {
    type: String,
    required: [true, "Country is required"],
    uppercase: true,
  },

  countryCode: {
    type: String,
    required: [true, "Country code is required"],
    validate: {
      validator: function (v) {
        return /^\+\d{1,3}$/.test(v); // Validates + followed by 1-3 digits
      },
      message: "Invalid country code format",
    },
  },

  phone: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        const digits = v.replace(/\D/g, "");
        return digits.length >= 8 && digits.length <= 15; // More flexible length
      },
      message: "Phone must be 8-15 digits long",
    },
  },

  fullPhone: {
    // Virtual for formatted display
    type: String,
    default: function () {
      return `${this.countryCode}-${this.phone.replace(/\D/g, "")}`;
    },
  },

  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: "Invalid email format",
    },
  },

  password: {
    type: String,
    required: true,
    select: false, // Never return password in queries
    minlength: [10, "Password must be at least 10 characters"],
    validate: {
      validator: function (v) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@*])/.test(v);
      },
      message:
        "Password must contain uppercase, lowercase, number, and special character",
    },
  },

  photo: {
    type: String, // Stores file path
    required: [true, "Photo is required"],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  cloudinaryURL: {
    type: String,
    required: true,
  },
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
    default: null,
  },

  lastUpdatedAt: {
    type: Date,
    default: null,
  },

  lastUpdatedIP: {
    type: String,
    default: null,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  loginStatus: {
    type: String,
    enum: ["on", "off"],
    default: "off",
  },
  sessionId: {
    type: String,
    default: null,
  },
});

// Middleware to clean phone numbers before saving
v_User_Schema.pre("save", function (next) {
  if (this.phone) {
    // Remove all non-digits from local phone number
    this.phone = this.phone.replace(/\D/g, "");
  }
  next();
});

// Add this pre-save hook to your schema
v_User_Schema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// for api to accept correct password.

v_User_Schema
  .virtual("rawPassword")
  .set(function (value) {
    this._rawPassword = value;
  })
  .get(function () {
    return this._rawPassword;
  });

// pre('validate') using rawPassword
v_User_Schema.pre("validate", function (next) {
  if (this.isNew || this.isModified("password")) {
    const passwordToValidate = this.rawPassword || this.password;

    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@*])/.test(passwordToValidate)
    ) {
      this.invalidate(
        "password",
        "Password must contain uppercase, lowercase, number, and special character"
      );
    }
  }
  next();
});

//v_User_Schema.index({ email: 1 }, { unique: true });
//v_User_Schema.index({ userId: 1 }, { unique: true });

export const user =
  mongoose.models.lec18_auth || mongoose.model("lec18_auth", v_User_Schema);
