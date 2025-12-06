# BlueOS New Backend Setup

We have created a brand new, self-contained PHP backend inside the `BlueOS_New/api` folder. This replaces the old, disorganized backend.

## 1. Start the Backend Server (REQUIRED)
Since your project is in `Downloads` (not XAMPP htdocs), you must run the built-in PHP server.

1. Open a **NEW** terminal in VS Code.
2. Make sure you are in the `BlueOS_New` folder.
3. Run this command:
   ```powershell
   ./start-backend.ps1
   ```
   *Keep this terminal OPEN. It runs the API.*

## 2. Setup Database
1. Make sure XAMPP **MySQL** is running (Open XAMPP Control Panel -> Start MySQL).
2. Open your browser and go to:
   `http://localhost:8000/api/setup.php`
   
   You should see: `{"success":true,"data":[],"message":"Database setup complete"}`

## 3. Run the Frontend
1. Open another terminal in `BlueOS_New`.
2. Run `npm run dev`.
3. Open `http://localhost:3000`.

## 3. Login Credentials
- **Admin**: `admin` / `fish123`
- **Captain**: `captain1` / `fish123`
- **Worker**: `worker1` / `fish123`

## 4. Troubleshooting
- If you see "Network Error", check if XAMPP is running.
- If you see 404 errors for API calls, check `vite.config.js` proxy settings or the URL path in your browser.
