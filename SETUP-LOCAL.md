# Local Google Drive Setup Guide

This simplified setup uses your local Google Drive folder instead of the Google Cloud API, making it much easier to configure!

## How It Works

1. 📥 Downloads transcripts from Fireflies AI
2. 💾 Saves them to your local Google Drive folder  
3. 📤 Google Drive automatically syncs them to the cloud
4. ✅ Files appear in your Google Drive web interface

## Prerequisites

- ✅ **Google Drive desktop app** installed and syncing
- ✅ **Fireflies.ai account** with API access
- ✅ **Node.js** installed on your computer

## Step-by-Step Setup

### Step 1: Install Dependencies

```bash
cd fireflies-gdrive-automation
npm install
```

### Step 2: Get Your Fireflies API Key

1. Go to [Fireflies.ai](https://fireflies.ai) and log in
2. Click your profile/settings
3. Go to **Integrations**
4. Search for "Fireflies API" 
5. Copy your API key (long string of letters/numbers)

### Step 3: Configure Environment

```bash
# Copy the template
cp .env.example .env

# Edit .env file and add your Fireflies API key
```

Your `.env` file should look like:
```env
# Fireflies AI API Configuration
FIREFLIES_API_KEY=your_actual_fireflies_api_key_here

# Local Google Drive Configuration (usually auto-detected)
GOOGLE_DRIVE_LOCAL_PATH=
GOOGLE_DRIVE_TARGET_FOLDER=Fireflies Transcripts
```

### Step 4: Run Setup Wizard

```bash
npm run setup
```

The setup wizard will:
- ✅ Test your Fireflies API connection
- 🔍 Auto-detect your Google Drive folder
- 📁 Create the "Fireflies Transcripts" folder
- 💾 Test writing files to Google Drive

### Step 5: Test It Out!

```bash
# Process recent transcripts
npm start

# Or process specific hours
node index.js --hours 48
```

## What You'll Get

### File Organization
```
Google Drive/
└── Fireflies Transcripts/
    ├── 2025/
    │   ├── 01/
    │   │   ├── 2025-01-15_1430_AcmeCorp_quarterly_review.txt
    │   │   └── 2025-01-15_1600_TechCorp_product_demo.txt
    │   └── 02/
    └── 2024/
```

### File Naming
- `2025-01-15_1430_AcmeCorp_quarterly_review.txt`
- Date: `2025-01-15` (YYYY-MM-DD)
- Time: `1430` (2:30 PM in 24hr format)
- Company: `AcmeCorp` (extracted from participants/title)
- Title: `quarterly_review` (cleaned meeting title)

### Transcript Content
```
Meeting: Quarterly Review with Acme Corp
Date: 2025-01-15T14:30:00Z
Duration: 45 minutes
Host: host@company.com
Participants: john@acmecorp.com, jane@company.com

================================================================================

SUMMARY
----------------------------------------
Overview: Discussion of Q4 results and Q1 planning...

Action Items:
1. Prepare Q1 budget by Friday
2. Schedule follow-up meeting

Keywords: budget, planning, quarterly

================================================================================

TRANSCRIPT
----------------------------------------
[0:00] John Smith: Thanks for joining today...
[2:30] Jane Doe: The numbers look good...

================================================================================

ANALYTICS
----------------------------------------
Speaker Statistics:
- John Smith: 25 minutes, 1,250 words
- Jane Doe: 20 minutes, 980 words

Sentiment Analysis:
- Positive: 75%
- Neutral: 20%
- Negative: 5%
```

## Automation Options

### Option 1: Manual Processing
```bash
npm start                    # Last 24 hours
node index.js --hours 48     # Last 48 hours
node index.js --transcript-id ABC123  # Specific transcript
```

### Option 2: Scheduled Automation
```bash
node scheduler.js                          # Hourly + daily checks
node scheduler.js --cron "*/30 * * * *"    # Every 30 minutes
```

### Option 3: Webhook (Real-time)
```bash
npm run webhook              # Start webhook server
# Then configure Fireflies to send webhooks to your server
```

## Troubleshooting

### "Google Drive folder not found"
- Make sure Google Drive desktop app is installed
- Check that Google Drive is syncing (look for the Google Drive icon in your system tray)
- Try manually specifying the path in `.env`:
  ```env
  GOOGLE_DRIVE_LOCAL_PATH=/Users/yourusername/Google Drive
  ```

### "Permission denied"
- Make sure you have write access to your Google Drive folder
- Try creating a test file manually in the folder
- On Mac: check System Preferences > Security & Privacy > Files and Folders

### "Invalid Fireflies API key"
- Double-check your API key from Fireflies > Integrations
- Make sure there are no extra spaces in the `.env` file
- Try regenerating the API key if needed

### Files not syncing to cloud
- Check that Google Drive desktop app is running
- Look for sync status in Google Drive settings
- Try right-clicking on the folder and selecting "Available offline"

## Benefits of This Approach

- 🚫 **No Google Cloud Console needed**
- 🔑 **No service account setup**
- 📁 **Uses your existing Google Drive**
- 🔄 **Automatic cloud sync**
- 💰 **No API usage costs**
- 🛡️ **Works with corporate restrictions**

## Common Google Drive Locations

The script auto-detects these common paths:
- **Mac**: `/Users/yourusername/Google Drive`
- **Windows**: `C:\Users\yourusername\Google Drive`  
- **Linux**: `/home/yourusername/Google Drive`

If auto-detection fails, you can manually specify the path in your `.env` file.