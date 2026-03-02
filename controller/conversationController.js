const { default: mongoose } = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Conversation = require("../models/converstionModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// ✅ Get all conversations for the logged-in user
exports.getUserConversations = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const conversations = await Conversation.find({
    participants: userId,
  })
    .populate("participants", "name email")
    .populate("productId", "title price")
    .populate("orderId", "orderStatus totalAmount")
    .sort({ updatedAt: -1 });

  res.status(200).json({
    status: "success",
    results: conversations.length,
    data: { conversations },
  });
});

// ✅ Get single conversation (chat history)
exports.getConversation = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const conversation = await Conversation.findById(id)
    .populate("participants", "name email")
    .populate("messages.sender", "name email");

  if (!conversation) {
    return next(new AppError("No conversation found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { conversation },
  });
});

// ✅ Send a new message (create conversation if doesn’t exist)
exports.sendMessage = catchAsync(async (req, res, next) => {
  let { receiverId, content, productId, orderId, attachments } = req.body;
  if (req.files && req.files.length > 0) {
    attachments = req.files.map((file) => file.path);
  }
  const senderId = req.user._id;

  // Find or create conversation
  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, receiverId] },
    ...(productId ? { productId } : {}),
    ...(orderId ? { orderId } : {}),
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [senderId, receiverId],
      productId: productId || null,
      orderId: orderId || null,
      messages: [],
      attachments: [],
    });
  }

  // Push new message
  const newMessage = {
    sender: senderId,
    content,
    attachments: attachments || [],
  };

  conversation.messages.push(newMessage);
  conversation.updatedAt = Date.now();
  await conversation.save();

  res.status(201).json({
    status: "success",
    data: { conversation },
  });
});

// ✅ Mark messages as read
exports.markMessagesAsRead = catchAsync(async (req, res, next) => {
  const { id } = req.params; // conversation ID
  const userId = req.user._id;

  const conversation = await Conversation.findById(id);

  if (!conversation) {
    return next(new AppError("Conversation not found", 404));
  }

  conversation.messages.forEach((msg) => {
    if (String(msg.sender) !== String(userId)) {
      msg.isRead = true;
    }
  });

  await conversation.save();

  res.status(200).json({
    status: "success",
    message: "Messages marked as read",
  });
});

// ✅ Get all messages between two users
exports.getMessagesBetweenUsers = catchAsync(async (req, res, next) => {
  const { sender, receiver } = req.params;

  // Find the conversation between the two users
  const conversation = await Conversation.findOne({
    participants: { $all: [sender, receiver] },
  }).populate("messages.sender", "name email");

  if (!conversation) {
    return next(new AppError("No conversation found between these users", 404));
  }

  res.status(200).json({
    status: "success",
    results: conversation.messages.length,
    data: { messages: conversation.messages },
  });
});

exports.getUnreadMessagesCount = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId || !ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid or missing userId" });
    }

    const objectUserId = new ObjectId(userId);

    const counts = await Conversation.aggregate([
      { $unwind: "$messages" }, // Flatten messages array
      {
        $match: {
          "messages.isRead": false,
          participants: new ObjectId(userId),
          "messages.sender": { $ne: new ObjectId(userId) },
        },
      },
      {
        $group: {
          _id: "$messages.sender",
          count: { $sum: 1 },
        },
      },
    ]);

    console.log("Unread counts:", counts);
    const unreadMap = {};
    counts.forEach((c) => {
      unreadMap[c._id.toString()] = c.count;
    });

    res.json({ unreadCounts: unreadMap });
  } catch (error) {
    console.error("Error in getUnreadMessagesCount:", error);
    res.status(500).json({ error: "Server error" });
  }
};
