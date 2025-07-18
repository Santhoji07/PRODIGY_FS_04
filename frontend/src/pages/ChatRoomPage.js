import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid"; // for generating room ID

const socket = io("http://localhost:5000");

function ChatRoomPage() {
  const [room, setRoom] = useState("");
  const [inRoom, setInRoom] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const username = localStorage.getItem("username");

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => socket.disconnect();
  }, []);

  const createRoom = () => {
    const newRoomId = uuidv4().slice(0, 6); // short 6-char ID
    setRoom(newRoomId);
    socket.emit("join_room", newRoomId);
    setInRoom(true);
  };

  const joinRoom = () => {
    if (room.trim() !== "") {
      socket.emit("join_room", room);
      setInRoom(true);
    }
  };

  const sendMessage = () => {
    if (message.trim() !== "") {
      const data = {
        room,
        sender: username,
        message,
      };
      socket.emit("send_message", data);
      setMessages((prev) => [...prev, { ...data, self: true }]);
      setMessage("");
    }
  };

  return (
    <div className="chat-container">
      {!inRoom ? (
        <>
          <h2>Join or Create a Room</h2>
          <input
            placeholder="Enter Room ID"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
          <button onClick={createRoom}>Create Room</button>
        </>
      ) : (
        <>
          <h3>Room ID: {room}</h3>
          <div className="messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`message ${
                  msg.sender === username || msg.self ? "self" : ""
                }`}
              >
                <strong>{msg.sender}</strong>: {msg.message}
              </div>
            ))}
          </div>
          <input
            placeholder="Type message"
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
