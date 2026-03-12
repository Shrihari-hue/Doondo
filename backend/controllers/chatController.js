const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");

const createConversation = async (req, res, next) => {
  try {
    const { recipientId, jobId } = req.body;

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] },
      job: jobId || null,
    }).populate("participants", "name role employerProfile");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, recipientId],
        job: jobId || undefined,
      });
      conversation = await conversation.populate("participants", "name role employerProfile");
    }

    return res.status(201).json(conversation);
  } catch (error) {
    return next(error);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "name role employerProfile")
      .populate("job", "title companyName")
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    return res.json(conversations);
  } catch (error) {
    return next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .populate("sender", "name role")
      .sort({ createdAt: 1 });

    return res.json(messages);
  } catch (error) {
    return next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text: req.body.text,
      readBy: [req.user._id],
    });

    conversation.lastMessage = req.body.text;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const recipientIds = conversation.participants.filter(
      (participant) => String(participant) !== String(req.user._id)
    );

    if (recipientIds.length) {
      const notification = await Notification.create({
        user: recipientIds[0],
        title: "New message",
        message: req.body.text,
        type: "chat",
        metadata: { conversationId: conversation._id },
      });

      const io = req.app.get("io");
      io.to(String(conversation._id)).emit("chat:message", message);
      io.to(String(recipientIds[0])).emit("notification:new", notification);
    }

    const populatedMessage = await message.populate("sender", "name role");
    return res.status(201).json(populatedMessage);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
};
