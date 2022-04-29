const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body; // 현재 로그인된 사람
  console.log(req);

  // 로그인이 안되어 있는 경우
  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } }, // 현재 로그인 한 사람 찾기
      { users: { $elemMatch: { $eq: userId } } }, // 우리가 보낸 유저 아이디를 찾는다.
    ],
  })
    .populate("users", "-password") // password document는 제외하고 찾기
    .populate("latestMessage");
  //populate 는 첫번째 인자로 들어온 값을 기준을 Schema에 정의 되어있는 ref를 참고하여 그에 해당하는 값을 찾아줍니다.

  console.log("first chat: " + isChat);

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  console.log("second chat: " + isChat);

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };
    try {
      const createChat = await Chat.create(chatData);
      console.log("createChat" + createChat);
      const FullChat = await Chat.findOne({ _id: createChat._id }).populate(
        "users",
        "-password"
      );

      res.status(200).send(FullChat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
});

module.exports = { accessChat };
