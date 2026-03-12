const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Application = require("../models/Application");
const Job = require("../models/Job");
const { signToken } = require("../utils/token");
const { validatePincodeLocation } = require("../utils/pincode");
const { deleteLocalFile } = require("../utils/files");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  profilePhoto: user.profilePhoto,
  resume: user.resume,
  location: user.location,
  seekerProfile: user.seekerProfile,
  employerProfile: user.employerProfile,
  bookmarks: user.bookmarks,
  subscription: user.subscription,
});

const normalizePhone = (phone = "") => phone.replace(/\D/g, "");

const normalizeLocation = (location = {}) => ({
  city: location.city?.trim() || "",
  area: location.area?.trim() || "",
  pincode: String(location.pincode || "").trim(),
  address: location.address?.trim() || "",
  coordinates: location.coordinates || {
    type: "Point",
    coordinates: [77.5946, 12.9716],
  },
});

const buildRoleProfiles = ({ role, seekerProfile = {}, employerProfile = {} }) => {
  if (role === "seeker") {
    return {
      seekerProfile: {
        skills: (seekerProfile.skills || []).map((skill) => skill.trim()).filter(Boolean),
        preferredJobType: seekerProfile.preferredJobType || "both",
        bio: seekerProfile.bio?.trim() || "",
      },
      employerProfile: {
        businessName: "",
        businessType: "",
        contactNumber: "",
        description: "",
      },
    };
  }

  return {
    seekerProfile: {
      skills: [],
      preferredJobType: "both",
      bio: "",
    },
    employerProfile: {
      businessName: employerProfile.businessName?.trim() || "",
      businessType: employerProfile.businessType?.trim() || "",
      contactNumber: normalizePhone(employerProfile.contactNumber || ""),
      description: employerProfile.description?.trim() || "",
    },
  };
};

const normalizeProfileUpdates = ({ role, updates }) => {
  const normalized = { ...updates };

  if (normalized.name !== undefined) {
    normalized.name = normalized.name.trim();
  }

  if (normalized.phone !== undefined) {
    normalized.phone = normalizePhone(normalized.phone || "");
  }

  if (normalized.seekerProfile !== undefined && role === "seeker") {
    normalized.seekerProfile = {
      skills: (normalized.seekerProfile.skills || []).map((skill) => skill.trim()).filter(Boolean),
      preferredJobType: normalized.seekerProfile.preferredJobType || "both",
      bio: normalized.seekerProfile.bio?.trim() || "",
    };
  }

  if (normalized.employerProfile !== undefined && role === "employer") {
    normalized.employerProfile = {
      businessName: normalized.employerProfile.businessName?.trim() || "",
      businessType: normalized.employerProfile.businessType?.trim() || "",
      contactNumber: normalizePhone(normalized.employerProfile.contactNumber || ""),
      description: normalized.employerProfile.description?.trim() || "",
    };
  }

  return normalized;
};

const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      location,
      seekerProfile,
      employerProfile,
    } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const normalizedPhone = normalizePhone(phone || "");
    const normalizedLocation = normalizeLocation(location);
    const normalizedProfiles = buildRoleProfiles({
      role,
      seekerProfile,
      employerProfile,
    });
    const pincodeValidation = await validatePincodeLocation({
      pincode: normalizedLocation.pincode,
      city: normalizedLocation.city,
      area: normalizedLocation.area,
    });

    if (!pincodeValidation.isValid) {
      return res.status(400).json({
        message: pincodeValidation.message,
        locationLookup: pincodeValidation.record,
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      phone: normalizedPhone,
      location: normalizedLocation,
      ...normalizedProfiles,
    });

    return res.status(201).json({
      token: signToken(user),
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      token: signToken(user),
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let appliedJobs = [];
    let postedJobs = [];

    if (user.role === "seeker") {
      appliedJobs = await Application.find({ seeker: user._id })
        .populate("job")
        .sort({ createdAt: -1 });
    }

    if (user.role === "employer") {
      postedJobs = await Job.find({ employer: user._id }).sort({ createdAt: -1 });
    }

    return res.json({
      user: sanitizeUser(user),
      appliedJobs,
      postedJobs,
    });
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      "name",
      "phone",
      "location",
      "seekerProfile",
      "employerProfile",
    ];

    const updates = allowedFields.reduce((acc, field) => {
      if (req.body[field] !== undefined) {
        acc[field] = field === "location" ? normalizeLocation(req.body[field]) : req.body[field];
      }
      return acc;
    }, {});

    if (updates.location) {
      const pincodeValidation = await validatePincodeLocation({
        pincode: updates.location.pincode,
        city: updates.location.city,
        area: updates.location.area,
      });

      if (!pincodeValidation.isValid) {
        return res.status(400).json({
          message: pincodeValidation.message,
          locationLookup: pincodeValidation.record,
        });
      }
    }

    const normalizedUpdates = normalizeProfileUpdates({
      role: req.user.role,
      updates,
    });

    const user = await User.findByIdAndUpdate(req.user._id, normalizedUpdates, {
      new: true,
      runValidators: true,
      select: "-password",
    });

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
};

const uploadProfileAssets = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id).select("profilePhoto resume");
    const updates = {};

    if (req.user.role === "employer" && req.files?.resume?.[0]) {
      deleteLocalFile(`/uploads/resumes/${req.files.resume[0].filename}`);

      if (!req.files?.profilePhoto?.[0]) {
        return res.status(400).json({ message: "Employers can upload only a profile photo" });
      }
    }

    if (req.files?.profilePhoto?.[0]) {
      const file = req.files.profilePhoto[0];
      deleteLocalFile(currentUser?.profilePhoto?.url);
      updates.profilePhoto = {
        url: `/uploads/profile-photos/${file.filename}`,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
      };
    }

    if (req.user.role !== "employer" && req.files?.resume?.[0]) {
      const file = req.files.resume[0];
      deleteLocalFile(currentUser?.resume?.url);
      updates.resume = {
        url: `/uploads/resumes/${file.filename}`,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
      };
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
      select: "-password",
    });

    return res.json({
      message: "Files uploaded successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

const deleteProfileAsset = async (req, res, next) => {
  try {
    const assetType = req.params.assetType;
    if (!["profilePhoto", "resume"].includes(assetType)) {
      return res.status(400).json({ message: "Invalid asset type" });
    }

    const user = await User.findById(req.user._id).select("-password");
    const existingAsset = user?.[assetType];

    if (!existingAsset?.url) {
      return res.status(404).json({ message: "Asset not found" });
    }

    deleteLocalFile(existingAsset.url);
    user[assetType] = undefined;
    await user.save();

    return res.json({
      message: `${assetType === "profilePhoto" ? "Profile photo" : "Resume"} removed successfully`,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  uploadProfileAssets,
  deleteProfileAsset,
};
