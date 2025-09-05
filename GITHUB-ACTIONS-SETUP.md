# GitHub Actions Cloud Deployment Setup

## 🚀 Deploy to GitHub Actions (Free)

Your automation will run in the cloud every 15 minutes without needing your computer on!

### Step 1: Set up Google Cloud Service Account

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Create/Select Project**: Create new project or use existing
3. **Enable Google Drive API**:
   - Go to "APIs & Services" > "Library"
   - Search "Google Drive API" > Enable
4. **Create Service Account**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Name it "fireflies-automation"
   - Download JSON key file

### Step 2: Share Google Drive Folder

1. **Create/Find Target Folder**: Create "Customer Call Transcripts" folder in Google Drive
2. **Get Folder ID**: From URL like `https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRs`
   - Folder ID is: `1aBcDeFgHiJkLmNoPqRs`
3. **Share Folder**: Right-click folder > Share > Add service account email (from JSON file)
   - Give "Editor" permissions

### Step 3: Configure GitHub Secrets

1. **Go to GitHub Repository**: https://github.com/micahbrochin-debug/fireflies-gdrive-automation
2. **Settings** > **Secrets and variables** > **Actions**
3. **Add these Repository Secrets**:

   **FIREFLIES_API_KEY**
   ```
   your_fireflies_api_key_here
   ```

   **GOOGLE_DRIVE_CREDENTIALS**
   ```json
   {
     "type": "service_account",
     "project_id": "your-project-id",
     "private_key_id": "key-id",
     "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR-PRIVATE-KEY\n-----END PRIVATE KEY-----\n",
     "client_email": "fireflies-automation@your-project.iam.gserviceaccount.com",
     "client_id": "your-client-id",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/fireflies-automation%40your-project.iam.gserviceaccount.com"
   }
   ```

   **GOOGLE_DRIVE_FOLDER_ID**
   ```
   1aBcDeFgHiJkLmNoPqRsTuVwXyZ
   ```

### Step 4: Test & Enable

1. **Manual Test**: Go to Actions tab > "Fireflies to Google Drive Automation" > "Run workflow"
2. **Check Results**: View logs to see if automation worked
3. **Automatic Running**: Will now run every 15 minutes automatically!

## 🔧 Monitoring

- **View Logs**: Actions tab > Latest run > View details
- **Check Files**: PDFs appear in your Google Drive "Customer Call Transcripts" folder
- **Troubleshoot**: Check logs for any API errors

## ⚙️ Customization

Edit `.github/workflows/fireflies-automation.yml` to:
- Change schedule (cron expression)
- Modify lookback hours
- Add notifications

## 💰 Cost

- **GitHub Actions**: Free (2000 minutes/month)
- **Google Drive API**: Free
- **Total**: $0/month ✨

## 🆘 Troubleshooting

### "Invalid credentials" error
- Check GOOGLE_DRIVE_CREDENTIALS secret format
- Ensure service account has Drive API access

### "Folder not found" error  
- Verify GOOGLE_DRIVE_FOLDER_ID
- Check folder is shared with service account

### "Fireflies API error"
- Verify FIREFLIES_API_KEY is correct
- Check Fireflies account has API access

## 🎉 Success!

Once configured, your automation runs in the cloud:
- ✅ Every 15 minutes
- ✅ No local computer needed  
- ✅ PDFs automatically in Google Drive
- ✅ Smart filename format: `CompanyName_mm-dd-yy_hh-MM AM/PM.pdf`