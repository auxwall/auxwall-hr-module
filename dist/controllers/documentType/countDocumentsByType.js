"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const countDocumentsByType = async (documentTypeId, companyId) => {
    const Document = index_1.models.document;
    return await Document.count({
        where: { documentTypeId, companyId }
    });
};
exports.default = countDocumentsByType;
