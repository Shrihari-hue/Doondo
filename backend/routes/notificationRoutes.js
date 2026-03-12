const express = require("express");
const {
  getNotifications,
  markNotificationAsRead,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.post("/:id/read", markNotificationAsRead);

module.exports = router;
