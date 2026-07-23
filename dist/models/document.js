"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.document = void 0;
const sequelize_1 = require("sequelize");
const commonName_1 = __importDefault(require("../config/commonName"));
const document = (sequelize) => {
    return sequelize.define(commonName_1.default.document.name, {
        staffId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
        companyId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        documentTypeId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        status: { type: sequelize_1.DataTypes.TEXT, defaultValue: 'Active' }
    });
};
exports.document = document;
