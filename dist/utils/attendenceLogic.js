"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAttendanceSummary = void 0;
const sequelize_1 = require("sequelize");
const moment_1 = __importDefault(require("moment"));
const updateAttendanceSummary = async (punchingRecord, hrModels) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const { staff: Staff, staffSchedule: Schedule, staffShift: StaffShift, attendenceSummary: AttendenceSummary } = hrModels;
    if (!AttendenceSummary)
        return console.log("⛔ AttendenceSummary model not initialized.");
    const sequelize = AttendenceSummary.sequelize;
    const Punching = hrModels.punching || sequelize.models["attendance_transaction"];
    if (!Punching)
        return console.log("⛔ Punching model (attendance_transaction) not found in sequelize.");
    if (!Staff)
        return console.log("⛔ Staff model not initialized.");
    console.log("🟢 updateAttendanceSummary started");
    console.log(punchingRecord);
    let record;
    if (Array.isArray(punchingRecord)) {
        if (punchingRecord.length === 0)
            return;
        record = punchingRecord[0].dataValues || punchingRecord[0];
    }
    else {
        record = punchingRecord.dataValues || punchingRecord;
    }
    const { staffId, eventDate } = record;
    const interval = record.interval || 5;
    if (!staffId || !eventDate) {
        console.log("⛔ Missing staffId / eventDate", record);
        return;
    }
    let isUnauthorized = false;
    /* =========================
       1️⃣ STAFF
    ========================= */
    const attrs = ["id", "fullName", "shiftId", "scheduleId"];
    if (Staff.rawAttributes && Staff.rawAttributes["isFlexible"]) {
        attrs.push("isFlexible");
    }
    if (Staff.rawAttributes && Staff.rawAttributes["status"]) {
        attrs.push("status");
    }
    const staff = await Staff.findOne({ where: { id: staffId }, attributes: attrs, raw: true });
    if (!staff)
        return console.log("⛔ Staff member not found:", staffId);
    // Only allow active users
    if (staff.status === false) {
        console.log("⛔ Staff member is inactive, skipping attendance summary generation:", staffId);
        return;
    }
    const isFlexible = staff.isFlexible;
    /* =========================
       SHIFT DEFAULTS
    ========================= */
    const getMinutes = (time) => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
    };
    let shiftStart = "09:00";
    let shiftEnd = "18:00";
    let lateGraceMinutes = 0;
    let overtimeLimitMinutes = 360;
    let isNightShift = false;
    const baseDate = (0, moment_1.default)(eventDate).format("YYYY-MM-DD");
    let targetDate = baseDate;
    const currentDate = (0, moment_1.default)(eventDate);
    const prevDate = currentDate.clone().subtract(1, "day");
    /* =========================
       2️⃣ SCHEDULE
    ========================= */
    let schedule = null;
    if (Schedule && staff.scheduleId) {
        schedule = await Schedule.findOne({ where: { id: staff.scheduleId }, raw: true });
    }
    let shiftStartDT;
    let shiftEndDT;
    if (schedule === null || schedule === void 0 ? void 0 : schedule.data) {
        let staffShiftId = null;
        let shiftDate = currentDate.clone();
        const isMonth = schedule.type === 'month';
        if (isMonth) {
            const dayKey = currentDate.format("D");
            staffShiftId = (_a = schedule.data[dayKey]) !== null && _a !== void 0 ? _a : null;
            if (!staffShiftId) {
                const prevDayKey = prevDate.format("D");
                staffShiftId = (_b = schedule.data[prevDayKey]) !== null && _b !== void 0 ? _b : null;
                if (staffShiftId)
                    shiftDate = prevDate.clone();
            }
        }
        else {
            const dayKeyShort = currentDate.format("ddd");
            const dayKeyFull = currentDate.format("dddd");
            staffShiftId = (_d = (_c = schedule.data[dayKeyShort]) !== null && _c !== void 0 ? _c : schedule.data[dayKeyFull]) !== null && _d !== void 0 ? _d : null;
            if (!staffShiftId) {
                const prevDayKeyShort = prevDate.format("ddd");
                const prevDayKeyFull = prevDate.format("dddd");
                staffShiftId = (_f = (_e = schedule.data[prevDayKeyShort]) !== null && _e !== void 0 ? _e : schedule.data[prevDayKeyFull]) !== null && _f !== void 0 ? _f : null;
                if (staffShiftId)
                    shiftDate = prevDate.clone();
            }
        }
        if (staffShiftId && StaffShift) {
            const shift = await StaffShift.findByPk(staffShiftId, { raw: true });
            if (shift && !isFlexible) {
                shiftStart = shift.shiftStart;
                shiftEnd = shift.shiftEnd;
                lateGraceMinutes = shift.lateGraceMinutes || 0;
                overtimeLimitMinutes = (_g = shift.overtimeMinutes) !== null && _g !== void 0 ? _g : 360;
                const startM = getMinutes(shiftStart);
                const endM = getMinutes(shiftEnd);
                isNightShift = endM < startM;
                targetDate = shiftDate.format("YYYY-MM-DD");
            }
        }
    }
    /* =========================
       3️⃣ SHIFT WINDOW (FIXED)
    ========================= */
    if (!isFlexible) {
        shiftStartDT = (0, moment_1.default)(`${targetDate} ${shiftStart}`);
        shiftEndDT = (0, moment_1.default)(`${targetDate} ${shiftEnd}`);
        if (isNightShift || shiftEndDT.isBefore(shiftStartDT)) {
            shiftEndDT.add(1, "day");
        }
    }
    else {
        // ✅ SAFE FLEXIBLE WINDOW
        shiftStartDT = (0, moment_1.default)(`${targetDate} 00:00`);
        shiftEndDT = (0, moment_1.default)(`${targetDate} 23:59`);
    }
    const overtimeEndDT = shiftEndDT.clone().add(overtimeLimitMinutes, "minutes");
    const shiftCompleted = (0, moment_1.default)().isAfter(overtimeEndDT);
    /* =========================
       4️⃣ PUNCHES
    ========================= */
    const startOfRange = shiftStartDT.clone().subtract(3, "hours").toDate();
    const endOfRange = shiftEndDT.clone().add(Math.max(overtimeLimitMinutes, 360), "minutes").toDate();
    const rawPunches = await Punching.findAll({
        where: { staffId, eventDate: { [sequelize_1.Op.between]: [startOfRange, endOfRange] } },
        order: [["eventDate", "ASC"]],
        raw: true
    });
    const punches = [];
    for (const punch of rawPunches) {
        if (punches.length === 0) {
            punches.push(punch);
            continue;
        }
        const previousPunch = punches[punches.length - 1];
        const diffMinutes = (0, moment_1.default)(punch.eventDate).diff((0, moment_1.default)(previousPunch.eventDate), "minutes");
        if (diffMinutes < interval) {
            console.log(`⚠️ Ignored duplicate punch at ${(0, moment_1.default)(punch.eventDate).format("HH:mm:ss")}`);
            continue;
        }
        punches.push(punch);
    }
    if (!punches.length)
        return console.log("No punches found");
    punches.forEach((p, i) => { p.punchingType = i % 2 === 0 ? "In" : "Out"; });
    const isLastPunchIn = punches.length % 2 !== 0;
    let lastOut = punches[punches.length - 1];
    let lastOutDT = (0, moment_1.default)(lastOut.eventDate);
    const checkLimit = (0, moment_1.default)(shiftStartDT).subtract(3, 'hours');
    const firstIn = punches.find(p => (0, moment_1.default)(p.eventDate).isSameOrAfter(checkLimit)) || punches[0];
    /* =========================
       5️⃣ LIVE / UNAUTHORIZED
    ========================= */
    if (isLastPunchIn) {
        if (!shiftCompleted)
            console.log("Employee LIVE");
        else
            isUnauthorized = true;
    }
    /* =========================
       6️⃣ WORK TIME
    ========================= */
    let workedMinutes = 0;
    let breakMinutes = 0;
    for (let i = 0; i < punches.length; i++) {
        const current = punches[i];
        const next = punches[i + 1];
        const currentDT = (0, moment_1.default)(current.eventDate);
        let endDT;
        if (next) {
            endDT = (0, moment_1.default)(next.eventDate);
        }
        else if (isLastPunchIn) {
            endDT = shiftCompleted ? lastOutDT : (0, moment_1.default)();
        }
        else {
            continue;
        }
        let diff = endDT.diff(currentDT, "minutes");
        if (diff < 0)
            diff = 0; // Prevent negative minutes if testing with future punches
        if (current.punchingType === "In") {
            workedMinutes += diff;
        }
        else {
            breakMinutes += diff;
        }
    }
    /* =========================
       7️⃣ STATUS LOGIC
    ========================= */
    let status = "Absent";
    let lateMinutes = 0;
    let overtimeMinutes = 0;
    const firstInDT = (0, moment_1.default)(firstIn.eventDate);
    if (!isFlexible) {
        const lateThresholdDT = shiftStartDT.clone().add(lateGraceMinutes, "minutes");
        if (firstInDT.isAfter(lateThresholdDT)) {
            lateMinutes = firstInDT.diff(lateThresholdDT, "minutes");
        }
    }
    if (isFlexible) {
        const requiredMinutes = 8 * 60;
        const extra = workedMinutes - requiredMinutes;
        if (extra > 0) {
            overtimeMinutes = Math.min(extra, overtimeLimitMinutes);
        }
        if (isUnauthorized) {
            status = "Unauthorized";
        }
        else if (workedMinutes === 0) {
            status = "Absent";
        }
        else if (workedMinutes < requiredMinutes) {
            status = "Half Day";
        }
        else {
            status = "Present";
        }
    }
    else {
        const shiftDurationMinutes = shiftEndDT.diff(shiftStartDT, "minutes");
        const halfDayMinutes = shiftDurationMinutes / 2;
        const extraWorkedMinutes = workedMinutes - shiftDurationMinutes;
        if (extraWorkedMinutes > 0) {
            overtimeMinutes = Math.min(extraWorkedMinutes, overtimeLimitMinutes);
        }
        if (isUnauthorized) {
            status = "Unauthorized";
        }
        else if (isLastPunchIn && !shiftCompleted) {
            status = "Live";
        }
        else if (workedMinutes < halfDayMinutes) {
            status = "Half Day";
        }
        else if (lateMinutes > 0) {
            status = "Late";
        }
        else {
            status = "Present";
        }
    }
    let actualLastOut = null;
    if (!isLastPunchIn) {
        actualLastOut = punches[punches.length - 1];
    }
    else if (punches.length > 1) {
        actualLastOut = punches[punches.length - 2];
    }
    const lastOutFormatted = actualLastOut ? (0, moment_1.default)(actualLastOut.eventDate).format("HH:mm:ss") : null;
    const summaryData = {
        staffId,
        staffName: staff.fullName,
        attendenceDate: targetDate,
        shiftStart,
        shiftEnd,
        first_in: (0, moment_1.default)(firstIn.eventDate).format("HH:mm:ss"),
        last_out: lastOutFormatted,
        workedMinutes,
        breakMinutes,
        lateMinutes,
        overtimeMinutes,
        totalPunches: punches.length,
        status,
        companyId: record.companyId
    };
    console.log("✅ Summary data:", summaryData);
    const existingSummary = await AttendenceSummary.findOne({ where: { staffId, attendenceDate: targetDate } });
    const finalData = {
        staffName: staff.fullName,
        shiftStart,
        shiftEnd,
        first_in: (0, moment_1.default)(firstIn.eventDate).format("HH:mm:ss"),
        last_out: lastOutFormatted,
        workedMinutes,
        breakMinutes,
        lateMinutes,
        overtimeMinutes,
        totalPunches: punches.length,
        status,
        companyId: record.companyId
    };
    if (existingSummary) {
        await existingSummary.update(finalData);
    }
    else {
        await AttendenceSummary.create({ staffId, attendenceDate: targetDate, ...finalData });
    }
};
exports.updateAttendanceSummary = updateAttendanceSummary;
