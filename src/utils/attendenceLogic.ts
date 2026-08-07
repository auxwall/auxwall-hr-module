import { Op } from "sequelize";
import moment from "moment";
import { Models } from "../types";

export const updateAttendanceSummary = async ( punchingRecord: any, hrModels: Partial<Models>) => {
    const { staff: Staff, staffSchedule: Schedule, staffShift: StaffShift, attendenceSummary: AttendenceSummary } = hrModels as any;

    if (!AttendenceSummary) return console.log("⛔ AttendenceSummary model not initialized.");

    const sequelize = AttendenceSummary.sequelize;
    const Punching = (hrModels as any).punching || sequelize.models["attendance_transaction"];

    if (!Punching) return console.log("⛔ Punching model (attendance_transaction) not found in sequelize.");
    if (!Staff) return console.log("⛔ Staff model not initialized.");

    console.log("🟢 updateAttendanceSummary started");
    console.log(punchingRecord);

    let record;
    if (Array.isArray(punchingRecord)) {
        if (punchingRecord.length === 0) return;
        record = punchingRecord[0].dataValues || punchingRecord[0];
    } else {
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

    const staff: any = await Staff.findOne({ where: { id: staffId }, attributes: attrs, raw: true });

    if (!staff) return console.log("⛔ Staff member not found:", staffId);

    const isFlexible = staff.isFlexible;

    /* =========================
       SHIFT DEFAULTS
    ========================= */
    const getMinutes = (time: string) => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
    };

    let shiftStart = "09:00";
    let shiftEnd = "18:00";
    let lateGraceMinutes = 0;
    let overtimeLimitMinutes = 360;
    let isNightShift = false;

    const baseDate = moment(eventDate).format("YYYY-MM-DD");
    let targetDate = baseDate;

    const currentDate = moment(eventDate);
    const prevDate = currentDate.clone().subtract(1, "day");

    /* =========================
       2️⃣ SCHEDULE
    ========================= */
    let schedule: any = null;
    if (Schedule && staff.scheduleId) {
        schedule = await Schedule.findOne({ where: { id: staff.scheduleId }, raw: true });
    }

    let shiftStartDT: moment.Moment;
    let shiftEndDT: moment.Moment;

    if (schedule?.data) {
        let staffShiftId = null;
        let shiftDate = currentDate.clone();

        const isMonth = schedule.type === 'month';
        if (isMonth) {
            const dayKey = currentDate.format("D");
            staffShiftId = schedule.data[dayKey] ?? null;

            if (!staffShiftId) {
                const prevDayKey = prevDate.format("D");
                staffShiftId = schedule.data[prevDayKey] ?? null;
                if (staffShiftId) shiftDate = prevDate.clone();
            }
        } else {
            const dayKeyShort = currentDate.format("ddd");
            const dayKeyFull = currentDate.format("dddd");
            staffShiftId = schedule.data[dayKeyShort] ?? schedule.data[dayKeyFull] ?? null;

            if (!staffShiftId) {
                const prevDayKeyShort = prevDate.format("ddd");
                const prevDayKeyFull = prevDate.format("dddd");
                staffShiftId = schedule.data[prevDayKeyShort] ?? schedule.data[prevDayKeyFull] ?? null;
                if (staffShiftId) shiftDate = prevDate.clone();
            }
        }

        if (staffShiftId && StaffShift) {
            const shift: any = await StaffShift.findByPk(staffShiftId, { raw: true });

            if (shift && !isFlexible) {
                shiftStart = shift.shiftStart;
                shiftEnd = shift.shiftEnd;
                lateGraceMinutes = shift.lateGraceMinutes || 0;
                overtimeLimitMinutes = shift.overtimeMinutes ?? 360;

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
        shiftStartDT = moment(`${targetDate} ${shiftStart}`);
        shiftEndDT = moment(`${targetDate} ${shiftEnd}`);

        if (isNightShift || shiftEndDT.isBefore(shiftStartDT)) {
            shiftEndDT.add(1, "day");
        }
    } else {
        // ✅ SAFE FLEXIBLE WINDOW
        shiftStartDT = moment(`${targetDate} 00:00`);
        shiftEndDT = moment(`${targetDate} 23:59`);
    }

    const overtimeEndDT = shiftEndDT.clone().add(overtimeLimitMinutes, "minutes");
    const shiftCompleted = moment().isAfter(overtimeEndDT);

    /* =========================
       4️⃣ PUNCHES
    ========================= */
    const startOfRange = shiftStartDT.clone().subtract(12, "hours").toDate();
    const endOfRange = overtimeEndDT.toDate();

    const rawPunches: any[] = await Punching.findAll({
        where: { staffId, eventDate: { [Op.between]: [startOfRange, endOfRange] } },
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
        const diffMinutes = moment(punch.eventDate).diff( moment(previousPunch.eventDate), "minutes" );

        if (diffMinutes < interval) {
            console.log(`⚠️ Ignored duplicate punch at ${moment(punch.eventDate).format("HH:mm:ss")}`);
            continue;
        }
        punches.push(punch);
    }

    if (!punches.length) return console.log("No punches found");

    punches.forEach((p, i) => { p.punchingType = i % 2 === 0 ? "In" : "Out"; });

    const isLastPunchIn = punches.length % 2 !== 0;
    let lastOut = punches[punches.length - 1];
    let lastOutDT = moment(lastOut.eventDate);

    const checkLimit = moment(shiftStartDT).subtract(2, 'hours');
    const firstIn = punches.find(p => moment(p.eventDate).isSameOrAfter(checkLimit)) || punches[0];

    /* =========================
       5️⃣ LIVE / UNAUTHORIZED
    ========================= */
    if (isLastPunchIn) {
        if (!shiftCompleted) console.log("Employee LIVE");
        else isUnauthorized = true;
    }

    /* =========================
       6️⃣ WORK TIME
    ========================= */
    let workedMinutes = 0;
    let breakMinutes = 0;

    for (let i = 0; i < punches.length; i++) {
        const current = punches[i];
        const next = punches[i + 1];
        const currentDT = moment(current.eventDate);

        let endDT;
        if (next) {
            endDT = moment(next.eventDate);
        } else if (isLastPunchIn) {
            endDT = shiftCompleted ? lastOutDT : moment();
        } else {
            continue;
        }

        let diff = endDT.diff(currentDT, "minutes");
        if (diff < 0) diff = 0; // Prevent negative minutes if testing with future punches

        if (current.punchingType === "In") {
            workedMinutes += diff;
        } else {
            breakMinutes += diff;
        }
    }

    /* =========================
       7️⃣ STATUS LOGIC
    ========================= */
    let status = "Absent";
    let lateMinutes = 0;
    let overtimeMinutes = 0;

    const firstInDT = moment(firstIn.eventDate);

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
        } else if (workedMinutes === 0) {
            status = "Absent";
        } else if (workedMinutes < requiredMinutes) {
            status = "Half Day";
        } else {
            status = "Present";
        }
    } else {
        const shiftDurationMinutes = shiftEndDT.diff(shiftStartDT, "minutes");
        const halfDayMinutes = shiftDurationMinutes / 2;
        const extraWorkedMinutes = workedMinutes - shiftDurationMinutes;

        if (extraWorkedMinutes > 0) {
            overtimeMinutes = Math.min(extraWorkedMinutes, overtimeLimitMinutes);
        }

        if (isUnauthorized) {
            status = "Unauthorized";
        } else if (isLastPunchIn && !shiftCompleted) {
            status = "Live";
        } else if (workedMinutes < halfDayMinutes) {
            status = "Half Day";
        } else if (lateMinutes > 0) {
            status = "Late";
        } else {
            status = "Present";
        }
    }

    let actualLastOut = null;
    if (!isLastPunchIn) {
        actualLastOut = punches[punches.length - 1];
    } else if (punches.length > 1) {
        actualLastOut = punches[punches.length - 2];
    }
    const lastOutFormatted = actualLastOut ? moment(actualLastOut.eventDate).format("HH:mm:ss") : null;

    const summaryData = {
        staffId,
        staffName: staff.fullName,
        attendenceDate: targetDate,
        shiftStart,
        shiftEnd,
        first_in: moment(firstIn.eventDate).format("HH:mm:ss"),
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
        first_in: moment(firstIn.eventDate).format("HH:mm:ss"),
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
    } else {
        await AttendenceSummary.create({ staffId, attendenceDate: targetDate, ...finalData });
    }
};
