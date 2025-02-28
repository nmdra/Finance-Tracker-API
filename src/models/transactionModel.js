import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { Config } from "../models/configModel.js";
import dayjs from "dayjs";

const BASE_CURRENCY = process.env.BASE_CURRENCY;

const transactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, 'User not found'], // Custom error message
        },
        transactionId: {
            type: String,
            default: uuidv4
        },
        type: {
            type: String,
            enum: ["income", "expense"],
            required: [true, 'Transaction type is required'], // Custom error message
        },
        amount: {
            type: Number,
            required: [true, 'Transaction amount is required'], // Custom error message
            min: [0, 'Transaction amount must be a positive number'], // Custom error message
        },
        currency: { type: String, required: [true, "Currency is required."], uppercase: true }, // Currency code (e.g., "USD", "EUR")
        baseAmount: { type: Number }, // Amount converted to a base currency (e.g., USD)
        baseCurrency: { type: String, default: BASE_CURRENCY || "USD" }, // Default base currency
        category: {
            type: String,
            required: [true, 'Transaction category is required'], // Custom error message
            validate: {
                validator: async function (value) {
                    const settings = await getSystemSettings();
                    return settings.transactionCategories.includes(value);
                },
                message: (props) => `${props.value} is not a valid category.`,
            },
        },
        tags: {
            type: [String], // Example: ["#vacation", "#work"]
            default: [],
        },
        comments: {
            type: String, // Replacing description with comments
            trim: true,
            maxlength: [200, 'Comments cannot exceed 200 characters'], // Custom error message
        },
        date: {
            type: Date,
            default: Date.now,
        },
        isRecurring: {
            type: Boolean,
            default: false,
        },
        recurrence: {
            type: String,
            enum: ["daily", "weekly", "monthly", "yearly"],
            required: function () {
                return this.isRecurring; // Required if the transaction is recurring
            },
            validate: {
                validator: function (value) {
                    // Validate that recurrence is defined if isRecurring is true
                    return !this.isRecurring || value != null;
                },
                message: 'Recurrence pattern is required if the transaction is recurring', // Custom error message
            },
        },
        nextDueDate: { type: Date },
    },
    { timestamps: true }
);


const getSystemSettings = async () => {
    const settings = await Config.findOne();
    return settings || { transactionCategories: ["Other"] }; // Default category if settings are missing
};

// Auto-calculate next due date before saving
transactionSchema.pre("save", function (next) {
    if (this.isRecurring) {
        let nextDate = dayjs(this.date);

        switch (this.recurrence) {
            case "daily":
                nextDate = nextDate.add(1, "day");
                break;
            case "weekly":
                nextDate = nextDate.add(1, "week");
                break;
            case "monthly":
                nextDate = nextDate.add(1, "month");
                break;
            case "yearly":
                nextDate = nextDate.add(1, "year");
                break;
        }

        this.nextDueDate = nextDate.toDate();
    }
    next();
});

export const Transaction = mongoose.model("Transaction", transactionSchema);