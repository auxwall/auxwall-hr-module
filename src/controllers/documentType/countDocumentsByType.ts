import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

const countDocumentsByType = async (documentTypeId: number, companyId: number): Promise<number> => {
  const Document = models.document as ModelStatic<Model>;
  return await Document.count({
    where: { documentTypeId, companyId }
  });
};

export default countDocumentsByType;
