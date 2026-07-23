"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const createOfferLetter = async (data) => {
    const OfferLetter = index_1.models.offerLetter;
    if (data.id) {
        const existing = await OfferLetter.findByPk(data.id);
        if (existing) {
            return await existing.update(data);
        }
    }
    return await OfferLetter.create(data);
};
exports.default = createOfferLetter;
