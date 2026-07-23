import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

const getLastOfferLetterRef = async (companyId: number): Promise<string> => {
  const OfferLetter = models.offerLetter as ModelStatic<Model>;
  const letters = await OfferLetter.findAll({ where: { companyId } });
  if (letters && letters.length > 0) {
    // Find the offer letter with the highest ID
    const lastLetter = letters.reduce((max: any, letter: any) => (letter.id > max.id ? letter : max), letters[0]);
    return (lastLetter as any).refNo || "";
  }
  return "";
};

export default getLastOfferLetterRef;
