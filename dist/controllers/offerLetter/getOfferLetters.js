"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const index_1 = require("../../index");
const getOfferLetters = async (companyId, options = {}) => {
    const OfferLetter = index_1.models.offerLetter;
    const where = { companyId };
    if (options.search) {
        const q = `%${options.search}%`;
        where[sequelize_1.Op.or] = [
            { candidateName: { [sequelize_1.Op.iLike]: q } },
            { designation: { [sequelize_1.Op.iLike]: q } },
            { refNo: { [sequelize_1.Op.iLike]: q } }
        ];
    }
    if (options.dateFrom && options.dateTo) {
        where.createdAt = { [sequelize_1.Op.between]: [options.dateFrom, options.dateTo] };
    }
    else if (options.dateFrom) {
        where.createdAt = { [sequelize_1.Op.gte]: options.dateFrom };
    }
    else if (options.dateTo) {
        where.createdAt = { [sequelize_1.Op.lte]: options.dateTo };
    }
    return await OfferLetter.findAll({ where, order: [['id', 'DESC']] });
};
exports.default = getOfferLetters;
