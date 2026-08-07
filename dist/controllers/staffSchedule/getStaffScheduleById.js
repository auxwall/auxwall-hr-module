"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const getStaffScheduleById = async (id) => {
    const StaffSchedule = index_1.models.staffSchedule;
    const Department = index_1.models.department;
    const scheduleInstance = await StaffSchedule.findByPk(id, {
        include: [{ model: Department, as: "department", attributes: ["id", "name"] }]
    });
    if (!scheduleInstance) {
        throw new Error(`Schedule with ID ${id} not found.`);
    }
    return scheduleInstance;
};
exports.default = getStaffScheduleById;
