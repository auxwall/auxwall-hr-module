import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

interface Data { id?: number; staffId?: number; companyId: number; documentTypeId: number; documentNumber: string; issueDate?: string; expiryDate?: string; fileURL?: string; notes?: string; createdBy?: number; }

const createDocument = async (data: Data) => {
  const Document = models.document as ModelStatic<Model>;
  const DocumentRenewal = models.documentRenewal as ModelStatic<Model>;

  let parentDoc: Model | null = null;

  if (data.staffId) {
    parentDoc = await Document.findOne({where: {staffId: data.staffId,companyId: data.companyId,documentTypeId: data.documentTypeId}});
  } else {
    parentDoc = await Document.findOne({where: {companyId: data.companyId,documentTypeId: data.documentTypeId,staffId: null}});
  }

  if (!parentDoc) {
    parentDoc = await Document.create({staffId: data.staffId || null,companyId: data.companyId,documentTypeId: data.documentTypeId,status: 'Active'});
  }

  if (data.id) {
    const existingRenewal = await DocumentRenewal.findByPk(data.id);
    if (existingRenewal) {
      const updatePayload: any = {documentNumber: data.documentNumber,issueDate: data.issueDate || null,expiryDate: data.expiryDate || null,fileURL: data.fileURL || existingRenewal.get('fileURL'),notes: data.notes || null};
      if (data.createdBy) updatePayload.createdBy = data.createdBy;
      await existingRenewal.update(updatePayload);
      return parentDoc;
    }
  }

  await DocumentRenewal.create({documentId: parentDoc.get('id'),documentNumber: data.documentNumber,issueDate: data.issueDate || null,expiryDate: data.expiryDate || null,fileURL: data.fileURL || null,notes: data.notes || null,createdBy: data.createdBy || null});

  return parentDoc;
};

export default createDocument;
