import { Model, ModelStatic, Sequelize } from "sequelize";
import { Models } from "./types";
import { documentType } from "./models/documentType";
import { document } from "./models/document";
import { documentRenewal } from "./models/documentRenewal";
import { offerLetter } from "./models/offerLetter";

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

  // Define Associations
  const m = models as Required<Models>;

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
  return models;
};

// Export controllers
export * from "./controllers/documentType";
export * from "./controllers/document";
export * from "./controllers/offerLetter";
