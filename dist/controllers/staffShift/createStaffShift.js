"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const index_1 = require("../../index");
const createStaffShift = async (data) => {
    const StaffShift = index_1.models.staffShift;
    // Check for name/color clashes inside the same company
    const clashWhere = [];
    if (data.shiftName) {
        clashWhere.push({ shiftName: data.shiftName });
    }
    if (data.shiftColor) {
        clashWhere.push({ shiftColor: data.shiftColor });
    }
    if (clashWhere.length > 0) {
        const existingShift = await StaffShift.findOne({
            where: {
                companyId: data.companyId,
                [sequelize_1.Op.or]: clashWhere,
                ...(data.id ? { id: { [sequelize_1.Op.ne]: data.id } } : {}) // ignore the shift being edited
            }
        });
        if (existingShift) {
            if (existingShift.get("shiftName") === data.shiftName) {
                throw new Error("Shift already exists");
            }
            if (existingShift.get("shiftColor") === data.shiftColor) {
                throw new Error("Color already exists");
            }
        }
    }
    if (data.id) {
        const existing = await StaffShift.findByPk(data.id);
        if (!existing) {
            throw new Error(`Shift with ID ${data.id} not found.`);
        }
        return await existing.update(data);
    }
    return await StaffShift.create(data);
};
exports.default = createStaffShift;
