# Troubleshooting BlueOS Setup

If the application says "Network Error" or "Login Failed", it is likely because the **PHP Backend is not accessible**.

## 🚨 CRITICAL: Folder Location

The React frontend (this folder) tries to talk to `http://localhost/BlueOS_test`.
For this to work, your **PHP Server (XAMPP/WAMP)** must be serving the `BlueOS_test` folder.

### If you are using XAMPP:
1.  **Move the folder**: Copy the entire `BlueOS_test` folder from `Downloads` to `C:\xampp\htdocs\`.
    -   New path should be: `C:\xampp\htdocs\BlueOS_test\`
2.  **Start Apache**: Open XAMPP Control Panel and start **Apache** and **MySQL**.
3.  **Test the Backend**: Open your browser and go to:
    -   `http://localhost/BlueOS_test/test.php`
    -   If you see a page (even an error page), the server is working.
    -   If you see "Not Found", the folder is in the wrong place.

### If you cannot move the folder:
You must configure a **Virtual Host** in XAMPP to point to your Downloads folder, but moving the folder to `htdocs` is much easier.

## 🔧 Database Connection

If the backend is reachable but login fails with "Database connection failed":
1.  Open `C:\xampp\htdocs\BlueOS_test\db.php` (and `auth.php`, `main-api.php`).
2.  Check the credentials:
    ```php
    $username = 'root';      // Default for XAMPP is 'root'
    $password = '';          // Default for XAMPP is empty
    $dbname = 'maforyou_trippage'; // Make sure this database exists!
    ```
3.  If your database has a different name, update it in the PHP files.

## 🚀 Running the Frontend

After moving the files:
1.  Open a terminal in `C:\xampp\htdocs\BlueOS_test\BlueOS_New`.
2.  Run `npm install`.
3.  Run `npm run dev`.
4.  Open `http://localhost:3000` (or the port shown).
