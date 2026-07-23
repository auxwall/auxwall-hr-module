"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const getDocumentTypes = async (companyId, scope) => {
    const DocumentType = index_1.models.documentType;
    const where = { companyId, status: true };
    if (scope) {
        where.scope = scope;
    }
    return await DocumentType.findAll({ where });
};
exports.default = getDocumentTypes;
