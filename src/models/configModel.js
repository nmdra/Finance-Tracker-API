import mongoose from 'mongoose';

const configSchema = new mongoose.Schema(
    {
        defaultCurrency: { type: String, required: true },
        budgetLimit: { type: Number, required: true },
        transactionCategories: { type: [String], required: true },
    },
    { timestamps: true }
);

export const Config = mongoose.model('Config', configSchema);
