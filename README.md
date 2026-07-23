# Auxwall HR Management

The `auxwall-hrmanagement` is a standalone Node.js/TypeScript package that encapsulates the database models and business logic controllers for the HR capabilities of the Auxwall ecosystem. 

It is designed to be imported into the main `auxwallBackNodeJs` service and provides a multi-tenant-aware architecture for handling company staff documents, offer letters, and document renewals.

## Features

- **Document Type Management**: Manage customizable categories for HR documents (e.g., ID Cards, Visas, Contracts) scoped either to the `Company` or to individual `Staff`.
- **Document Management**: Upload, retrieve, and delete documents linked to staff members. 
- **Renewal Logs (Document History)**: A robust logging system that retains the history of documents. Expiry dates, issue dates, and files are version-controlled via the `DocumentRenewal` model.
- **Offer Letters**: Generation, parsing, and management of employee offer letters.
- **Multi-Tenancy Support**: Seamlessly handles multiple companies via a `companyId` context in database associations and queries.

## Installation

Because this is a locally linked package, install it in your main backend project by linking the directory or defining it in `package.json`:

```bash
npm install auxwall-hr-management
```

And then run the build process inside the module folder whenever you make changes:
```bash
npm run build
```

## Database Initialization

To inject your active Sequelize instance and optional Company/Staff models (from `auxwall-accounts` or your main DB), initialize the models at the startup of your main server:

```javascript
const { initializeDatabase } = require('auxwall-hrmanagement');
const { sequelize, company, users } = require('./config/dbConnection');

// Initialize HR Models
initializeDatabase(sequelize, company, users).then(() => {
  console.log("HR Management Database initialized");
});
```

## Models

This module exposes the following Sequelize models:

1. **`documentType`**: Defines the category/type of a document.
2. **`document`**: The parent record of an uploaded document. Links directly to a `Staff` and `Company`.
3. **`documentRenewal`**: The historical child records of a `document`. Contains the actual file payload, issue date, and expiry date. Whenever a document is renewed, a new renewal record is created.
4. **`offerLetter`**: Stores offer letter data for prospective employees.

Table names are configured inside `src/config/commonName.ts`.

## Controllers

The package provides pre-built business logic controllers. Import what you need directly:

```javascript
const hrModule = require('auxwall-hrmanagement');

// Example: hrModule.createDocument(data)
// Example: hrModule.getDocuments(companyId, options)
```

### Available Controllers

#### Document Type (`/src/controllers/documentType`)
- `createDocumentType(data)`
- `getDocumentTypes(companyId, options)`
- `deleteDocumentType(id)`

#### Document (`/src/controllers/document`)
- `createDocument(data)`
- `getDocuments(companyId, options)`
- `deleteDocument(id, companyId)`
- `getDocumentById(id)`

#### Offer Letter (`/src/controllers/offerLetter`)
- `createOfferLetter(data)`
- `getOfferLetters(companyId)`
- `getOfferLetterById(id)`
- `deleteOfferLetter(id)`

## Project Structure

```
├── src/
│   ├── config/          # Table name configurations
│   ├── controllers/     # Business logic for all modules
│   ├── models/          # Sequelize schema definitions
│   ├── types/           # TypeScript interfaces
│   └── index.ts         # Main entry point & DB Initialization
├── dist/                # Transpiled output (CommonJS)
├── package.json
└── tsconfig.json
```

## Dependencies
- `sequelize` & `pg` (Peer dependencies)
- `moment`
- `http-status`
