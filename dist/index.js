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
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.models = exports.setActiveModelsGetter = void 0;
const documentType_1 = require("./models/documentType");
const document_1 = require("./models/document");
const documentRenewal_1 = require("./models/documentRenewal");
const offerLetter_1 = require("./models/offerLetter");
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
    // Define Associations
    const m = exports.models;
    // Document associations
    m.document.belongsTo(m.documentType, { foreignKey: 'documentTypeId', as: 'documentType', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    m.documentType.hasMany(m.document, { foreignKey: 'documentTypeId', as: 'documents' });
    m.documentRenewal.belongsTo(m.document, { foreignKey: 'documentId', as: 'document', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    m.document.hasMany(m.documentRenewal, { foreignKey: 'documentId', as: 'renewals' });
    if (companyModel) {
        m.documentType.belongsTo(companyModel, { foreignKey: 'companyId', as: 'company' });
        m.document.belongsTo(companyModel, { foreignKey: 'companyId', as: 'company' });
        m.offerLetter.belongsTo(companyModel, { foreignKey: 'companyId', as: 'company' });
    }
    if (staffModel) {
        m.document.belongsTo(staffModel, { foreignKey: 'staffId', as: 'staff' });
    }
    console.log("HR Management Database Models Initialized.");
    return exports.models;
};
exports.initializeDatabase = initializeDatabase;
// Export controllers
__exportStar(require("./controllers/documentType"), exports);
__exportStar(require("./controllers/document"), exports);
__exportStar(require("./controllers/offerLetter"), exports);
