const express = require("express");
const { body } = require("express-validator");
const {
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
} = require("../controllers/chatController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validation");

const router = express.Router();

router.use(protect);

router.get("/conversations", getConversations);
router.post(
  "/conversations",
  [body("recipientId").notEmpty().withMessage("recipientId is required")],
  validate,
  createConversation
);
router.get("/:conversationId/messages", getMessages);
router.post(
  "/:conversationId/messages",
  [body("text").notEmpty().withMessage("Message is required")],
  validate,
  sendMessage
);

module.exports = router;
