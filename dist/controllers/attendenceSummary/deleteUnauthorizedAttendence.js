"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const deleteUnauthorizedAttendence = async (id) => {
    const AttendenceSummary = index_1.models.attendenceSummary;
    const Staff = index_1.models.staff;
    const selectedAttendence = await AttendenceSummary.findByPk(id);
    if (!selectedAttendence) {
        throw new Error(`Attendence with ID ${id} not found.`);
    }
    const staffId = selectedAttendence.get("staffId");
    const attendenceDate = selectedAttendence.get("attendenceDate");
    let staff = null;
    if (Staff && staffId) {
        staff = await Staff.findByPk(staffId);
    }
    // Delete from summary table
    await selectedAttendence.destroy();
    // Delete from main transaction table using staffId + date + name if model exists
    const sequelize = AttendenceSummary.sequelize;
    const Punching = index_1.models.punching || sequelize.models["attendance_transaction"];
    if (Punching && staffId && attendenceDate) {
        const where = { staffId: staffId, eventDate: attendenceDate };
        if (staff) {
            // In deleteUnauthorizedAttendence.ts in service, it did: staffName: staff.fullName
            where.staffName = staff.fullName || staff.get("fullName");
        }
        await Punching.destroy({ where });
    }
    return selectedAttendence;
};
exports.default = deleteUnauthorizedAttendence;
