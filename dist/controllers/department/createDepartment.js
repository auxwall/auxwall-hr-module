"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const createDepartment = async (data) => {
    const Department = index_1.models.department;
    if (data.id) {
        const existing = await Department.findByPk(data.id);
        if (existing) {
            return await existing.update(data);
        }
    }
    return await Department.create(data);
};
exports.default = createDepartment;
