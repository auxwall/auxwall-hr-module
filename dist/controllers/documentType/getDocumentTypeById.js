"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const getDocumentTypeById = async (id) => {
    const DocumentType = index_1.models.documentType;
    return await DocumentType.findByPk(id);
};
exports.default = getDocumentTypeById;
