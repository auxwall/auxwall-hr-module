"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const deleteStaffShift = async (id) => {
    const StaffShift = index_1.models.staffShift;
    const Staff = index_1.models.staff;
    if (Staff) {
        const assignedStaffCount = await Staff.count({ where: { shiftId: id } });
        if (assignedStaffCount > 0) {
            throw new Error(`Cannot delete shift because it is assigned to ${assignedStaffCount} staff member(s).`);
        }
    }
    const selectedShift = await StaffShift.findByPk(id);
    if (!selectedShift) {
        throw new Error(`Shift with ID ${id} not found.`);
    }
    return await selectedShift.destroy();
};
exports.default = deleteStaffShift;
