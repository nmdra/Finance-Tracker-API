export const calculateEndDate = (recurrence) => {
    const currentDate = new Date();

    switch (recurrence) {
        case "daily":
            return new Date(currentDate.setDate(currentDate.getDate() + 1)); // 1 day later
        case "weekly":
            return new Date(currentDate.setDate(currentDate.getDate() + 7)); // a week later
        case "monthly":
            return new Date(currentDate.setMonth(currentDate.getMonth() + 30)); // a month later
        case "yearly":
            return new Date(currentDate.setFullYear(currentDate.getFullYear() + 365)); // 1 year later
        default:
            return null;
    }
};
