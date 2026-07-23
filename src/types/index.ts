import { Model, ModelStatic } from "sequelize";

export type Models = {
  documentType: ModelStatic<Model>;
  document: ModelStatic<Model>;
  offerLetter: ModelStatic<Model>;
  documentRenewal: ModelStatic<Model>;
};
