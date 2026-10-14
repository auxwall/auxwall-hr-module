"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const createStaffSchedule = async (data) => {
    const StaffSchedule = index_1.models.staffSchedule;
    if (data.id) {
        const existing = await StaffSchedule.findByPk(data.id);
        if (existing) {
            const existingData = typeof existing.get('data') === "string" ? JSON.parse(existing.get('data')) : existing.get('data') || {};
            const newData = typeof data.data === "string" ? JSON.parse(data.data) : data.data;
            const mergedData = { ...existingData, ...newData };
            return await existing.update({ ...data, data: mergedData });
        }
    }
    return await StaffSchedule.create(data);
};
exports.default = createStaffSchedule;
