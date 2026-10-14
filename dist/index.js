"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAttendanceSummary = exports.initAttendanceCron = exports.initializeDatabase = exports.models = exports.setActiveModelsGetter = void 0;
const documentType_1 = require("./models/documentType");
const document_1 = require("./models/document");
const documentRenewal_1 = require("./models/documentRenewal");
const offerLetter_1 = require("./models/offerLetter");
const department_1 = require("./models/department");
const staffSchedule_1 = require("./models/staffSchedule");
const staffShift_1 = require("./models/staffShift");
const attendenceSummary_1 = require("./models/attendenceSummary");
const cronLog_1 = __importDefault(require("./models/cronLog"));
const attendenceSync_1 = require("./utils/attendenceSync");
Object.defineProperty(exports, "initAttendanceCron", { enumerable: true, get: function () { return attendenceSync_1.initAttendanceCron; } });
// Global models storage (fallback/legacy)
const internalModels = {};
// Context-aware models getter (allows multi-tenancy)
let activeModelsGetter = () => null;
const setActiveModelsGetter = (getter) => {
    activeModelsGetter = getter;
};
exports.setActiveModelsGetter = setActiveModelsGetter;
exports.models = new Proxy(internalModels, {
    get(target, prop, receiver) {
        const active = activeModelsGetter();
        if (active && active[prop]) {
            return active[prop];
        }
        return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
        return Reflect.set(target, prop, value, receiver);
    }
});
// Export database initialization
const initializeDatabase = async (sequelize, companyModel, staffModel) => {
    console.log("Initializing HR Management Database Models...");
    exports.models.documentType = (0, documentType_1.documentType)(sequelize);
    exports.models.document = (0, document_1.document)(sequelize);
    exports.models.documentRenewal = (0, documentRenewal_1.documentRenewal)(sequelize);
    exports.models.offerLetter = (0, offerLetter_1.offerLetter)(sequelize);
    exports.models.department = (0, department_1.department)(sequelize);
    exports.models.staffSchedule = (0, staffSchedule_1.staffSchedule)(sequelize);
    exports.models.staffShift = (0, staffShift_1.staffShift)(sequelize);
    exports.models.attendenceSummary = (0, attendenceSummary_1.attendenceSummary)(sequelize);
    exports.models.cronLog = (0, cronLog_1.default)(sequelize);
    if (staffModel) {
        exports.models.staff = staffModel;
    }
    if (companyModel) {
        exports.models.company = companyModel;
    }
    // Define Associations
    const m = exports.models;
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
    }
    console.log("HR Management Database Models Initialized.");
    return m;
};
exports.initializeDatabase = initializeDatabase;
// Export controllers
__exportStar(require("./controllers/documentType/index"), exports);
__exportStar(require("./controllers/document/index"), exports);
__exportStar(require("./controllers/offerLetter/index"), exports);
__exportStar(require("./controllers/department/index"), exports);
__exportStar(require("./controllers/staffSchedule/index"), exports);
__exportStar(require("./controllers/staffShift/index"), exports);
__exportStar(require("./controllers/attendenceSummary/index"), exports);
__exportStar(require("./controllers/dashboard/index"), exports);
var attendenceLogic_1 = require("./utils/attendenceLogic");
Object.defineProperty(exports, "updateAttendanceSummary", { enumerable: true, get: function () { return attendenceLogic_1.updateAttendanceSummary; } });
