"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const getDocuments = async (companyId, options = {}) => {
    const Document = index_1.models.document;
    const DocumentType = index_1.models.documentType;
    const DocumentRenewal = index_1.models.documentRenewal;
    const where = { companyId };
    if (options.staffId) {
        where.staffId = options.staffId;
    }
    if (options.documentTypeId) {
        where.documentTypeId = options.documentTypeId;
    }
    const include = [];
    if (DocumentType) {
        const typeWhere = {};
        if (options.scope) {
            typeWhere.scope = options.scope;
        }
        include.push({ model: DocumentType, as: 'documentType', where: typeWhere, required: true });
    }
    if (Document.associations.staff) {
        include.push({ association: 'staff', required: false });
    }
    if (DocumentRenewal) {
        include.push({ model: DocumentRenewal, as: 'renewals', required: false });
    }
    return await Document.findAll({
        where,
        include,
        order: [
            ['id', 'DESC'],
            [{ model: DocumentRenewal, as: 'renewals' }, 'expiryDate', 'DESC']
        ]
    });
};
exports.default = getDocuments;
