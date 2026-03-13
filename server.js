const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const app = require("./app");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config({ path: path.join(__dirname, "config.env") });

// const server = http.createServer(app);

// 1. Create HTTP server
const server = http.createServer(app);

// 2. Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:8080",
      "http://3.9.169.85:8080",
      "http://3.8.121.196:3000",
      "http://34.224.66.215/,",
    ],
    credentials: true,
  },
});

// ✅ Map to track userId -> socketId
const connectedUsers = new Map();

// 3. Connect to MongoDB
mongoose
  .connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("✅ DB connection successful");

    // Make sure index is created before starting the server

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`🚀 App running on port ${PORT}`);
    });

    // startExpiryReminderCron();
  })
  .catch((err) => {
    console.error("❌ DB connection error:", err);
  });

// 6. Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // ✅ User online
  socket.on("userOnline", async (userId) => {
    console.log("user", userId);
    if (!userId) return;

    try {
      // console.log("✅ userOnline received:", userId);
      await User.findByIdAndUpdate(userId, { isOnline: true });
      connectedUsers.set(userId, socket.id);
      io.emit("updateUserStatus", { userId, isOnline: true });
    } catch (err) {
      console.error("❌ Error setting user online:", err);
    }
  });

  // ✅ Real-time message delivery
  socket.on("sendMessage", (data) => {
    const receiverSocketId = connectedUsers.get(data.receiver);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", data);
    }

    // Optional: also emit to sender for confirmation
    socket.emit("receiveMessage", data);
  });
  // ✅ User disconnects
  socket.on("disconnect", async () => {
    const userId = [...connectedUsers.entries()].find(
      ([, sid]) => sid === socket.id,
    )?.[0];

    if (userId) {
      try {
        await User.findByIdAndUpdate(userId, { isOnline: false });
        connectedUsers.delete(userId);
        io.emit("updateUserStatus", { userId, isOnline: false });
      } catch (err) {
        console.error("❌ Error setting user offline:", err);
      }
    }

    console.log("❌ User disconnected:", socket.id);
  });
});
