"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffSchedule = void 0;
const sequelize_1 = require("sequelize");
const commonName_1 = __importDefault(require("../config/commonName"));
const staffSchedule = (sequelize) => {
    return sequelize.define(commonName_1.default.staffSchedule.name, {
        name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
        type: { type: sequelize_1.DataTypes.STRING, allowNull: false },
        data: { type: sequelize_1.DataTypes.JSON, allowNull: false },
        companyId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
        departmentId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
        createdBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true }
    });
};
exports.staffSchedule = staffSchedule;
