"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const getStaffShiftById = async (id) => {
    const StaffShift = index_1.models.staffShift;
    const Department = index_1.models.department;
    const result = await StaffShift.findByPk(id, {
        include: [{ model: Department, as: "department", attributes: ["id", "name"] }]
    });
    if (!result) {
        throw new Error(`Shift with ID ${id} not found.`);
    }
    return result;
};
exports.default = getStaffShiftById;
