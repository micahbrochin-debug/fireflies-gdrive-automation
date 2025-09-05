const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleDriveService {
  constructor(config) {
    this.config = config;
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.clientEmail,
        client_id: config.clientId,
        private_key: config.privateKey.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  async uploadTranscript(fileName, content, transcript) {
    try {
      // Create a temporary file
      const tempDir = '/tmp';
      const tempFilePath = path.join(tempDir, fileName);
      
      // Write content to temporary file
      fs.writeFileSync(tempFilePath, content);

      // File metadata
      const fileMetadata = {
        name: fileName,
        parents: this.config.folderId ? [this.config.folderId] : undefined,
        description: `Transcript from ${transcript.title} on ${transcript.dateString}`
      };

      // Media object
      const media = {
        mimeType: 'text/plain',
        body: fs.createReadStream(tempFilePath)
      };

      // Upload to Google Drive
      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink,webContentLink'
      });

      // Clean up temporary file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.warn('Could not clean up temporary file:', cleanupError.message);
      }

      console.log(`File uploaded successfully: ${response.data.name}`);
      return response.data;

    } catch (error) {
      console.error('Error uploading to Google Drive:', error.message);
      throw error;
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

      console.log(`Folder created: ${response.data.name} (${response.data.id})`);
      return response.data;

    } catch (error) {
      console.error('Error creating folder:', error.message);
      throw error;
    }
  }

  async listFiles(folderId = null, query = null) {
    try {
      let searchQuery = '';
      
      if (folderId) {
        searchQuery += `'${folderId}' in parents`;
      }
      
      if (query) {
        if (searchQuery) searchQuery += ' and ';
        searchQuery += query;
      }

      const response = await this.drive.files.list({
        q: searchQuery || undefined,
        fields: 'files(id,name,createdTime,modifiedTime,webViewLink)',
        orderBy: 'createdTime desc'
      });

      return response.data.files;

    } catch (error) {
      console.error('Error listing files:', error.message);
      throw error;
    }
  }

  async getFolderInfo(folderId) {
    try {
      const response = await this.drive.files.get({
        fileId: folderId,
        fields: 'id,name,parents,webViewLink'
      });

      return response.data;

    } catch (error) {
      console.error('Error getting folder info:', error.message);
      throw error;
    }
  }

  async testConnection() {
    try {
      const response = await this.drive.about.get({
        fields: 'user'
      });

      console.log('Google Drive connection successful');
      console.log('Authenticated user:', response.data.user.displayName);
      return true;

    } catch (error) {
      console.error('Google Drive connection failed:', error.message);
      return false;
    }
  }
}

module.exports = { GoogleDriveService };