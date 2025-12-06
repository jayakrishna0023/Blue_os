# BlueOS Modern (Full JS Stack)

We have fully converted the backend to Node.js/Express and cleaned up all PHP references.

## 1. Setup Database
1. Make sure XAMPP **MySQL** is running.
2. The Node.js server will automatically create the database (`blueos_db`) and tables when it starts.

## 2. Run the App (One Command)
1. Open a terminal in `BlueOS_New`.
2. Run:
   ```powershell
   npm start
   ```
   *This will start BOTH the Node.js backend (port 5000) and the React frontend (port 3000).*

3. Open `http://localhost:3000`.

## 3. Login Credentials
- **Admin**: `admin` / `fish123`
- **Captain**: `captain1` / `fish123`
- **Worker**: `worker1` / `fish123`
