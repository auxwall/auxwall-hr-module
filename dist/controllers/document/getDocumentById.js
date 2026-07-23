"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const getDocumentById = async (id) => {
    const Document = index_1.models.document;
    const DocumentRenewal = index_1.models.documentRenewal;
    return await Document.findByPk(id, {
        include: [{ model: DocumentRenewal, as: 'renewals' }]
    });
};
exports.default = getDocumentById;
