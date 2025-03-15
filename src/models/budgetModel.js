import mongoose from 'mongoose';
import { Config } from '../models/configModel.js';

const budgetSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: false,
            default: 'Other',
        },
        category: {
            type: String,
            validate: {
                validator: async function (value) {
                    const settings = await getSystemSettings();
                    return settings.transactionCategories.includes(value);
                },
                message: (props) => `${props.value} is not a valid category.`,
            },
            default: 'Other',
        },
        monthlyLimit: {
            type: Number,
            required: true,
            min: [0, 'Budget limit must be a positive number'],
        },
        spent: {
            type: Number,
            default: 0,
            min: [0, 'Spent amount cannot be negative'],
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
                message: 'End date must be after start date',
            },
        },
    },
    { timestamps: true }
);

const getSystemSettings = async () => {
    const settings = await Config.findOne();
    return settings || { transactionCategories: ['Other'] }; // Default category if settings are missing
};

export const Budget = mongoose.model('Budget', budgetSchema);
