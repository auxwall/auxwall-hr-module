"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const updateUnauthorizedAttendence = async (id, data) => {
    const AttendenceSummary = index_1.models.attendenceSummary;
    const selectedAttendence = await AttendenceSummary.findByPk(id);
    if (!selectedAttendence) {
        throw new Error(`Attendence with ID ${id} not found.`);
    }
    return await selectedAttendence.update(data);
};
exports.default = updateUnauthorizedAttendence;
