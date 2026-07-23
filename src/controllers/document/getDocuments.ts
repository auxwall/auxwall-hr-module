import { Model, ModelStatic, Op } from "sequelize";
import { models } from "../../index";

const getDocuments = async ( companyId: number, options: { scope?: 'Staff' | 'Company'; staffId?: number; documentTypeId?: number; dateFrom?: string; dateTo?: string; statuses?: string[];} = {}) => {
  const Document = models.document as ModelStatic<Model>;
  const DocumentType = models.documentType as ModelStatic<Model>;
  const DocumentRenewal = models.documentRenewal as ModelStatic<Model>;
  const where: any = { companyId };

  if (options.staffId) {
    where.staffId = options.staffId;
  }
  if (options.documentTypeId) {
    where.documentTypeId = options.documentTypeId;
  }

  const include: any[] = [];
  if (DocumentType) {
    const typeWhere: any = {};
    if (options.scope) {
      typeWhere.scope = options.scope;
    }
    include.push({ model: DocumentType, as: 'documentType', where: typeWhere, required: true });
  }

  if (Document.associations.staff) {
    include.push({ association: 'staff', required: false });
  }

  if (DocumentRenewal) {
    include.push({ model: DocumentRenewal, as: 'renewals', required: false });
  }

  return await Document.findAll({ 
    where, 
    include, 
    order: [
      ['id', 'DESC'],
      [{ model: DocumentRenewal, as: 'renewals' }, 'expiryDate', 'DESC']
    ] 
  });
};

export default getDocuments;
