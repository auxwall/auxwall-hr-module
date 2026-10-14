"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const moment_1 = __importDefault(require("moment"));
const index_1 = require("../../index");
const getAbsentStaff = async (companyId, options = {}) => {
    var _a, _b, _c, _d, _e;
    const Staff = index_1.models.staff;
    const AttendenceSummary = index_1.models.attendenceSummary;
    const Schedule = index_1.models.staffSchedule;
    const StaffShift = index_1.models.staffShift;
    if (!Staff || !AttendenceSummary) {
        return { count: 0, rows: [] };
    }
    // 1. Summary filter
    const summaryWhere = { companyId };
    if (options.from && options.to) {
        summaryWhere.attendenceDate = {
            [sequelize_1.Op.between]: [(0, moment_1.default)(options.from).format("YYYY-MM-DD"), (0, moment_1.default)(options.to).format("YYYY-MM-DD")]
        };
    }
    else if (options.from) {
        summaryWhere.attendenceDate = (0, moment_1.default)(options.from).format("YYYY-MM-DD");
    }
    // 2. Staff filter
    const staffWhere = {};
    if (options.name) {
        staffWhere.fullName = { [sequelize_1.Op.iLike]: `%${options.name}%` };
    }
    const sequelize = Staff.sequelize;
    const CompanyUserRelation = sequelize.models["company_user_relations"] || sequelize.models["userCompanyRelation"];
    let userIds = [];
    if (CompanyUserRelation) {
        const relations = await CompanyUserRelation.findAll({ where: { companyId }, attributes: ["userId"], raw: true });
        userIds = relations.map((item) => item.userId);
    }
    if (userIds.length > 0) {
        staffWhere.id = { [sequelize_1.Op.in]: userIds };
    }
    const allStaff = await Staff.findAll({ where: staffWhere, attributes: ["id", "fullName", "scheduleId", "shiftId"], raw: true });
    if (!allStaff.length) {
        return { count: 0, rows: [] };
    }
    // 5. Get attendance summaries
    const allSummaries = await AttendenceSummary.findAll({ where: summaryWhere, attributes: ["staffId", "attendenceDate"], raw: true });
    if (!allSummaries.length) {
        return { count: 0, rows: [] };
    }
    // 6. Group present staff
    const presentMap = {};
    allSummaries.forEach((summary) => {
        const dateStr = (0, moment_1.default)(summary.attendenceDate).format("YYYY-MM-DD");
        if (!presentMap[dateStr]) {
            presentMap[dateStr] = new Set();
        }
        presentMap[dateStr].add(summary.staffId);
    });
    // 7. Sort dates desc
    const dates = Object.keys(presentMap).sort((a, b) => (0, moment_1.default)(b).valueOf() - (0, moment_1.default)(a).valueOf());
    // --- OPTIMIZATION: Pre-fetch all schedules and shifts in bulk ---
    const scheduleIds = Array.from(new Set(allStaff.map(s => s.scheduleId).filter(Boolean)));
    const shiftIds = Array.from(new Set(allStaff.map(s => s.shiftId).filter(Boolean)));
    const schedules = (Schedule && scheduleIds.length > 0)
        ? await Schedule.findAll({ where: { id: { [sequelize_1.Op.in]: scheduleIds } }, raw: true })
        : [];
    const parsedSchedules = schedules.map((s) => {
        let parsedData = s.data || {};
        if (typeof parsedData === "string") {
            try {
                parsedData = JSON.parse(parsedData);
            }
            catch (e) {
                parsedData = {};
            }
        }
        return { ...s, data: parsedData };
    });
    const scheduleMap = new Map(parsedSchedules.map((s) => [s.id, s]));
    // Collect all shift IDs referenced inside parsed schedule data
    const allReferencedShiftIds = new Set(shiftIds);
    parsedSchedules.forEach((s) => {
        if (s.data) {
            Object.values(s.data).forEach((val) => {
                if (val)
                    allReferencedShiftIds.add(Number(val));
            });
        }
    });
    const finalShiftIds = Array.from(allReferencedShiftIds);
    const shifts = (StaffShift && finalShiftIds.length > 0)
        ? await StaffShift.findAll({ where: { id: { [sequelize_1.Op.in]: finalShiftIds } }, raw: true })
        : [];
    const shiftMap = new Map(shifts.map((s) => [s.id, s]));
    // -------------------------------------------------------------
    const result = [];
    // 8. Find absent staff (runs fully in-memory now!)
    for (const currentDate of dates) {
        const presentIds = presentMap[currentDate] || new Set();
        const absentStaff = allStaff.filter(staff => !presentIds.has(staff.id));
        // 9. Shift details
        for (const staff of absentStaff) {
            let shiftName = null;
            let shiftStart = null;
            let shiftEnd = null;
            const schedule = staff.scheduleId ? scheduleMap.get(staff.scheduleId) : null;
            let staffShiftId = null;
            if (schedule === null || schedule === void 0 ? void 0 : schedule.data) {
                if (schedule.type === 'month') {
                    const dayKey = (0, moment_1.default)(currentDate).format("D");
                    staffShiftId = ((_a = schedule.data) === null || _a === void 0 ? void 0 : _a[dayKey]) || null;
                }
                else {
                    const dayKeyShort = (0, moment_1.default)(currentDate).format("ddd");
                    const dayKeyFull = (0, moment_1.default)(currentDate).format("dddd");
                    staffShiftId = (_e = (_c = (_b = schedule.data) === null || _b === void 0 ? void 0 : _b[dayKeyShort]) !== null && _c !== void 0 ? _c : (_d = schedule.data) === null || _d === void 0 ? void 0 : _d[dayKeyFull]) !== null && _e !== void 0 ? _e : null;
                }
            }
            const shiftId = staffShiftId || staff.shiftId;
            if (shiftId) {
                const shift = shiftMap.get(Number(shiftId));
                if (shift) {
                    shiftName = shift.shiftName;
                    shiftStart = shift.shiftStart;
                    shiftEnd = shift.shiftEnd;
                }
            }
            result.push({ staffId: staff.id, fullName: staff.fullName, date: currentDate, shiftName, shiftStart, shiftEnd, status: "Absent" });
        }
    }
    // 10. Pagination
    const hasPagination = options.limit !== undefined && options.offset !== undefined;
    const paginatedRows = hasPagination ? result.slice(options.offset, options.offset + options.limit) : result;
    return {
        count: result.length,
        rows: paginatedRows
    };
};
exports.default = getAbsentStaff;
