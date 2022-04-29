const mongoose = require("mongoose");

const chatModel = mongoose.Schema(
  {
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId, // userId
      ref: "User",
    },
  },
  {
    timestamps: true, // createdAt, updatedAt 필드를 자동 생성합니다.
  }
);

// chatName
// isGroupChat
// users
// latestMessage
// groupAdmin

const Chat = mongoose.model("Chat", chatModel);

module.exports = Chat;
