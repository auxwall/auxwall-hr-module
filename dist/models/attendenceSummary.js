"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendenceSummary = void 0;
const sequelize_1 = require("sequelize");
const commonName_1 = __importDefault(require("../config/commonName"));
const attendenceSummary = (sequelize) => {
    return sequelize.define(commonName_1.default.attendenceSummary.name, {
        staffId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
        staffName: { type: sequelize_1.DataTypes.STRING, allowNull: true },
        attendenceDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
        shiftStart: { type: sequelize_1.DataTypes.TIME, allowNull: true },
        shiftEnd: { type: sequelize_1.DataTypes.TIME, allowNull: true },
        first_in: { type: sequelize_1.DataTypes.TIME, allowNull: true },
        last_out: { type: sequelize_1.DataTypes.TIME, allowNull: true },
        workedMinutes: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
        lateMinutes: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
        overtimeMinutes: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
        breakMinutes: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
        totalPunches: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
        status: { type: sequelize_1.DataTypes.STRING(), allowNull: true },
        companyId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true }
    }, {
        indexes: [{ unique: true, fields: ['staffId', 'attendenceDate'] }]
    });
};
exports.attendenceSummary = attendenceSummary;
