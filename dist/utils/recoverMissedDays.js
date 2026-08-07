"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recoverMissedDays = void 0;
const runSync_1 = require("./runSync");
const moment_1 = __importDefault(require("moment"));
/**
 * Recover attendance for missed days.
 * OT-safe: never processes today
 */
const recoverMissedDays = async (hrModels) => {
    try {
        const cronLog = await hrModels.cronLog.findOne({ where: { jobName: "ABSENT_SYNC" } });
        const lastRunDateValue = cronLog === null || cronLog === void 0 ? void 0 : cronLog.getDataValue("lastRunDate");
        // Use the last run date, otherwise default to the 1st of the current month if DB was recently wiped
        const startDate = lastRunDateValue ? (0, moment_1.default)(lastRunDateValue) : (0, moment_1.default)().startOf("month");
        const today = (0, moment_1.default)().startOf("day");
        for (let currentDate = startDate.clone(); currentDate.isBefore(today, "day"); currentDate.add(1, "day")) {
            const dateStr = currentDate.format("YYYY-MM-DD");
            await (0, runSync_1.runSyncTask)(hrModels, dateStr);
        }
        await hrModels.cronLog.upsert({ jobName: "ABSENT_SYNC", lastRunDate: today.format("YYYY-MM-DD") });
        console.log("✅ Attendance recovery complete");
    }
    catch (error) {
        console.error("❌ Failed to recover attendance:", error);
    }
};
exports.recoverMissedDays = recoverMissedDays;
