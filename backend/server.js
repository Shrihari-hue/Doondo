require("dotenv").config();

const http = require("http");
const path = require("path");
const cors = require("cors");
const express = require("express");
const morgan = require("morgan");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const employerRoutes = require("./routes/employerRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const chatRoutes = require("./routes/chatRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const locationRoutes = require("./routes/locationRoutes");
const errorHandler = require("./middleware/errorHandler");

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

app.set("io", io);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "doondo-api" });
});

app.use("/api", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/employer", employerRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/location", locationRoutes);

io.on("connection", (socket) => {
  socket.on("user:join", (userId) => {
    socket.join(String(userId));
  });

  socket.on("conversation:join", (conversationId) => {
    socket.join(String(conversationId));
  });
});

app.use(errorHandler);

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
