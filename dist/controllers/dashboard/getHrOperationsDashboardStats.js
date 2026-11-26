"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const index_1 = require("../../index");
async function getHrOperationsDashboardStats(companyId) {
    const Task = index_1.models.employeeTask;
    const LeaveRequest = index_1.models.leaveRequest;
    const Training = index_1.models.trainingRecord;
    const Review = index_1.models.performanceReview;
    const PublicHoliday = index_1.models.publicHoliday;
    const today = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date(Date.now() + 30 * 86400000)
        .toISOString()
        .slice(0, 10);
    const [workTasksOpen, workTasksOverdue, pendingLeave, trainingOverdue, reviewsOpen, upcomingHolidays,] = await Promise.all([
        Task.count({
            where: {
                companyId,
                phase: 'work',
                status: { [sequelize_1.Op.notIn]: ['completed', 'waived'] },
            },
        }),
        Task.count({
            where: {
                companyId,
                phase: 'work',
                dueDate: { [sequelize_1.Op.lt]: today },
                status: { [sequelize_1.Op.notIn]: ['completed', 'waived'] },
            },
        }),
        LeaveRequest.count({
            where: { companyId, status: 'pending' },
        }),
        Training.count({
            where: {
                companyId,
                status: { [sequelize_1.Op.notIn]: ['completed', 'cancelled'] },
                dueDate: { [sequelize_1.Op.lt]: today },
            },
        }),
        Review.count({
            where: {
                companyId,
                status: { [sequelize_1.Op.notIn]: ['completed'] },
            },
        }),
        PublicHoliday.count({
            where: {
                companyId,
                holidayDate: {
                    [sequelize_1.Op.gte]: today,
                    [sequelize_1.Op.lte]: nextMonth,
                },
            },
        }),
    ]);
    return {
        workTasksOpen,
        workTasksOverdue,
        pendingLeave,
        trainingOverdue,
        reviewsOpen,
        upcomingHolidays,
    };
}
exports.default = getHrOperationsDashboardStats;
