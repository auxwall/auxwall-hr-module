"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const createDocumentType = async (data) => {
    const DocumentType = index_1.models.documentType;
    return await DocumentType.create(data);
};
exports.default = createDocumentType;
