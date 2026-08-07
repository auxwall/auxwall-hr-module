"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const deleteStaffSchedule = async (id) => {
    const StaffSchedule = index_1.models.staffSchedule;
    const Staff = index_1.models.staff;
    if (Staff) {
        const assignedStaffCount = await Staff.count({ where: { scheduleId: id } });
        if (assignedStaffCount > 0) {
            throw new Error(`Cannot delete schedule because it is assigned to ${assignedStaffCount} staff member(s).`);
        }
    }
    const scheduleInstance = await StaffSchedule.findByPk(id);
    if (!scheduleInstance) {
        throw new Error(`Schedule with ID ${id} not found.`);
    }
    return await scheduleInstance.destroy();
};
exports.default = deleteStaffSchedule;
