import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

const deleteOfferLetter = async (id: number, companyId: number) => {
  const OfferLetter = models.offerLetter as ModelStatic<Model>;
  return await OfferLetter.destroy({ where: { id, companyId } });
};

export default deleteOfferLetter;
