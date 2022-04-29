const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please Enter all the Feilds");
  }

  const userExists = await User.findOne({ email });
  // 이메일 없으면 에러 메시지를 넘긴다.
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // 데이터 베이스에 쿼리를 보내서 새로운 필드 생성
  const user = await User.create({
    name,
    email,
    password,
    pic,
  });

  // mongoDB에서 성공적으로 생성되었다면
  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Failed to Create the User");
  }
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid Email or Password");
  }
});

// /api/user?search=suchan
// query 조건에 맞는 데이터를 찾는다.
const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  // 현재 로그인된 아이디 빼고 쿼리에 해당하는 유저 찾기
  // ne 는 not equal to 의 줄임말이다.
  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });

  res.send(users);
});

module.exports = { registerUser, authUser, allUsers };
