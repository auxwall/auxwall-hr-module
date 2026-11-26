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
  employeeProfile: ModelStatic<Model>;
  employeeHistory: ModelStatic<Model>;
  employeeTask: ModelStatic<Model>;
  publicHoliday: ModelStatic<Model>;
  leaveType: ModelStatic<Model>;
  leaveRequest: ModelStatic<Model>;
  trainingRecord: ModelStatic<Model>;
  performanceReview: ModelStatic<Model>;
  finalSettlement: ModelStatic<Model>;
  companyAsset: ModelStatic<Model>;
  assetCategory: ModelStatic<Model>;
};
