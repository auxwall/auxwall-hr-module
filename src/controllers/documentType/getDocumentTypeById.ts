import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

const getDocumentTypeById = async (id: number) => {
  const DocumentType = models.documentType as ModelStatic<Model>;
  return await DocumentType.findByPk(id);
};

export default getDocumentTypeById;
