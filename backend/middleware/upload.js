const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadRoot = path.join(__dirname, "..", "uploads");
const profilePhotoDir = path.join(uploadRoot, "profile-photos");
const resumeDir = path.join(uploadRoot, "resumes");

[uploadRoot, profilePhotoDir, resumeDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "profilePhoto") {
      cb(null, profilePhotoDir);
      return;
    }

    cb(null, resumeDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .slice(0, 50);
    cb(null, `${req.user._id}-${file.fieldname}-${Date.now()}-${base}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "profilePhoto") {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
    return;
  }

  if (file.fieldname === "resume") {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    cb(null, allowed.includes(file.mimetype));
    return;
  }

  cb(null, false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;
