"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentType = void 0;
const sequelize_1 = require("sequelize");
const commonName_1 = __importDefault(require("../config/commonName"));
const documentType = (sequelize) => {
    return sequelize.define(commonName_1.default.documentType.name, {
        name: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
        scope: { type: sequelize_1.DataTypes.STRING },
        companyId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        status: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true }
    });
};
exports.documentType = documentType;
