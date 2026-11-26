"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHrOperationsDashboardStats = exports.getHrDashboardStats = void 0;
const getHrDashboardStats_1 = __importDefault(require("./getHrDashboardStats"));
exports.getHrDashboardStats = getHrDashboardStats_1.default;
var getHrOperationsDashboardStats_1 = require("./getHrOperationsDashboardStats");
Object.defineProperty(exports, "getHrOperationsDashboardStats", { enumerable: true, get: function () { return __importDefault(getHrOperationsDashboardStats_1).default; } });
