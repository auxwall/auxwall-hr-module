import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

interface Data { companyId: number; candidateName: string; designation: string; startDate?: string; probation?: number; duration?: number; basic?: number; housing?: number; transport?: number; allowances?: string; annualLeave?: number; status?: string; noticePeriod?: string; workingHours?: string; signatoryName?: string; signatoryTitle?: string; }

const createOfferLetter = async (data: Data & { id?: number }) => {
  const OfferLetter = models.offerLetter as ModelStatic<Model>;
  if (data.id) {
    const existing = await OfferLetter.findByPk(data.id);
    if (existing) {
      return await existing.update(data as any);
    }
  }
  return await OfferLetter.create(data as any);
};

export default createOfferLetter;
