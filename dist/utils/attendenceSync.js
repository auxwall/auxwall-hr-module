"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAttendanceCron = void 0;
const runSync_1 = require("./runSync");
const recoverMissedDays_1 = require("./recoverMissedDays");
const node_cron_1 = __importDefault(require("node-cron"));
const moment_1 = __importDefault(require("moment"));
const initAttendanceCron = async (hrModels) => {
    if (!hrModels.cronLog)
        return console.warn("⚠️ CronLog model not initialized. Attendance cron job will not start.");
    try {
        await hrModels.cronLog.sync({ alter: true });
    }
    catch (err) {
        console.error("❌ Failed to sync CronLog table:", err);
    }
    console.log("🕒 Initializing Absent Synchronization Cron Job...");
    // 1. Recover missed days on startup
    await (0, recoverMissedDays_1.recoverMissedDays)(hrModels);
    // 2. Schedule daily cron job (6:30 AM Every Day)
    node_cron_1.default.schedule("30 6 * * *", async () => {
        console.log("🕒 Executing Scheduled Absent Synchronization...");
        await (0, runSync_1.runSyncTask)(hrModels);
        await hrModels.cronLog.upsert({ jobName: 'ABSENT_SYNC', lastRunDate: (0, moment_1.default)().format("YYYY-MM-DD") });
    });
};
exports.initAttendanceCron = initAttendanceCron;
