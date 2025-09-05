# Fireflies to Google Drive Automation

Automatically download Fireflies AI transcripts to Google Drive with organized naming (date/time + company name).

## Features

- 🔥 Fetches transcripts from Fireflies AI using GraphQL API
- 📁 Uploads to specific Google Drive folder
- 📝 Smart file naming: `YYYY-MM-DD_HHMM_CompanyName_MeetingTitle.txt`
- 🏢 Extracts company names from participant emails or meeting titles
- ⚡ Multiple automation options: webhook, scheduler, or manual
- 🔧 Easy setup wizard
- 📊 Formatted transcripts with summaries and analytics

## Quick Start

1. **Clone and Install**
   ```bash
   cd fireflies-gdrive-automation
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys (see Configuration section)
   ```

3. **Run Setup Wizard**
   ```bash
   node setup.js
   ```

4. **Start Processing**
   ```bash
   npm start  # Process last 24 hours of transcripts
   ```

## Configuration

### Required Environment Variables

Create a `.env` file with:

```env
# Fireflies AI API Key (from Fireflies > Integrations > Fireflies API)
FIREFLIES_API_KEY=your_fireflies_api_key_here

# Google Drive Service Account (from Google Cloud Console)
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Target Google Drive folder ID (optional - will use root if not specified)
GOOGLE_DRIVE_FOLDER_ID=your_target_folder_id_here

# Webhook settings (optional)
WEBHOOK_PORT=3000
WEBHOOK_SECRET=your_webhook_secret_here
```

### Getting API Keys

#### Fireflies AI API Key
1. Log into Fireflies.ai
2. Go to **Integrations**
3. Search for "Fireflies API"
4. Copy your API key

#### Google Drive Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Drive API
4. Create Service Account credentials
5. Download JSON key file
6. Extract `client_email`, `client_id`, and `private_key` to `.env`
7. Share your target Google Drive folder with the service account email

## Usage

### Manual Processing

```bash
# Process last 24 hours
npm start

# Process specific transcript
node index.js --transcript-id YOUR_TRANSCRIPT_ID

# Process last N hours  
node index.js --hours 48
```

### Webhook Server

```bash
# Start webhook server
npm run webhook

# Test webhook endpoint
curl -X POST http://localhost:3000/webhook/fireflies \
  -H "Content-Type: application/json" \
  -d '{"transcriptId": "YOUR_TRANSCRIPT_ID"}'

# Manual trigger via API
curl -X POST http://localhost:3000/trigger \
  -H "Content-Type: application/json" \
  -d '{"hours": 12}'
```

### Automated Scheduling

```bash
# Default schedule (hourly + daily)
node scheduler.js

# Custom schedule - every 30 minutes
node scheduler.js --cron "*/30 * * * *"

# Custom schedule with lookback period
node scheduler.js --cron "0 */2 * * *" --hours 3
```

## File Naming

Files are automatically named using this pattern:
`YYYY-MM-DD_HHMM_CompanyName_MeetingTitle.txt`

### Company Name Extraction

The system extracts company names from:
1. **Meeting titles** (patterns like "Meeting with Acme Corp")
2. **Participant email domains** (john@acmecorp.com → "Acmecorp")
3. **Fallback to "Meeting"** if no company detected

### Examples

- `2025-01-15_1430_AcmeCorp_quarterly_review.txt`
- `2025-01-15_0900_TechStartup_product_demo.txt`
- `2025-01-15_1600_Meeting_team_standup.txt`

## Transcript Format

Each transcript includes:

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

Keywords: budget, planning, quarterly, results

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

### 1. Webhook Integration (Recommended)
- Real-time processing when meetings end
- Set up webhook URL in Fireflies
- Endpoint: `http://your-server:3000/webhook/fireflies`

### 2. Scheduled Processing
- Runs automatically at set intervals
- Default: hourly checks + daily catch-up
- Customizable cron expressions

### 3. Manual Processing  
- On-demand transcript processing
- Good for testing or one-off needs

## Project Structure

```
fireflies-gdrive-automation/
├── index.js                 # Main automation class
├── webhook.js              # Webhook server
├── scheduler.js            # Automated scheduling
├── setup.js               # Setup wizard
├── services/
│   ├── fireflies.js       # Fireflies AI API integration
│   ├── googleDrive.js     # Google Drive API integration
│   └── fileName.js        # Smart file naming logic
├── package.json
├── .env.example
└── README.md
```

## Troubleshooting

### Common Issues

**"Invalid Fireflies API key"**
- Verify key from Fireflies > Integrations > Fireflies API
- Check for extra spaces in `.env` file

**"Google Drive connection failed"**
- Ensure service account has Google Drive API enabled
- Share target folder with service account email
- Check private key formatting (includes `\n` for line breaks)

**"No transcript ID found in webhook"**
- Webhook payload structure may vary
- Check webhook.js `extractTranscriptId()` method
- Add logging to see actual payload structure

### Debugging

Enable verbose logging by modifying the services to include more console.log statements.

Run setup wizard to test all connections:
```bash
node setup.js
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes  
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details