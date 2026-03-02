const express = require("express");
// const userController = require("../controller/userController");
const authController = require("../controller/authController");
const upload = require("../config/multer");

const router = express.Router();

// 🔓 PUBLIC ROUTES
router.post("/signup", upload.single("profileImage"), authController.signup);
router.post("/login", authController.login);
router.post(
  "/admin-login",
  // authController.restrictTo("admin"),
  authController.adminLogin
);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

// 🔐 PROTECTED ROUTES
// router.use(authController.protect);

// router.get("/me", userController.getLoginUser);
// router.patch("/updateMyPassword", authController.updatePassword);
// router.delete("/deleteMe", userController.deleteMe);
// router.patch(
//   "/updateMe",
//   upload.single("profileUrl"),
//   userController.updateUser
// );

// router
//   .route("/")
//   .post(upload.single("photo"), userController.CreateUser)
//   .get(userController.getAllUsers)
//   .delete(userController.deleteAll);

// router.route("/generate-qr").get(userController.generateDriverQRCode);
// router.route("/link-driver").post(userController.linkDriverToCompany);

// router
//   .route("/updateNotificationSettings")
//   .patch(userController.updateNotificationSettings);
// router
//   .route("/notification-settings")
//   .get(userController.getNotificationSettings);

// router
//   .route("/:id")
//   .get(userController.getUser)
//   .patch(userController.updateUser)
//   .delete(userController.deleteUser);

// router.route("/:id/link").get(userController.generateLinkCode);

// router.route("/enable-gps").post(userController.enableGps);

// router.route("/send-gps-request").post(userController.sendGpsRequest);

// .patch(userController.updateUser);

module.exports = router;
