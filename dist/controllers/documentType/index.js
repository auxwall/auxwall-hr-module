"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.countDocumentsByType = exports.getDocumentTypeById = exports.deleteDocumentType = exports.getDocumentTypes = exports.createDocumentType = void 0;
const createDocumentType_1 = __importDefault(require("./createDocumentType"));
exports.createDocumentType = createDocumentType_1.default;
const countDocumentsByType_1 = __importDefault(require("./countDocumentsByType"));
exports.countDocumentsByType = countDocumentsByType_1.default;
const getDocumentTypes_1 = __importDefault(require("./getDocumentTypes"));
exports.getDocumentTypes = getDocumentTypes_1.default;
const deleteDocumentType_1 = __importDefault(require("./deleteDocumentType"));
exports.deleteDocumentType = deleteDocumentType_1.default;
const getDocumentTypeById_1 = __importDefault(require("./getDocumentTypeById"));
exports.getDocumentTypeById = getDocumentTypeById_1.default;
