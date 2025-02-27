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
            trim: true,
        },
        targetAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        savedAmount: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
            validate: {
                validator: function (value) {
                    return typeof value === "number" && !isNaN(value);
                },
                message: "Saved amount must be a valid number.",
            },
        },
        currency: {
            type: String,
            required: true,
        },
        baseAmount: {
            type: Number,
            required: true,
        },
        baseCurrency: {
            type: String,
            default: process.env.BASE_CURRENCY,
        },
        deadline: {
            type: Date,
        },
        isCompleted: {
            type: Boolean,
            default: false,
        },
        allocationCategories: {
            type: [String], // List of transaction categories that can allocate funds to this goal
            default: [],
        },
        allocationPercentage: {
            type: Number, // Percentage of income transactions to allocate (e.g., 10% of salary)
            default: 0,
            min: 0,
            max: 100,
        },
    },
    { timestamps: true }
);

export const Goal = mongoose.model("Goal", goalSchema);
