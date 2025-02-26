import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        targetAmount: {
            type: Number,
            required: true,
            min: [0, "Target amount must be a positive number"],
        },
        savedAmount: {
            type: Number,
            default: 0,
            min: [0, "Saved amount cannot be negative"],
        },
        currency: {
            type: String,
            required: true,
        },
        baseAmount: {
            type: Number,
        },
        baseCurrency: {
            type: String,
            default: process.env.BASE_CURRENCY,
        },
        deadline: {
            type: Date,
            required: false,
        },
        isCompleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export const Goal = mongoose.model("Goal", goalSchema);
