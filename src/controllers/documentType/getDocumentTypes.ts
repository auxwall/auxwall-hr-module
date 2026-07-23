import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

const getDocumentTypes = async (companyId: number, scope?: 'Staff' | 'Company') => {
  const DocumentType = models.documentType as ModelStatic<Model>;
  const where: any = { companyId, status: true };
  if (scope) {
    where.scope = scope;
  }
  return await DocumentType.findAll({ where });
};

export default getDocumentTypes;
