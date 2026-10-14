"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const getAttendenceStatus = async () => {
    const AttendenceSummary = index_1.models.attendenceSummary;
    return AttendenceSummary.rawAttributes.status.values;
};
exports.default = getAttendenceStatus;
