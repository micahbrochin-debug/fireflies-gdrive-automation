require('dotenv').config();
const { FirefliesService } = require('./services/fireflies');
const { CloudGoogleDriveService } = require('./services/cloudGoogleDrive');
const { FileNameService } = require('./services/fileName');

class CloudFirefliesGDriveAutomation {
  constructor() {
    this.fireflies = new FirefliesService(process.env.FIREFLIES_API_KEY);
    this.gdrive = new CloudGoogleDriveService({
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID
    });
    this.fileNameService = new FileNameService();
  }

  async processTranscript(transcriptId) {
    try {
      console.log(`🔄 Processing transcript: ${transcriptId}`);
      
      // Fetch transcript details from Fireflies
      const transcript = await this.fireflies.getTranscript(transcriptId);
      if (!transcript) {
        console.error(`❌ Transcript not found: ${transcriptId}`);
        return false;
      }

      // Generate filename with date/time and company name
      const fileName = this.fileNameService.generateFileName(
        transcript.dateString,
        transcript.title,
        transcript.participants
      );

      console.log(`📝 Generated filename: ${fileName}`);

      // Upload to Google Drive (PDF generation happens in the service)
      const uploadResult = await this.gdrive.uploadTranscript(
        fileName,
        null, // Content not needed for cloud version
        transcript
      );

      console.log(`✅ Successfully processed transcript: ${transcriptId}`);
      return uploadResult;

    } catch (error) {
      console.error(`❌ Error processing transcript ${transcriptId}:`, error);
      return false;
    }
  }

  async processRecentTranscripts(hours = 1) {
    try {
      console.log(`🔍 Checking for transcripts from the last ${hours} hours...`);
      
      const recentTranscripts = await this.fireflies.getRecentTranscripts(hours);
      console.log(`📋 Found ${recentTranscripts.length} recent transcripts`);

      if (recentTranscripts.length === 0) {
        console.log('ℹ️  No new transcripts to process');
        return [];
      }

      const results = [];
      for (const transcript of recentTranscripts) {
        const result = await this.processTranscript(transcript.id);
        results.push({ 
          transcriptId: transcript.id, 
          title: transcript.title,
          success: !!result 
        });
        
        // Add delay between uploads to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const successful = results.filter(r => r.success).length;
      console.log(`🎉 Processing complete: ${successful}/${results.length} successful`);
      
      return results;
    } catch (error) {
      console.error('❌ Error processing recent transcripts:', error);
      return [];
    }
  }

  async testConnection() {
    console.log('🧪 Testing connections...');
    
    try {
      // Test Fireflies
      const query = `query { user { name email } }`;
      const response = await this.fireflies.client.post('', { query });
      if (response.data.data?.user) {
        console.log('✅ Fireflies API connected');
      }
      
      // Test Google Drive
      await this.gdrive.testConnection();
      
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }
}

// For GitHub Actions or cloud deployment
async function runAutomation() {
  const automation = new CloudFirefliesGDriveAutomation();
  
  // Test connections first
  const connected = await automation.testConnection();
  if (!connected) {
    console.error('❌ Connection test failed, exiting...');
    process.exit(1);
  }
  
  // Process recent transcripts
  const hours = parseInt(process.env.LOOKBACK_HOURS) || 1;
  const results = await automation.processRecentTranscripts(hours);
  
  console.log('📊 Final Results:', JSON.stringify(results, null, 2));
  
  // Exit with appropriate code
  const hasFailures = results.some(r => !r.success);
  process.exit(hasFailures ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  runAutomation().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { CloudFirefliesGDriveAutomation };