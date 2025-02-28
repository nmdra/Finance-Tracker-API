import express from "express";
import { StatusCodes } from "http-status-codes";

const router = express.Router();

router.get("/", (req, res) => {
    req.log.info("Health endpoint accessed");
    res.status(StatusCodes.OK).json({ status: "Up" });
});

export default router;
