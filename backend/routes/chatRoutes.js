const express = require("express");
const { accessChat } = require("../controllers/chatControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(protect, accessChat); // 1:1 채팅룸을 새로 생성하거나 기존에 있던 것을 접속하거나 할때 사용
// router.route("/").get(protect, fetchChats); // 접속된 채팅방의 대화 내역을 가져올 때 사용
// router.route("/group").post(protect, createGroupChat); // 그룹채팅 생성
// router.route("/rename").put(protect, renameGroup);
// router.route("/groupremove").put(protect, removeFromGroup); // 그룹에서 강퇴
// router.route("/groupadd").put(protect, addToGroup); // 새로운 사람 그룹 챗에 초대

module.exports = router;
