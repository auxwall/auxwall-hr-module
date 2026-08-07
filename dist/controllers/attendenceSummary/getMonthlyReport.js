"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const index_1 = require("../../index");
const moment_1 = __importDefault(require("moment"));
const getMonthlyReport = async (companyId, options = {}) => {
    const Staff = index_1.models.staff;
    const AttendenceSummary = index_1.models.attendenceSummary;
    if (!Staff || !AttendenceSummary) {
        return { totalLeaveOfMonth: 0, totalPresentOfMonth: 0, totalLateOfMonth: 0, monthlyReport: [] };
    }
    const sequelize = Staff.sequelize;
    const CompanyUserRelation = sequelize.models["company_user_relations"] || sequelize.models["userCompanyRelation"] || sequelize.models["user_Company_Relation"];
    let userIds = [];
    if (CompanyUserRelation) {
        const relations = await CompanyUserRelation.findAll({ where: { companyId }, attributes: ["userId"], raw: true });
        let allUserIds = relations.map((item) => item.userId);
        userIds = allUserIds;
    }
    let allUserIds = [...userIds];
    // Filter userIds if a specific staff is requested
    if (options.staffId) {
        userIds = allUserIds.filter((id) => id === Number(options.staffId));
    }
    if (allUserIds.length === 0) {
        return { totalLeaveOfMonth: 0, totalPresentOfMonth: 0, totalLateOfMonth: 0, monthlyReport: [] };
    }
    let startDate;
    let endDate;
    if (options.from && options.to) {
        startDate = (0, moment_1.default)(options.from).startOf('day').toDate();
        endDate = (0, moment_1.default)(options.to).endOf('day').toDate();
    }
    else {
        const _year = options.year ? options.year : (0, moment_1.default)().year();
        const _month = options.month !== undefined ? options.month : (0, moment_1.default)().month();
        startDate = (0, moment_1.default)().year(_year).month(_month).startOf('month').toDate();
        endDate = (0, moment_1.default)().year(_year).month(_month).endOf('month').toDate();
    }
    // 1. Fetch all aggregated data in a single query using Group By and conditional aggregation
    const summaries = await AttendenceSummary.findAll({
        attributes: [
            "staffId",
            [sequelize.fn("COUNT", sequelize.literal("CASE WHEN status = 'Absent' THEN 1 END")), "totalLeave"],
            [sequelize.fn("COUNT", sequelize.literal("CASE WHEN status = 'Present' THEN 1 END")), "totalPresent"],
            [sequelize.fn("COUNT", sequelize.literal("CASE WHEN status = 'Late' THEN 1 END")), "totalLate"],
            [sequelize.fn("COUNT", sequelize.literal("CASE WHEN status = 'Half Day' THEN 1 END")), "totalHalfDay"],
            [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("overtimeMinutes")), 0), "overtime"]
        ],
        where: {
            staffId: { [sequelize_1.Op.in]: userIds },
            attendenceDate: { [sequelize_1.Op.gte]: (0, moment_1.default)(startDate).format('YYYY-MM-DD'), [sequelize_1.Op.lte]: (0, moment_1.default)(endDate).format('YYYY-MM-DD') }
        },
        group: ["staffId"],
        raw: true
    });
    // 2. Fetch staff list for the report
    const staffWhere = { id: { [sequelize_1.Op.in]: userIds } };
    if (options.name) {
        staffWhere.fullName = { [sequelize_1.Op.iLike]: `%${options.name}%` };
    }
    const staffList = await Staff.findAll({ where: staffWhere, attributes: ["id", "fullName"], raw: true });
    // 3. Map aggregates to a fast lookup structure
    const summaryMap = new Map();
    summaries.forEach((s) => {
        summaryMap.set(Number(s.staffId), { totalLeave: Number(s.totalLeave || 0), totalPresent: Number(s.totalPresent || 0), totalLate: Number(s.totalLate || 0), totalHalfDay: Number(s.totalHalfDay || 0), overtime: Number(s.overtime || 0) });
    });
    // 4. Build report & compute totals in a single pass in memory
    let totalLeaveOfMonth = 0;
    let totalPresentOfMonth = 0;
    let totalLateOfMonth = 0;
    const report = staffList.map((staff) => {
        const staffId = Number(staff.id);
        const stats = summaryMap.get(staffId) || { totalLeave: 0, totalPresent: 0, totalLate: 0, totalHalfDay: 0, overtime: 0 };
        totalLeaveOfMonth += stats.totalLeave;
        totalPresentOfMonth += stats.totalPresent;
        totalLateOfMonth += stats.totalLate;
        return { staffId, staffName: staff.fullName, totalLeave: stats.totalLeave, totalPresent: stats.totalPresent, totalLate: stats.totalLate, totalHalfDay: stats.totalHalfDay, overtime: stats.overtime };
    });
    return { totalLeaveOfMonth, totalPresentOfMonth, totalLateOfMonth, monthlyReport: report };
};
exports.default = getMonthlyReport;
