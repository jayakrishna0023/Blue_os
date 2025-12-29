# Shared Module

## Overview
This module contains components, services, and utilities shared across all fishery modules (Wild Fishery, Aquaculture, and Mariculture).

## Structure

### components/
- **Auth/** - Authentication components (Login, Registration, etc.)
- **Public/** - Public-facing components (Traceability, About, etc.)
- **Shared/** - Reusable UI components (Toast, Modal, etc.)

### services/
- **api.js** - API service layer for backend communication
- **utils.js** - Utility functions
- **constants.js** - Application constants
- **faoConstants.js** - FAO species and port codes

### context/
- **LanguageContext.jsx** - Multi-language support (English/Tamil)

## Key Features

### Authentication
- Staff login (username/password)
- Fisher/Vessel Owner login (OTP-based)
- Session management
- Role-based access control

### Localization
- English and Tamil language support
- Dynamic language switching
- Translation management

### Public Features
- QR-based traceability
- Vessel registry
- Public information pages

## Usage
All modules should import shared components and services from this module to maintain consistency and avoid code duplication.

Example:
```javascript
import { authAPI } from '../shared/services/api';
import { Toast } from '../shared/components/Shared/Toast';
import { LanguageProvider } from '../shared/context/LanguageContext';
```
