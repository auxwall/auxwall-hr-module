import { Model, ModelStatic, Sequelize } from "sequelize";
import { Models } from "./types";
import { documentType } from "./models/documentType";
import { document } from "./models/document";
import { documentRenewal } from "./models/documentRenewal";
import { offerLetter } from "./models/offerLetter";
import { department } from "./models/department";
import { staffSchedule } from "./models/staffSchedule";
import { staffShift } from "./models/staffShift";
import { attendenceSummary } from "./models/attendenceSummary";
import defineCronLog from "./models/cronLog";
import { initAttendanceCron } from "./utils/attendenceSync";
import { employeeProfile as defineEmployeeProfile } from "./models/employeeProfile";
import { employeeHistory as defineEmployeeHistory } from "./models/employeeHistory";
import { employeeTask as defineEmployeeTask } from "./models/employeeTask";
import { publicHoliday as definePublicHoliday } from "./models/publicHoliday";
import { leaveType as defineLeaveType } from "./models/leaveType";
import { leaveRequest as defineLeaveRequest } from "./models/leaveRequest";
import { trainingRecord as defineTrainingRecord } from "./models/trainingRecord";
import { performanceReview as definePerformanceReview } from "./models/performanceReview";
import { finalSettlement as defineFinalSettlement } from "./models/finalSettlement";
import { companyAsset as defineCompanyAsset } from "./models/companyAsset";
import { assetCategory as defineAssetCategory } from "./models/assetCategory";

// Global models storage (fallback/legacy)
const internalModels: Partial<Models> = {};

// Context-aware models getter (allows multi-tenancy)
let activeModelsGetter: () => Partial<Models> | null = () => null;

export const setActiveModelsGetter = (getter: () => Partial<Models> | null) => {
  activeModelsGetter = getter;
};

export const models = new Proxy(internalModels, {
  get(target, prop, receiver) {
    const active = activeModelsGetter();
    if (active && (active as any)[prop]) {
      return (active as any)[prop];
    }
    return Reflect.get(target, prop, receiver);
  },
  set(target, prop, value, receiver) {
    return Reflect.set(target, prop, value, receiver);
  }
});

