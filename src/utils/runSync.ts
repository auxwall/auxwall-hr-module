import moment from "moment";
import { Op } from "sequelize";

export const runSyncTask = async ( hrModels: any, date?: string) => {

    const { staff: Staff, attendenceSummary: AttendenceSummary, company: Company, staffShift: StaffShift, staffSchedule: Schedule, } = hrModels;
    const sequelize = Staff.sequelize;
    const Punching = (hrModels as any).punching || sequelize.models["attendance_transaction"];

    if (!Punching) return console.log("⛔ Punching model (attendance_transaction) not found in sequelize.");

    try {
        const formattedDate = date ? moment(date, "YYYY-MM-DD").format("YYYY-MM-DD") : moment().subtract(1, "day").format("YYYY-MM-DD");

        console.log(`--- Syncing Absent Data for: ${formattedDate} ---`);

        const primaryKeyField = Staff.primaryKeyAttribute || "id";

        // Handle multiple ways user/company relations might be mapped depending on the host project
        let includeCompany: any[] = [];
        if (Company) {
             includeCompany = [{ model: Company, attributes: ["id"], through: { attributes: [] }, }];
        }

        const allStaff = await Staff.findAll({ where: { status: true }, attributes: [primaryKeyField, "fullName", "shiftId"], include: includeCompany, }) as any[];

        const absentRecords: any[] = [];

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
                const schedule: any = await Schedule.findByPk(staff.shiftId, { raw: true });

                if (schedule?.data) {
                    let staffShiftId: number | null = null;

                    if (schedule.type === "week") {
                        const dayKey = moment(formattedDate).format("ddd");
                        staffShiftId = schedule.data[dayKey] ?? null;
                    }

                    if (schedule.type === "month") {
                        const dayNo = moment(formattedDate).date();
                        staffShiftId = schedule.data[`Day ${dayNo}`] ?? null;
                    }

                    if (staffShiftId) {
                        const shift: any = await StaffShift.findByPk(staffShiftId, { raw: true });

                        if (shift) {
                            shiftStart = shift.shiftStart;
                            shiftEnd = shift.shiftEnd;
                            overtimeLimitMinutes = shift.overtimeMinutes ?? 360;

                            const startMin = moment(shiftStart, "HH:mm").hours() * 60 + moment(shiftStart, "HH:mm").minutes();
                            const endMin = moment(shiftEnd, "HH:mm").hours() * 60 + moment(shiftEnd, "HH:mm").minutes();

                            isNightShift = endMin < startMin;
                        }
                    }
                }
            }

            /* =========================
               SHIFT DATETIME WINDOW
               ========================= */
            const shiftStartDT = moment(`${formattedDate} ${shiftStart}`);
            let shiftEndDT = moment(`${formattedDate} ${shiftEnd}`);

            if (isNightShift) shiftEndDT.add(1, "day");

            const overtimeEndDT = shiftEndDT
                .clone()
                .add(overtimeLimitMinutes, "minutes");

            // ❗ if overtime window still open → skip absent
            if (moment().isBefore(overtimeEndDT)) {
                continue;
            }

            // Company mapping may vary between projects, fallback to null companyId if no relation
            const companies = staff.Company_Detials?.length > 0
                    ? staff.Company_Detials
                    : staff.companies?.length > 0
                    ? staff.companies
                    : [{ id: null }];

            for (const company of companies) {
                //    CHECK EXISTING SUMMARY
                const exists = await AttendenceSummary.findOne({
                    where: { staffId, attendenceDate: formattedDate, ...(company.id ? { companyId: company.id } : {}) },
                    raw: true
                });

                if (exists) continue;
                //    CHECK ANY PUNCH EXISTS
                const punchExists = await Punching.findOne({
                    where: { staffId, eventDate: {
                            [Op.between]: [ shiftStartDT.clone().subtract(6, "hours").toDate(), overtimeEndDT.toDate() ]
                        }
                    },
                    raw: true
                });

                if (punchExists) continue;

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
        } else {
            console.log("ℹ️ No absents to sync.");
        }
    } catch (error: any) {
        console.error("❌ Error updating absent data:", error);
    }
};
