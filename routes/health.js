import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
    req.log.info("Health endpoint accessed");
    res.status(200).json({ status: "Up" });
});

export default router;
