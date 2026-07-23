import { Model, ModelStatic, Op } from "sequelize";
import { models } from "../../index";

const getOfferLetters = async (companyId: number, options: { search?: string; dateFrom?: string; dateTo?: string } = {}) => {
  const OfferLetter = models.offerLetter as ModelStatic<Model>;
  
  const where: any = { companyId };

  if (options.search) {
    const q = `%${options.search}%`;
    where[Op.or] = [
      { candidateName: { [Op.iLike]: q } },
      { designation: { [Op.iLike]: q } },
      { refNo: { [Op.iLike]: q } }
    ];
  }

  if (options.dateFrom && options.dateTo) {
    where.createdAt = { [Op.between]: [options.dateFrom, options.dateTo] };
  } else if (options.dateFrom) {
    where.createdAt = { [Op.gte]: options.dateFrom };
  } else if (options.dateTo) {
    where.createdAt = { [Op.lte]: options.dateTo };
  }

  return await OfferLetter.findAll({ where, order: [['id', 'DESC']] });
};

export default getOfferLetters;
