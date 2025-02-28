import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, required: true, enum: ["transaction_alert", "bill_reminder", "goal_reminder", "other"] },
        message: { type: String, required: true },
        isRead: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
