import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

const deleteDocument = async (id: number, companyId: number) => {
  const Document = models.document as ModelStatic<Model>;
  return await Document.destroy({ where: { id, companyId } });
};

export default deleteDocument;
