"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const getLastOfferLetterRef = async (companyId) => {
    const OfferLetter = index_1.models.offerLetter;
    const letters = await OfferLetter.findAll({ where: { companyId } });
    if (letters && letters.length > 0) {
        // Find the offer letter with the highest ID
        const lastLetter = letters.reduce((max, letter) => (letter.id > max.id ? letter : max), letters[0]);
        return lastLetter.refNo || "";
    }
    return "";
};
exports.default = getLastOfferLetterRef;
