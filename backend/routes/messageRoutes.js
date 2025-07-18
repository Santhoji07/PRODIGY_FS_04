const express = require("express");
const Message = require("../models/Message");
const auth = require("../middleware/auth");
const router = express.Router();

router.post("/", auth, async (req, res) => {
    const { message, room } = req.body;
    const newMsg = new Message({
        sender: req.user.id,
        room,
        message
    });
    await newMsg.save();
    res.json(newMsg);
});

router.get("/:room", auth, async (req, res) => {
    const messages = await Message.find({ room: req.params.room }).populate("sender", "username");
    res.json(messages);
});

module.exports = router;
