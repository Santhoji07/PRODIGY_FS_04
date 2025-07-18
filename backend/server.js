const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all for dev
    methods: ["GET", "POST"],
  },
});

const rooms = {};
const socketUsernames = {}; // NEW: socket.id → username

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("createRoom", ({ username, roomId }) => {
    rooms[roomId] = rooms[roomId] || [];
    rooms[roomId].push(socket.id);
    socket.join(roomId);
    socketUsernames[socket.id] = username;
    socket.emit("roomJoined", { roomId });
  });

  socket.on("joinRoom", ({ username, roomId }) => {
    if (!rooms[roomId]) {
      socket.emit("roomNotFound");
      return;
    }
    rooms[roomId].push(socket.id);
    socket.join(roomId);
    socketUsernames[socket.id] = username;
    socket.emit("roomJoined", { roomId });
  });

  socket.on("sendMessage", ({ message, roomId }) => {
    const username = socketUsernames[socket.id];
    io.to(roomId).emit("receiveMessage", {
      username,
      message,
      roomId,
      senderId: socket.id,
    });
  });

  socket.on("leaveRoom", ({ roomId }) => {
    socket.leave(roomId);
    if (rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      if (rooms[roomId].length === 0) delete rooms[roomId];
    }
    delete socketUsernames[socket.id];
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    Object.keys(rooms).forEach((roomId) => {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      if (rooms[roomId].length === 0) delete rooms[roomId];
    });
    delete socketUsernames[socket.id];
  });
});

server.listen(5000, () => {
  console.log("Server listening on port 5000");
});
