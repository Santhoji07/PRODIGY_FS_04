import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";


const socket = io("http://localhost:5000");

function ChatRoomPage() {
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const username = localStorage.getItem("username");
  const navigate = useNavigate();

  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      if (data.roomId === roomId) {
        const isSelf = data.username === username;
        setMessages((prev) => [...prev, { ...data, self: isSelf }]);
      }
    });

    socket.on("roomNotFound", () => {
      alert("Room does not exist!");
      setJoined(false);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("roomNotFound");
    };
  }, [roomId, username]);

  const createRoom = () => {
    const newRoom = uuidv4().slice(0, 6);
    setRoomId(newRoom);
    socket.emit("createRoom", { username, roomId: newRoom });
    setJoined(true);
  };

  const joinRoom = () => {
    if (!roomId.trim()) return alert("Enter a room ID");
    socket.emit("joinRoom", { username, roomId });
  };

  socket.on("roomJoined", (roomData) => {
    setJoined(true);
    setRoomId(roomData.roomId);
  });

  const sendMessage = () => {
    if (!message.trim()) return;
    const messageData = {
      username,
      roomId,
      message,
    };
    socket.emit("sendMessage", messageData);
    setMessages((prev) => [...prev, { ...messageData, self: true }]);
    setMessage("");
  };

  const handleExit = () => {
    socket.emit("leaveRoom", { roomId });
    setJoined(false);
    setRoomId("");
    setMessages([]);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };
  useEffect(() => {
  socket.on("receiveMessage", (data) => {
    const isSelf = data.senderId === socket.id;
    setMessages((prev) => [...prev, { ...data, self: isSelf }]);
  });

  socket.on("roomNotFound", () => {
    alert("Room does not exist!");
    setJoined(false);
  });

  return () => {
    socket.off("receiveMessage");
    socket.off("roomNotFound");
  };
}, []);


  return (
    <div className="chat-container">
      {!joined ? (
        <>
          <h2>Join or Create a Chat Room</h2>
          <input
            className="input"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <div className="btn-group">
            <button onClick={joinRoom}>Join Room</button>
            <button onClick={createRoom}>Create Room</button>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </>
      ) : (
        <>
          <div className="room-header">
            <h3>Room: {roomId}</h3>
            <button onClick={handleExit}>Exit Room</button>
          </div>
          <div className="messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`message ${msg.self ? "self" : "other"}`}
              >
                <strong style={{ color: "white" }}>{msg.username}:</strong>{" "}
                <span style={{ color: msg.self ? "green" : "white" }}>{msg.message}</span>
              </div>
            ))}
          </div>
          <input
            className="input"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>
        </>
      )}
    </div>
  );
}

export default ChatRoomPage;
