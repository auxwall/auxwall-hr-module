"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocumentById = exports.deleteDocument = exports.getDocuments = exports.createDocument = void 0;
const createDocument_1 = __importDefault(require("./createDocument"));
exports.createDocument = createDocument_1.default;
const getDocuments_1 = __importDefault(require("./getDocuments"));
exports.getDocuments = getDocuments_1.default;
const deleteDocument_1 = __importDefault(require("./deleteDocument"));
exports.deleteDocument = deleteDocument_1.default;
const getDocumentById_1 = __importDefault(require("./getDocumentById"));
exports.getDocumentById = getDocumentById_1.default;
