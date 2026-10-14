"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSyncTask = void 0;
const moment_1 = __importDefault(require("moment"));
const sequelize_1 = require("sequelize");
const runSyncTask = async (hrModels, date) => {
    var _a, _b, _c, _d, _e;
    const { staff: Staff, attendenceSummary: AttendenceSummary, company: Company, staffShift: StaffShift, staffSchedule: Schedule, } = hrModels;
    const sequelize = Staff.sequelize;
    const Punching = hrModels.punching || sequelize.models["attendance_transaction"];
    if (!Punching)
        return console.log("⛔ Punching model (attendance_transaction) not found in sequelize.");
    try {
        const formattedDate = date ? (0, moment_1.default)(date, "YYYY-MM-DD").format("YYYY-MM-DD") : (0, moment_1.default)().subtract(1, "day").format("YYYY-MM-DD");
        console.log(`--- Syncing Absent Data for: ${formattedDate} ---`);
        const primaryKeyField = Staff.primaryKeyAttribute || "id";
        // Handle multiple ways user/company relations might be mapped depending on the host project
        let includeCompany = [];
        if (Company) {
            includeCompany = [{ model: Company, attributes: ["id"], through: { attributes: [] }, }];
        }
        const allStaff = await Staff.findAll({ where: { status: true }, attributes: [primaryKeyField, "fullName", "shiftId"], include: includeCompany, });
        const absentRecords = [];
        for (const staff of allStaff) {
            const staffId = staff[primaryKeyField];
            let shiftStart = "09:00";
            let shiftEnd = "18:00";
            let overtimeLimitMinutes = 360;
            let isNightShift = false;
            /* =========================
               LOAD SHIFT CONFIG
               ========================= */
            if (staff.shiftId) {
                const schedule = await Schedule.findByPk(staff.shiftId, { raw: true });
                if (schedule === null || schedule === void 0 ? void 0 : schedule.data) {
                    let staffShiftId = null;
                    if (schedule.type === "week") {
                        const dayKey = (0, moment_1.default)(formattedDate).format("ddd");
                        staffShiftId = (_a = schedule.data[dayKey]) !== null && _a !== void 0 ? _a : null;
                    }
                    if (schedule.type === "month") {
                        const dayNo = (0, moment_1.default)(formattedDate).date();
                        staffShiftId = (_b = schedule.data[`Day ${dayNo}`]) !== null && _b !== void 0 ? _b : null;
                    }
                    if (staffShiftId) {
                        const shift = await StaffShift.findByPk(staffShiftId, { raw: true });
                        if (shift) {
                            shiftStart = shift.shiftStart;
                            shiftEnd = shift.shiftEnd;
                            overtimeLimitMinutes = (_c = shift.overtimeMinutes) !== null && _c !== void 0 ? _c : 360;
                            const startMin = (0, moment_1.default)(shiftStart, "HH:mm").hours() * 60 + (0, moment_1.default)(shiftStart, "HH:mm").minutes();
                            const endMin = (0, moment_1.default)(shiftEnd, "HH:mm").hours() * 60 + (0, moment_1.default)(shiftEnd, "HH:mm").minutes();
                            isNightShift = endMin < startMin;
                        }
                    }
                }
            }
            /* =========================
               SHIFT DATETIME WINDOW
               ========================= */
            const shiftStartDT = (0, moment_1.default)(`${formattedDate} ${shiftStart}`);
            let shiftEndDT = (0, moment_1.default)(`${formattedDate} ${shiftEnd}`);
            if (isNightShift)
                shiftEndDT.add(1, "day");
            const overtimeEndDT = shiftEndDT
                .clone()
                .add(overtimeLimitMinutes, "minutes");
            // ❗ if overtime window still open → skip absent
            if ((0, moment_1.default)().isBefore(overtimeEndDT)) {
                continue;
            }
            // Company mapping may vary between projects, fallback to null companyId if no relation
            const companies = ((_d = staff.Company_Detials) === null || _d === void 0 ? void 0 : _d.length) > 0
                ? staff.Company_Detials
                : ((_e = staff.companies) === null || _e === void 0 ? void 0 : _e.length) > 0
                    ? staff.companies
                    : [{ id: null }];
            for (const company of companies) {
                //    CHECK EXISTING SUMMARY
                const exists = await AttendenceSummary.findOne({
                    where: { staffId, attendenceDate: formattedDate, ...(company.id ? { companyId: company.id } : {}) },
                    raw: true
                });
                if (exists)
                    continue;
                //    CHECK ANY PUNCH EXISTS
                const punchExists = await Punching.findOne({
                    where: { staffId, eventDate: {
                            [sequelize_1.Op.between]: [shiftStartDT.clone().subtract(6, "hours").toDate(), overtimeEndDT.toDate()]
                        }
                    },
                    raw: true
                });
                if (punchExists)
                    continue;
                /* =========================
                   MARK ABSENT
                   ========================= */
                absentRecords.push({
                    staffId,
                    staffName: staff.fullName || null,
                    attendenceDate: formattedDate,
                    shiftStart,
                    shiftEnd,
                    first_in: null,
                    last_out: null,
                    companyId: company.id,
                    workedMinutes: 0,
                    lateMinutes: 0,
                    overtimeMinutes: 0,
                    breakMinutes: 0,
                    totalPunches: 0,
                    status: "Absent",
                });
            }
        }
        if (absentRecords.length) {
            await AttendenceSummary.bulkCreate(absentRecords, {
                ignoreDuplicates: true,
            });
            console.log(`✅ Absent sync completed for ${formattedDate}`);
        }
        else {
            console.log("ℹ️ No absents to sync.");
        }
    }
    catch (error) {
        console.error("❌ Error updating absent data:", error);
    }
};
exports.runSyncTask = runSyncTask;
