"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const deleteDepartment = async (id, companyId) => {
    const Department = index_1.models.department;
    const Staff = index_1.models.staff;
    if (Staff) {
        const assignedStaffCount = await Staff.count({ where: { departmentId: id } });
        if (assignedStaffCount > 0) {
            throw new Error(`Cannot delete department because it is assigned to ${assignedStaffCount} staff member(s).`);
        }
    }
    const departmentInstance = await Department.findOne({ where: { id, companyId } });
    if (!departmentInstance) {
        throw new Error(`Department with ID ${id} not found.`);
    }
    return await departmentInstance.destroy();
};
exports.default = deleteDepartment;
