# BlueOS Modern (Node.js Backend)

We have replaced the PHP backend with a modern Node.js/Express backend.

## 1. Setup Database
1. Make sure XAMPP **MySQL** is running.
2. The Node.js server will automatically create the database (`blueos_db`) and tables when it starts.

## 2. Start the Backend Server
1. Open a terminal in `BlueOS_New`.
2. Run:
   ```powershell
   npm run server
   ```
   *You should see: "Server running on http://localhost:5000" and "Database checked/created."*

## 3. Start the Frontend
1. Open a **second** terminal in `BlueOS_New`.
2. Run:
   ```powershell
   npm run dev
   ```
3. Open `http://localhost:3000`.

## 4. Login Credentials
- **Admin**: `admin` / `fish123`
- **Captain**: `captain1` / `fish123`
- **Worker**: `worker1` / `fish123`
