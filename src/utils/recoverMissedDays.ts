import { runSyncTask } from "./runSync";
import moment from "moment";

/**
 * Recover attendance for missed days.
 * OT-safe: never processes today
 */
export const recoverMissedDays = async (hrModels: any) => {
    try {
        const cronLog = await hrModels.cronLog.findOne({ where: { jobName: "ABSENT_SYNC" }});

        const lastRunDateValue = cronLog?.getDataValue("lastRunDate") as string | undefined;

        // Use the last run date, otherwise default to the 1st of the current month if DB was recently wiped
        const startDate = lastRunDateValue ? moment(lastRunDateValue) : moment().startOf("month");

        const today = moment().startOf("day");

        for (
            let currentDate = startDate.clone();
            currentDate.isBefore(today, "day");
            currentDate.add(1, "day")
        ) {
            const dateStr = currentDate.format("YYYY-MM-DD");
            await runSyncTask(hrModels, dateStr);
        }

        await hrModels.cronLog.upsert({ jobName: "ABSENT_SYNC", lastRunDate: today.format("YYYY-MM-DD") });

        console.log("✅ Attendance recovery complete");
    } catch (error) {
        console.error("❌ Failed to recover attendance:", error);
    }
};
