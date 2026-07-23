"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const deleteDocumentType = async (id, companyId) => {
    const DocumentType = index_1.models.documentType;
    return await DocumentType.update({ status: false }, { where: { id, companyId } });
};
exports.default = deleteDocumentType;
