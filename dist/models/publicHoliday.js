"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicHoliday = void 0;
const sequelize_1 = require("sequelize");
const commonName_1 = __importDefault(require("../config/commonName"));
const publicHoliday = (sequelize) => sequelize.define(commonName_1.default.publicHoliday.name, {
    companyId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    holidayDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false },
    endDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
    appliesTo: { type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'all' },
    isRecurring: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    createdBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true }
}, { indexes: [{ fields: ['companyId', 'holidayDate'] }, { unique: true, fields: ['companyId', 'name', 'holidayDate'] }] });
exports.publicHoliday = publicHoliday;
