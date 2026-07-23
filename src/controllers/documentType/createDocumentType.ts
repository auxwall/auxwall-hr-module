import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

interface Data { name: string; scope: 'Staff' | 'Company'; companyId: number; }

const createDocumentType = async (data: Data) => {
  const DocumentType = models.documentType as ModelStatic<Model>;
  return await DocumentType.create(data as any);
};

export default createDocumentType;
