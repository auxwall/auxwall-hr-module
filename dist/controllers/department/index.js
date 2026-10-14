"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDepartment = exports.getDepartmentById = exports.getDepartments = exports.createDepartment = void 0;
const createDepartment_1 = __importDefault(require("./createDepartment"));
exports.createDepartment = createDepartment_1.default;
const getDepartments_1 = __importDefault(require("./getDepartments"));
exports.getDepartments = getDepartments_1.default;
const getDepartmentById_1 = __importDefault(require("./getDepartmentById"));
exports.getDepartmentById = getDepartmentById_1.default;
const deleteDepartment_1 = __importDefault(require("./deleteDepartment"));
exports.deleteDepartment = deleteDepartment_1.default;
