"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const moment_1 = __importDefault(require("moment"));
const index_1 = require("../../index");
function formatMinutesToHoursMinutes(minutes) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
}
const getAttendenceSummaries = async (companyId, options = {}) => {
    const Staff = index_1.models.staff;
    const AttendenceSummary = index_1.models.attendenceSummary;
    const StaffShift = index_1.models.staffShift;
    if (!Staff || !AttendenceSummary) {
        return { count: 0, totalLateStaff: 0, totalAbsentStaff: 0, totalPresentStaff: 0, totalHalfDayStaff: 0, rows: [] };
    }
    const sequelize = Staff.sequelize;
    const CompanyUserRelation = sequelize.models["company_user_relations"] || sequelize.models["userCompanyRelation"] || sequelize.models["user_Company_Relation"];
    let userIds = [];
    if (options.staffId) {
        userIds = [options.staffId];
    }
    else if (CompanyUserRelation) {
        const relations = await CompanyUserRelation.findAll({ where: { companyId }, attributes: ["userId"], raw: true });
        userIds = relations.map((item) => item.userId);
    }
    if (userIds.length === 0) {
        return { count: 0, totalLateStaff: 0, totalAbsentStaff: 0, totalPresentStaff: 0, totalHalfDayStaff: 0, rows: [] };
    }
    // Date range for summary cards
    let startDate = new Date();
    startDate.setDate(1); // Default to first day of month
    startDate.setHours(0, 0, 0, 0);
    let endDate = new Date(); // Default to today
    endDate.setHours(23, 59, 59, 999);
    if (options.from) {
        startDate = new Date(options.from);
        startDate.setHours(0, 0, 0, 0);
    }
    if (options.to) {
        endDate = new Date(options.to);
        endDate.setHours(23, 59, 59, 999);
    }
    else if (!options.from) {
        // If neither from nor to is provided, we default to current month but cap at today
        // already handled by defaults above
    }
    // Fetch summaries for the calculated date range, including status to avoid extra count queries
    const allSummaries = await AttendenceSummary.findAll({
        where: { staffId: { [sequelize_1.Op.in]: userIds }, attendenceDate: { [sequelize_1.Op.gte]: (0, moment_1.default)(startDate).format('YYYY-MM-DD'), [sequelize_1.Op.lte]: (0, moment_1.default)(endDate).format('YYYY-MM-DD') } },
        attributes: ["staffId", "attendenceDate", "status"],
        raw: true
    });
    let totalLateStaff = 0;
    let totalPresentStaff = 0;
    let totalHalfDayStaff = 0;
    let totalAbsentStaff = 0;
    allSummaries.forEach((summary) => {
        const status = summary.status;
        if (status === 'Late')
            totalLateStaff++;
        else if (status === 'Present')
            totalPresentStaff++;
        else if (status === 'Half Day')
            totalHalfDayStaff++;
        else if (status === 'Absent')
            totalAbsentStaff++;
    });
    // Filters for queried list
    const whereClause = {
        staffId: { [sequelize_1.Op.in]: userIds }
    };
    if (options.status) {
        whereClause.status = options.status;
    }
    if (options.from || options.to) {
        whereClause.attendenceDate = {};
        if (options.from) {
            whereClause.attendenceDate[sequelize_1.Op.gte] = options.from;
        }
        if (options.to) {
            whereClause.attendenceDate[sequelize_1.Op.lte] = options.to;
        }
    }
    const staffWhere = {};
    if (options.name) {
        staffWhere.fullName = {
            [sequelize_1.Op.iLike]: `%${options.name}%`
        };
    }
    const queryOptions = {
        include: [{ model: Staff, as: 'staff', attributes: ['fullName', 'shiftId'], where: staffWhere }],
        where: whereClause,
        order: [['attendenceDate', 'DESC']]
    };
    if (options.limit !== undefined && options.offset !== undefined) {
        queryOptions.limit = options.limit;
        queryOptions.offset = options.offset;
    }
    const result = await AttendenceSummary.findAndCountAll(queryOptions);
    // Pre-index shift names for O(1) lookups during row mapping
    const shiftMap = new Map();
    if (StaffShift) {
        const allShifts = await StaffShift.findAll({ attributes: ['id', 'shiftName'], raw: true });
        allShifts.forEach((s) => {
            shiftMap.set(Number(s.id), s.shiftName);
        });
    }
    const mappedRows = result.rows.map((record) => {
        var _a, _b;
        const staffShiftId = (_a = record.staff) === null || _a === void 0 ? void 0 : _a.shiftId;
        const shiftName = staffShiftId ? shiftMap.get(Number(staffShiftId)) : null;
        return { ...record.toJSON(), staffName: ((_b = record.staff) === null || _b === void 0 ? void 0 : _b.fullName) || null, shiftName, workedTime: formatMinutesToHoursMinutes(record.get('workedMinutes') || 0), lateTime: formatMinutesToHoursMinutes(record.get('lateMinutes') || 0), overtime: formatMinutesToHoursMinutes(record.get('overtimeMinutes') || 0), status: record.get('status') };
    });
    return { count: result.count, totalLateStaff, totalAbsentStaff, totalPresentStaff, totalHalfDayStaff, rows: mappedRows };
};
exports.default = getAttendenceSummaries;
