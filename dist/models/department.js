"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.department = void 0;
const sequelize_1 = require("sequelize");
const commonName_1 = __importDefault(require("../config/commonName"));
const department = (sequelize) => {
    return sequelize.define(commonName_1.default.department.name, {
        name: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
        companyId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        status: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true },
        createdBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true }
    });
};
exports.department = department;
