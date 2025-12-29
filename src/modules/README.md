# BlueOS Modules

## Architecture Overview

BlueOS is organized into a modular architecture to support multiple types of fishery operations:

```
src/modules/
├── wild-fishery/     # Capture fishery operations (IMPLEMENTED)
├── aquaculture/      # Freshwater fish farming (PLANNED)
├── mariculture/      # Marine aquaculture (PLANNED)
└── shared/           # Common components and services
```

## Module Structure

Each module follows a consistent structure:
```
module-name/
├── components/       # UI components specific to this module
├── services/         # Business logic and API calls
├── routes/           # Module-specific routing (if needed)
└── README.md         # Module documentation
```

## Modules

### 1. Wild Fishery ✅ IMPLEMENTED
**Status**: Fully operational
**Description**: Complete system for wild capture fishery operations
**Key Features**:
- Vessel and trip management
- Catch logging and traceability
- Crew management
- Port operations
- Quality inspection
- Multi-language support (English/Tamil)

**User Roles**:
- Admin
- Captain/Vessel Owner
- Fisher
- Inspector  
- Port Worker

### 2. Aquaculture 🔄 PLANNED
**Status**: Structure ready, awaiting requirements
**Description**: Freshwater and inland fish farming operations
**Planned Features**:
- Pond/tank management
- Stock and feed management
- Water quality monitoring
- Harvest tracking

### 3. Mariculture 🔄 PLANNED
**Status**: Structure ready, awaiting requirements
**Description**: Marine and coastal aquaculture operations
**Planned Features**:
- Cage/raft farming
- Marine species management
- Coastal site management
- Seaweed cultivation

### 4. Shared ✅ CORE
**Status**: Fully implemented
**Description**: Common components, services, and utilities
**Includes**:
- Authentication system
- Language management (English/Tamil)
- Public traceability
- Reusable UI components
- API services

## Integration

All modules share:
- Authentication and user management
- Language/localization system
- Database schema (Supabase)
- Traceability system
- Quality standards

## Development Guidelines

### Adding a New Module

1. Create module directory structure:
   ```
   mkdir src/modules/new-module/components
   mkdir src/modules/new-module/services
   ```

2. Create module README with:
   - Overview
   - Features
   - User roles
   - Integration points

3. Add routes to `App.jsx`:
   ```javascript
   import NewModuleComponent from './modules/new-module/components/Dashboard';
   ```

4. Use shared services:
   ```javascript
   import { authAPI } from '../shared/services/api';
   import { useLanguage } from '../shared/context/LanguageContext';
   ```

### Best Practices

1. **Separation of Concerns**: Keep module-specific logic within the module
2. **Shared Components**: Use shared components from `/shared` module
3. **Consistent Naming**: Follow existing naming conventions
4. **Documentation**: Update README files when adding features
5. **Language Support**: Add translations for new components

## Technology Stack

- **Frontend**: React 18 + Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT + OTP
- **Languages**: English + Tamil

## Next Steps

1. ✅ Wild Fishery module - COMPLETE
2. 🔄 Await Aquaculture requirements from user
3. 🔄 Await Mariculture requirements from user
4. 🔄 Implement new modules based on requirements

## Contact

For questions or feature requests, contact the development team.
