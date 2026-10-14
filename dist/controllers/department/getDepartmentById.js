"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const getDepartmentById = async (id) => {
    const Department = index_1.models.department;
    const include = [];
    if (Department.associations.staffs) {
        include.push({ association: "staffs", required: false });
    }
    return await Department.findByPk(id, { include });
};
exports.default = getDepartmentById;
