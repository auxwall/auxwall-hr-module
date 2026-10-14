"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffShift = void 0;
const sequelize_1 = require("sequelize");
const commonName_1 = __importDefault(require("../config/commonName"));
const staffShift = (sequelize) => {
    return sequelize.define(commonName_1.default.staffShift.name, {
        uploadedBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
        shiftName: { type: sequelize_1.DataTypes.STRING, allowNull: false },
        shiftColor: { type: sequelize_1.DataTypes.STRING, allowNull: true },
        shiftStart: { type: sequelize_1.DataTypes.TIME, allowNull: false },
        shiftEnd: { type: sequelize_1.DataTypes.TIME, allowNull: false },
        breakMinutes: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
        lateGraceMinutes: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
        overtimeMinutes: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
        companyId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
        departmentId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true }
    });
};
exports.staffShift = staffShift;
