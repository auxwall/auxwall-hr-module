"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const index_1 = require("../../index");
const getStaffShifts = async (companyId, options = {}) => {
    const StaffShift = index_1.models.staffShift;
    const Department = index_1.models.department;
    const where = { companyId };
    if (options.departmentId) {
        where.departmentId = options.departmentId;
    }
    if (options.name) {
        where.shiftName = { [sequelize_1.Op.iLike]: `%${options.name}%` };
    }
    const queryOptions = {
        where,
        include: [
            { model: Department, as: 'department', attributes: ['id', 'name'] }
        ],
        order: [['id', 'ASC']]
    };
    const isPaginated = options.limit !== undefined && options.offset !== undefined;
    if (isPaginated) {
        queryOptions.limit = options.limit;
        queryOptions.offset = options.offset;
    }
    if (isPaginated) {
        return await StaffShift.findAndCountAll(queryOptions);
    }
    return await StaffShift.findAll(queryOptions);
};
exports.default = getStaffShifts;
