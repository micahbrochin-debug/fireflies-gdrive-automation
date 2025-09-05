const { google } = require('googleapis');
const { PDFGeneratorService } = require('./pdfGenerator');

class CloudGoogleDriveService {
  constructor(config) {
    this.folderId = config.folderId;
    this.pdfGenerator = new PDFGeneratorService();
    
    // Initialize Google Drive API with service account
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || '{}');
    
    this.auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  async uploadTranscript(fileName, content, transcript) {
    try {
      // Create temporary PDF file
      const tempPdfPath = `/tmp/${fileName}`;
      
      // Generate PDF
      await this.pdfGenerator.generateTranscriptPDF(transcript, fileName, tempPdfPath);
      
      // Upload to Google Drive
      const fileMetadata = {
        name: fileName,
        parents: this.folderId ? [this.folderId] : undefined,
        description: `Transcript from ${transcript.title} on ${transcript.dateString}`
      };

      const media = {
        mimeType: 'application/pdf',
        body: require('fs').createReadStream(tempPdfPath)
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink,webContentLink'
      });

      // Clean up temp file
      try {
        require('fs').unlinkSync(tempPdfPath);
      } catch (e) {
        // Ignore cleanup errors
      }

      console.log(`✅ PDF uploaded to Google Drive: ${response.data.name}`);
      console.log(`🔗 View link: ${response.data.webViewLink}`);
      
      return response.data;

    } catch (error) {
      console.error('Error uploading to Google Drive:', error.message);
      throw error;
    }
  }

  async testConnection() {
    try {
      const response = await this.drive.about.get({
        fields: 'user'
      });

      console.log('✅ Google Drive API connection successful');
      console.log(`👤 Authenticated as: ${response.data.user.displayName}`);
      return true;

    } catch (error) {
      console.error('❌ Google Drive connection failed:', error.message);
      return false;
    }
  }

  async createFolder(folderName, parentFolderId = null) {
    try {
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : undefined
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        fields: 'id,name'
      });

      console.log(`📁 Folder created: ${response.data.name} (${response.data.id})`);
      return response.data;

    } catch (error) {
      console.error('Error creating folder:', error.message);
      throw error;
    }
  }
}

module.exports = { CloudGoogleDriveService };