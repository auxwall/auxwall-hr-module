import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

const getDocumentById = async (id: number) => {
  const Document = models.document as ModelStatic<Model>;
  const DocumentRenewal = models.documentRenewal as ModelStatic<Model>;
  return await Document.findByPk(id, {
    include: [{ model: DocumentRenewal, as: 'renewals' }]
  });
};

export default getDocumentById;
