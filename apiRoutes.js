import express from "express";
import upload from "../middlewares/multerConfig.js";
import {
  apiRegisterUser,
  apiGetAllUsers,
  apiGetUserById,
  apiUpdateUser,
  apiDeleteUser,
  apiRevokeUser,
} from "../controllers/apiController.js";
import { verifyJWT } from "../middlewares/verifyJWT.js";
import { apiLoginUser } from "../controllers/apiLoginController.js";
import { refreshAccessToken } from "../controllers/tokenController.js";
import { logoutUserAPI } from "../controllers/tokenController.js";

const router = express.Router();

//POST api register
router.post("/register", upload.single("photo"), apiRegisterUser);

// ✅ GET endpoints - all user
router.get("/allusers", verifyJWT, apiGetAllUsers);

// ✅ GET endpoints - by userid
router.get("/userid/:id", verifyJWT, apiGetUserById);

//✅ Goal: PUT /api/update/:userId
router.put("/update/:userId", verifyJWT, apiUpdateUser);
//✅ Deleted: Delete /api/delete/:userId
router.delete("/delete/:userId", verifyJWT, apiDeleteUser);

// PATCH
router.patch("/revoke/:userId", verifyJWT, apiRevokeUser);

router.post("/login", apiLoginUser); // this is your Postman API login route

router.post("/logout", logoutUserAPI);

router.post("/refresh-token", refreshAccessToken);

export default router;
