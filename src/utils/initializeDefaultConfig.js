import { Config } from "../models/configModel.js";

export const initializeDefaultConfig = async () => {
    const existingConfig = await Config.findOne();
    if (!existingConfig) {
        await Config.create({
            defaultCurrency: "USD",
            budgetLimit: 5000,
            transactionCategories: ["Food", "Transport", "Entertainment"]
        });
    }
};
