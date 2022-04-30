const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

// 1대 1 채팅방 생성 및 기존 1대1 방 접속하는 컨트롤러
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body; // 우리가 보낸 유저 아이디

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

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    // 기존 메세지가 없다면 새로운 메시지 생성
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };
    try {
      const createChat = await Chat.create(chatData); // 새로 만들어진 채팅방을 데이터베이스에 집어 넣어준다.

      // 유저에게 방금생성한 채팅방 정보를 찾아서 유저에서 보낸다.
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

// 로그인한 유저의 모든 채팅방 찾아서 보내기
const fetchChats = asyncHandler(async (req, res) => {
  try {
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 }) // 가장 최근 생성된 채팅방에서 오래된 순으로 정렬
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name pic email",
        });
        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// 그룹 채딩방 생성
const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please Fill all the feilds" });
  }

  var users = JSON.parse(req.body.users); // 클라이언트 단에서 stringify 로 보낼꺼기 때문에 백엔드에서는 parse 해준다.

  // 그룹챗에 2명 이상 존재하는지 체크
  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to form a group chat");
  }

  users.push(req.user); // 현재 로그인한 사람들 중에서 그룹 채팅방에 추가됨

  try {
    // 생성된 그룹 챗을 데이터베이스에 저장
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
    });

    // 새롭게 생성된 그룹 챗 정보를 다시 생성한 유저에게 보내준다.
    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// 그룹 채딩방 이름 변경
const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  // 해당 그룹 채팅방을 찾아서 바로 업데이트 해준다.
  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName: chatName,
    },
    {
      new: true, // 새로 변경된 chatName을 반환, chatName 이름을 받지 못하면 기존의 이름을 반환
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(updatedChat);
  }
});

// 그룹 채팅방에 유저 한명 추가하기
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(added);
  }
});

// 그룹 채팅방에서 유저 한명 삭제하기
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!removed) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(removed);
  }
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
