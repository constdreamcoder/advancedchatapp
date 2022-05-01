const express = require("express");
const dotenv = require("dotenv");
const { chats } = require("./data/data");
const connectDB = require("./config/db");
const colors = require("colors");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");

const app = express(); // express 인스턴스
dotenv.config();
connectDB();

// 클라이언트로부터 받은 파일을 json 파일로 받는다는 의미
app.use(express.json());

// app.get("/", (req, res) => {
//   res.send("API is running Successfully.");
// });

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// --------------------------deployment------------------------------

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running Successfully.");
  });
}

// --------------------------deployment------------------------------

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// import socket.io
const server = app.listen(
  5000,
  console.log(`Server Started on PORT ${PORT}`.yellow.bold)
);

const io = require("socket.io")(server, {
  pinTimeout: 60000, // cut the link between client and server if the client does not answer within this pingTime
  //  cross origin error to prevent errors while building socket.io server
  cors: {
    origin: "http://localhost:3000",
  },
});

// default namespace에 연결
io.on("connection", (socket) => {
  // 소켓이 연결될 때마다 자신만의 소켓을 갖는다.
  console.log("connected to socket.io");

  // 방 만들기(room)
  socket.on("setup", (userData) => {
    socket.join(userData._id); // 로그인 한 유저의 정보를 가지고 room 조인(생성??)
    // console.log(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;
    // 채팅방에 아무도 없으면 그냥 리턴
    if (!chat.users) return console.log("chat users not defined");

    // 나를 제외한 채팅방에 있는 모두에게 메세지를 보낸다.
    chat.users.forEach((user) => {
      if (user._id === newMessageRecieved.sender._id) return;

      socket.to(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});
