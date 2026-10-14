import { Model, ModelStatic } from "sequelize";

export type Models = {
  documentType: ModelStatic<Model>;
  document: ModelStatic<Model>;
  offerLetter: ModelStatic<Model>;
  documentRenewal: ModelStatic<Model>;
  department: ModelStatic<Model>;
  staffSchedule: ModelStatic<Model>;
  staffShift: ModelStatic<Model>;
  attendenceSummary: ModelStatic<Model>;
  staff?: ModelStatic<Model>;
  company?: ModelStatic<Model>;
  cronLog: ModelStatic<Model>;
};
