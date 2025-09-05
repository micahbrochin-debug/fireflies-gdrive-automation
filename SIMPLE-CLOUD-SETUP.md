# Simple Cloud Deployment (No Google Cloud Console Needed!)

## 🚀 Deploy Your Automation to GitHub Actions - FREE & Easy!

Your automation will run in the cloud 24/7 without your computer, using the same local approach (no Google Cloud Console setup required).

### ✅ What You Get:
- **24/7 automation** - runs every 15 minutes in GitHub's cloud
- **Same functionality** - PDF generation with smart naming  
- **No Google Cloud setup** - uses simple approach
- **FREE hosting** - GitHub gives 2000 minutes/month free
- **Downloadable PDFs** - automatically generated and available

## 📋 Super Simple Setup (5 minutes):

### Step 1: Configure GitHub Secrets

1. **Go to your GitHub repo**: https://github.com/micahbrochin-debug/fireflies-gdrive-automation
2. **Settings** → **Secrets and variables** → **Actions**
3. **Add Repository Secret**:

   **FIREFLIES_API_KEY**
   ```
   19de473d-1e8b-464e-98ed-3cd7954766b9
   ```

### Step 2: Enable GitHub Actions

1. **Go to Actions tab** in your GitHub repo
2. **Click "Enable GitHub Actions"** if prompted
3. **Find "Fireflies to Google Drive Automation"** workflow
4. **Click "Enable workflow"**

### Step 3: Test It!

1. **Manual test**: Actions tab → "Fireflies to Google Drive Automation" → "Run workflow"
2. **Check results**: View the run logs to see your transcripts being processed
3. **Download PDFs**: Click on the run → "Artifacts" → Download the ZIP with your PDFs

## 🔄 How It Works:

1. **Every 15 minutes**, GitHub Actions:
   - Runs your Fireflies automation
   - Fetches new transcripts
   - Generates professional PDFs with format: `CompanyName_mm-dd-yy_hh-MM AM/PM.pdf`
   - Saves them as downloadable artifacts

2. **You get notified** and can:
   - Download PDFs from GitHub
   - Manually add them to your Google Drive
   - Or set up automatic sync (optional advanced step)

## 📊 Monitoring Your Automation:

- **View logs**: Actions tab → Latest run → View details
- **Download PDFs**: Actions tab → Run → Artifacts section
- **Check status**: Green checkmark = success, Red X = failed

## 🎯 File Format Examples:

Your cloud automation will generate the same smart filenames:
- `Salesforce_09-05-25_02-30 PM.pdf`
- `Microsoft_09-04-25_10-15 AM.pdf`
- `Leandata_09-04-25_04-30 PM.pdf`

## 💰 Cost Breakdown:

- **GitHub Actions**: FREE (2000 minutes/month)
- **Fireflies API**: FREE (your existing account)
- **Total**: $0/month ✨

## 🔧 Advanced: Auto-Sync to Google Drive (Optional)

If you want PDFs automatically in your Google Drive (not just downloadable), you can:

1. Add `GOOGLE_DRIVE_FOLDER_ID` secret (your folder ID)
2. The automation will still work the same way
3. Future enhancement: direct Google Drive sync

## 🆘 Troubleshooting:

### Workflow not running?
- Check Actions tab is enabled
- Verify FIREFLIES_API_KEY secret is set correctly

### No transcripts found?
- Check your Fireflies account has recent meetings
- Verify API key has access to transcripts

### Want different schedule?
- Edit `.github/workflows/fireflies-automation.yml`
- Change `cron: '*/15 * * * *'` to your preferred schedule

## 🎉 You're Done!

Your automation now runs in the cloud 24/7:
- ✅ **No local computer needed**
- ✅ **Same PDF quality and naming**
- ✅ **Completely free hosting**
- ✅ **Reliable GitHub infrastructure**
- ✅ **Easy to monitor and download**

The automation will start running every 15 minutes automatically! 🚀