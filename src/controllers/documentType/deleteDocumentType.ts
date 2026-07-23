import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

const deleteDocumentType = async (id: number, companyId: number) => {
  const DocumentType = models.documentType as ModelStatic<Model>;
  return await DocumentType.update({ status: false }, { where: { id, companyId } });
};

export default deleteDocumentType;
