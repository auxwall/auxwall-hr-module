"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const index_1 = require("../../index");
const getDepartments = async (companyId, options = {}) => {
    const Department = index_1.models.department;
    const where = { companyId };
    if (options.status !== undefined) {
        where.status = options.status;
    }
    if (options.name) {
        where.name = {
            [sequelize_1.Op.iLike]: `%${options.name}%`
        };
    }
    const include = [];
    if (Department.associations.staffs) {
        include.push({ association: "staffs", required: false });
    }
    return await Department.findAll({ where, include, order: [["id", "ASC"]] });
};
exports.default = getDepartments;
