import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        monthlyLimit: {
            type: Number,
            required: true,
            min: [0, "Budget limit must be a positive number"],
        },
        spent: {
            type: Number,
            default: 0,
            min: [0, "Spent amount cannot be negative"],
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
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
            validate: {
                validator: function (value) {
                    return this.startDate < value;
                },
                message: "End date must be after start date",
            },
        },
    },
    { timestamps: true }
);

export const Budget = mongoose.model("Budget", budgetSchema);
