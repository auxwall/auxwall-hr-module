import { runSyncTask } from "./runSync";
import { recoverMissedDays } from "./recoverMissedDays";
// dynamic cron import
import moment from "moment";

export const initAttendanceCron = async (hrModels: any) => {
    let cron: any;
    try {
        cron = require("node-cron");
    } catch (e) {
        console.warn("⚠️ node-cron is not installed. Attendance cron job will not start.");
        return;
    }

    if (!hrModels.cronLog) return console.warn("⚠️ CronLog model not initialized. Attendance cron job will not start.");

    try {
        await hrModels.cronLog.sync({ alter: true });
    } catch (err) {
        console.error("❌ Failed to sync CronLog table:", err);
    }

    console.log("🕒 Initializing Absent Synchronization Cron Job...");

    // 1. Recover missed days on startup
    await recoverMissedDays(hrModels);

    // 2. Schedule daily cron job (6:30 AM Every Day)
    cron.schedule("30 6 * * *", async () => {
        console.log("🕒 Executing Scheduled Absent Synchronization...");
        await runSyncTask(hrModels);
        await hrModels.cronLog.upsert({ jobName: 'ABSENT_SYNC', lastRunDate: moment().format("YYYY-MM-DD") });
    });
};
