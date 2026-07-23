"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const deleteDocument = async (id, companyId) => {
    const Document = index_1.models.document;
    return await Document.destroy({ where: { id, companyId } });
};
exports.default = deleteDocument;
