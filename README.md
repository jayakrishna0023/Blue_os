# BlueOS - Modern Fish Catch Management System

This is a modern React-based frontend for the BlueOS Fish Catch Management System. It replaces the legacy HTML/JS interface with a responsive, professional, and feature-rich application while maintaining compatibility with the existing PHP backend.

## Features

- **Modern UI/UX**: Built with React 18, Tailwind CSS, and a custom "Ocean" design system featuring glassmorphism and smooth animations.
- **Role-Based Access**: Dedicated dashboards for Captains, Workers, and Administrators.
- **QR Code Integration**: 
  - **Generation**: Admins can generate and print QR codes for fish crates.
  - **Scanning**: Captains and Workers can scan QR codes using their device camera (integrated `html5-qrcode`).
- **Geolocation**: Automatic GPS tagging for catch entries.
- **Traceability**: Public-facing portal to track fish from "Catch to Kitchen" using QR codes.
- **Vessel Registry**: Public registry of authorized fishing vessels.

## Prerequisites

1.  **Node.js**: You must have Node.js installed (v16 or higher recommended).
2.  **PHP Server**: The existing PHP backend (in the parent folder) must be running.
    -   If using XAMPP/WAMP, ensure Apache and MySQL are running.
    -   The backend is expected to be accessible at `http://localhost/BlueOS_test`.

## Installation

1.  Open a terminal in this folder (`BlueOS_New`).
2.  Install the dependencies:
    ```bash
    npm install
    ```

## Running the Application

1.  Start the development server:
    ```bash
    npm run dev
    ```
2.  Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`).

## Configuration

-   **API Connection**: The application connects to the backend via a proxy configured in `vite.config.js`.
    -   It forwards requests from `/api/*` to `http://localhost/BlueOS_test/*`.
    -   If your PHP server is running on a different port or path, update the `target` in `vite.config.js`.

## Project Structure

-   `src/components`: All React components organized by role (Admin, Captain, Worker, Public).
-   `src/services`: API integration and utility functions.
-   `src/assets`: Static assets.

## Key Components

-   **Captain Dashboard**: Trip registration, Species entry (with Photo/GPS/QR), Crate management.
-   **Worker Dashboard**: Quality inspection scanning.
-   **Admin Dashboard**: System overview, Vessel management, Trip monitoring, QR Code generation.
-   **Public**: Traceability portal and Vessel registry.
