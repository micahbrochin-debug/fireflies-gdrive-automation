require('dotenv').config();
const { FirefliesService } = require('./services/fireflies');
const { LocalGoogleDriveService } = require('./services/localGoogleDrive');
const { FileNameService } = require('./services/fileName');

class FirefliesGDriveAutomation {
  constructor() {
    this.fireflies = new FirefliesService(process.env.FIREFLIES_API_KEY);
    this.gdrive = new LocalGoogleDriveService({
      localPath: process.env.GOOGLE_DRIVE_LOCAL_PATH,
      targetFolder: process.env.GOOGLE_DRIVE_TARGET_FOLDER || 'Customer Call Transcripts'
    });
    this.fileNameService = new FileNameService();
  }

  async processTranscript(transcriptId) {
    try {
      console.log(`Processing transcript: ${transcriptId}`);
      
      // Fetch transcript details from Fireflies
      const transcript = await this.fireflies.getTranscript(transcriptId);
      if (!transcript) {
        console.error(`Transcript not found: ${transcriptId}`);
        return false;
      }

      // Generate filename with date/time and company name
      const fileName = this.fileNameService.generateFileName(
        transcript.dateString,
        transcript.title,
        transcript.participants
      );

      console.log(`Generated filename: ${fileName}`);

      // Download transcript content
      const transcriptContent = await this.fireflies.downloadTranscriptContent(transcript);
      
      // Upload to Google Drive
      const uploadResult = await this.gdrive.uploadTranscript(
        fileName,
        transcriptContent,
        transcript
      );

      console.log(`Successfully saved to local Google Drive: ${uploadResult.localPath}`);
      return uploadResult;

    } catch (error) {
      console.error('Error processing transcript:', error);
      return false;
    }
  }

  async processRecentTranscripts(hours = 24) {
    try {
      console.log(`Checking for transcripts from the last ${hours} hours...`);
      
      const recentTranscripts = await this.fireflies.getRecentTranscripts(hours);
      console.log(`Found ${recentTranscripts.length} recent transcripts`);

      const results = [];
      for (const transcript of recentTranscripts) {
        const result = await this.processTranscript(transcript.id);
        results.push({ transcriptId: transcript.id, success: !!result });
        
        // Add delay between uploads to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      return results;
    } catch (error) {
      console.error('Error processing recent transcripts:', error);
      return [];
    }
  }
}

// CLI usage
if (require.main === module) {
  const automation = new FirefliesGDriveAutomation();
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Process transcripts from the last 24 hours
    automation.processRecentTranscripts(24)
      .then(results => {
        console.log('Processing complete:', results);
        process.exit(0);
      })
      .catch(error => {
        console.error('Error:', error);
        process.exit(1);
      });
  } else if (args[0] === '--transcript-id' && args[1]) {
    // Process specific transcript
    automation.processTranscript(args[1])
      .then(result => {
        console.log('Processing complete:', result ? 'Success' : 'Failed');
        process.exit(result ? 0 : 1);
      })
      .catch(error => {
        console.error('Error:', error);
        process.exit(1);
      });
  } else if (args[0] === '--hours' && args[1]) {
    // Process transcripts from specific hours
    const hours = parseInt(args[1]);
    automation.processRecentTranscripts(hours)
      .then(results => {
        console.log('Processing complete:', results);
        process.exit(0);
      })
      .catch(error => {
        console.error('Error:', error);
        process.exit(1);
      });
  } else {
    console.log('Usage:');
    console.log('  node index.js                              # Process last 24 hours');
    console.log('  node index.js --transcript-id <id>         # Process specific transcript');
    console.log('  node index.js --hours <number>             # Process last N hours');
    process.exit(1);
  }
}

module.exports = { FirefliesGDriveAutomation };