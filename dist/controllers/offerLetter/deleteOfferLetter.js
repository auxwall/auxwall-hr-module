"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const deleteOfferLetter = async (id, companyId) => {
    const OfferLetter = index_1.models.offerLetter;
    return await OfferLetter.destroy({ where: { id, companyId } });
};
exports.default = deleteOfferLetter;
