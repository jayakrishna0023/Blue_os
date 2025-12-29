# Wild Fishery Module

## Overview
This module handles all wild fishery (capture fishery) operations including vessel management, catch logging, crew management, and traceability.

## Components

### Admin
- **AdminDashboard.jsx** - Admin control panel for managing system-wide operations
- **QRGenerator.jsx** - QR code generation for fishers and vessels

### Captain
- **CaptainDashboard.jsx** - Main dashboard for vessel captains
- **SpeciesEntry.jsx** - Catch species entry form
- **TripExpenseForm.jsx** - Trip expense logging
- **TripHistory.jsx** - Historical trip records
- **TripRegistration.jsx** - New trip registration
- **TripSummary.jsx** - Trip summary and reports

### Fisher
- **FisherDashboard.jsx** - Fisher's personal dashboard showing trips and earnings

### Inspector
- **InspectorDashboard.jsx** - Inspector dashboard for quality checks
- **InspectorHome.jsx** - Inspector home screen
- **QualityEntry.jsx** - Quality assessment entry
- **TripDetails.jsx** - Detailed trip inspection view

### Worker
- **WorkerDashboard.jsx** - Port worker dashboard
- **CrateManagement.jsx** - Crate tracking and management
- **TripApprovals.jsx** - Trip approval workflows
- **WorkerEntry.jsx** - Catch entry at port
- **WorkerHome.jsx** - Worker home screen
- **WorkerProfile.jsx** - Worker profile management

## User Roles
- **Admin** - System administrator
- **Captain** - Vessel captain/owner
- **Fisher** - Crew member
- **Inspector** - Quality inspector
- **Worker** - Port/landing site worker
- **Vessel Owner** - Vessel owner (non-captain)

## Features
- Trip registration and management
- Real-time catch logging
- Crew management
- Expense tracking
- Quality inspection
- Port-side processing
- QR-based fisher identification
- Traceability from catch to consumer
