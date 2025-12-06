# Crate Management Troubleshooting

If you are experiencing issues with Crate Management (e.g., "not capturing" or "incorrect data"), please follow these steps:

## 1. Check the Console
Open the browser developer tools (F12) and look at the "Console" tab.
- When you scan a fish, you should see: `Scanned code in mode add-fish: <QR_CODE>`
- You should see the API response: `Verify response: { success: true, fish: ... }`

## 2. Common Issues

### "Fish tag not found"
- Ensure you are scanning the **exact** QR code string that was saved during Catch Logging.
- Check if the fish was actually saved in the "Catch Log" tab.

### "This fish is already packed in a crate"
- A fish tag can only be in ONE crate. If you already packed it, you cannot pack it again.
- To check, go to "Scan Crate" and scan the crate QR it was put in.

### "Weight is 0"
- If the Captain logs the catch, the weight is initially 0 (unless the Captain app is updated to allow weight entry).
- Weight is typically added by the **Quality Inspector**.
- If you pack the crate *before* inspection, the weight will be 0.
- If you pack *after* inspection, the weight should be visible.

## 3. Verify Database
If you have access to the Supabase dashboard:
- Check the `catch_logs` table.
- Verify the `qr_code` column matches what is printed on the tag.
- Check if `crate_id` is NULL (it should be NULL to be packable).

## 4. Resetting
If the scanner gets stuck:
- Close the modal and reopen it.
- Refresh the page.