// Export database initialization
export const initializeDatabase = async ( sequelize: Sequelize, companyModel?: ModelStatic<Model>, staffModel?: ModelStatic<Model> ): Promise<Partial<Models>> => {
  console.log("Initializing HR Management Database Models...");

  models.documentType = documentType(sequelize);
  models.document = document(sequelize);
  models.documentRenewal = documentRenewal(sequelize);
  models.offerLetter = offerLetter(sequelize);
  models.department = department(sequelize);
  models.staffSchedule = staffSchedule(sequelize);
  models.staffShift = staffShift(sequelize);
  models.attendenceSummary = attendenceSummary(sequelize);
  models.cronLog = defineCronLog(sequelize);
  models.employeeProfile = defineEmployeeProfile(sequelize);
  models.employeeHistory = defineEmployeeHistory(sequelize);
  models.employeeTask = defineEmployeeTask(sequelize);
  models.publicHoliday = definePublicHoliday(sequelize);
  models.leaveType = defineLeaveType(sequelize);
  models.leaveRequest = defineLeaveRequest(sequelize);
  models.trainingRecord = defineTrainingRecord(sequelize);
  models.performanceReview = definePerformanceReview(sequelize);
  models.finalSettlement = defineFinalSettlement(sequelize);
  models.companyAsset = defineCompanyAsset(sequelize);
  models.assetCategory = defineAssetCategory(sequelize);

  if (staffModel) {
    (models as any).staff = staffModel;
  }
  if (companyModel) {
    (models as any).company = companyModel;
  }

  // Define Associations
  const m = models as Required<Models>;

  // Document associations
  m.document.belongsTo(m.documentType, { foreignKey: 'documentTypeId', as: 'documentType', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  m.documentType.hasMany(m.document, { foreignKey: 'documentTypeId', as: 'documents' });

  m.documentRenewal.belongsTo(m.document, { foreignKey: 'documentId', as: 'document', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  m.document.hasMany(m.documentRenewal, { foreignKey: 'documentId', as: 'renewals' });

  // StaffSchedule associations
  m.staffSchedule.belongsTo(m.department, { foreignKey: 'departmentId', as: 'department', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
  m.department.hasMany(m.staffSchedule, { foreignKey: 'departmentId', as: 'staffSchedules' });

  // StaffShift associations
  m.staffShift.belongsTo(m.department, { foreignKey: 'departmentId', as: 'department', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
  m.department.hasMany(m.staffShift, { foreignKey: 'departmentId', as: 'shifts' });
  m.staffShift.hasMany(m.staffSchedule, { foreignKey: 'shiftId', as: 'staffSchedules', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
  m.staffSchedule.belongsTo(m.staffShift, { foreignKey: 'shiftId', as: 'shift' });

  if (companyModel) {
    m.documentType.belongsTo(companyModel, { foreignKey: 'companyId', as: 'company' });
    m.document.belongsTo(companyModel, { foreignKey: 'companyId', as: 'company' });
    m.offerLetter.belongsTo(companyModel, { foreignKey: 'companyId', as: 'company' });
    m.department.belongsTo(companyModel, { foreignKey: 'companyId', as: 'company' });
    m.staffSchedule.belongsTo(companyModel, { foreignKey: 'companyId', as: 'company' });
    m.staffShift.belongsTo(companyModel, { foreignKey: 'companyId', as: 'company' });
  }

  if (staffModel) {
    m.document.belongsTo(staffModel, { foreignKey: 'staffId', as: 'staff' });
    m.department.hasMany(staffModel, { foreignKey: 'departmentId', as: 'staffs' });
    staffModel.belongsTo(m.department, { foreignKey: 'departmentId', as: 'department' });
    m.staffSchedule.hasMany(staffModel, { foreignKey: 'scheduleId', as: 'staffs' });
    staffModel.belongsTo(m.staffSchedule, { foreignKey: 'scheduleId', as: 'staffSchedule' });
    m.staffShift.belongsTo(staffModel, { foreignKey: 'uploadedBy', as: 'uploader' });
    m.staffShift.hasMany(staffModel, { foreignKey: 'shiftId', as: 'staffs' });
    staffModel.belongsTo(m.staffShift, { foreignKey: 'shiftId', as: 'shift' });
    m.attendenceSummary.belongsTo(staffModel, { foreignKey: 'staffId', as: 'staff' });
    m.employeeProfile.belongsTo(staffModel, { foreignKey: 'staffId', as: 'employee' });
    m.employeeTask.belongsTo(staffModel, { foreignKey: 'staffId', as: 'employee' });
    m.trainingRecord.belongsTo(staffModel, { foreignKey: 'staffId', as: 'employee' });
    m.performanceReview.belongsTo(staffModel, { foreignKey: 'staffId', as: 'employee' });
    m.finalSettlement.belongsTo(staffModel, { foreignKey: 'staffId', as: 'employee' });
    m.companyAsset.belongsTo(staffModel, { foreignKey: 'staffId', as: 'employee' });
    m.employeeProfile.belongsTo(staffModel, { foreignKey: 'managerId', as: 'manager' });
  }

  m.leaveRequest.belongsTo(m.leaveType, { foreignKey: 'leaveTypeId', as: 'leaveType' });
  m.leaveType.hasMany(m.leaveRequest, { foreignKey: 'leaveTypeId', as: 'requests' });
  await Promise.all(
    [
      m.employeeProfile,
      m.employeeHistory,
      m.employeeTask,
      m.publicHoliday,
      m.leaveType,
      m.leaveRequest,
      m.trainingRecord,
      m.performanceReview,
      m.finalSettlement,
      m.companyAsset,
      m.assetCategory,
    ].map(model => model.sync()),
  );
  console.log("HR Management Database Models Initialized.");
  return m;
};

export { initAttendanceCron };

// Export controllers
export * from "./controllers/documentType/index";
export * from "./controllers/document/index";
export * from "./controllers/offerLetter/index";
export * from "./controllers/department/index";
export * from "./controllers/staffSchedule/index";
export * from "./controllers/staffShift/index";
export * from "./controllers/attendenceSummary/index";
export * from "./controllers/dashboard/index";
export { updateAttendanceSummary } from "./utils/attendenceLogic";
export * from "./controllers/lifecycle/index";
export * from "./controllers/publicHoliday/index";
export * from "./controllers/leave/index";
export * from "./controllers/development/index";
export * from "./controllers/settlement/index";
export * from "./controllers/assets/index";
