require('dotenv').config();
const express = require('express');
const { FirefliesGDriveAutomation } = require('./index');

class WebhookServer {
  constructor() {
    this.app = express();
    this.port = process.env.WEBHOOK_PORT || 3000;
    this.secret = process.env.WEBHOOK_SECRET;
    this.automation = new FirefliesGDriveAutomation();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Parse JSON bodies
    this.app.use(express.json());
    
    // Basic logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'fireflies-gdrive-automation'
      });
    });

    // Webhook endpoint for Fireflies
    this.app.post('/webhook/fireflies', async (req, res) => {
      try {
        // Verify webhook secret if configured
        if (this.secret) {
          const providedSecret = req.headers['x-webhook-secret'] || req.headers['authorization'];
          if (!providedSecret || !this.verifySecret(providedSecret)) {
            console.warn('Webhook request with invalid or missing secret');
            return res.status(401).json({ error: 'Unauthorized' });
          }
        }

        console.log('Received webhook from Fireflies:', req.body);
        
        // Extract transcript ID from webhook payload
        const transcriptId = this.extractTranscriptId(req.body);
        
        if (!transcriptId) {
          console.error('No transcript ID found in webhook payload');
          return res.status(400).json({ error: 'Invalid payload - missing transcript ID' });
        }

        // Respond quickly to webhook
        res.status(200).json({ 
          message: 'Webhook received', 
          transcriptId: transcriptId,
          timestamp: new Date().toISOString()
        });

        // Process transcript asynchronously
        this.processTranscriptAsync(transcriptId);

      } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Manual trigger endpoint
    this.app.post('/trigger', async (req, res) => {
      try {
        const { transcriptId, hours } = req.body;

        if (transcriptId) {
          // Process specific transcript
          const result = await this.automation.processTranscript(transcriptId);
          res.json({ 
            success: !!result, 
            transcriptId,
            result: result || 'Processing failed'
          });
        } else {
          // Process recent transcripts
          const hoursToCheck = hours || 24;
          const results = await this.automation.processRecentTranscripts(hoursToCheck);
          res.json({ 
            success: true, 
            processed: results.length,
            results 
          });
        }

      } catch (error) {
        console.error('Error in manual trigger:', error);
        res.status(500).json({ error: error.message });
      }
    });
  }

  extractTranscriptId(payload) {
    // Handle different possible webhook payload formats
    if (payload.transcriptId) return payload.transcriptId;
    if (payload.transcript_id) return payload.transcript_id;
    if (payload.id) return payload.id;
    if (payload.meetingId) return payload.meetingId;
    if (payload.meeting_id) return payload.meeting_id;
    
    // Check nested objects
    if (payload.data) {
      if (payload.data.transcriptId) return payload.data.transcriptId;
      if (payload.data.transcript_id) return payload.data.transcript_id;
      if (payload.data.id) return payload.data.id;
    }
    
    if (payload.transcript) {
      if (payload.transcript.id) return payload.transcript.id;
    }
    
    return null;
  }

  verifySecret(providedSecret) {
    // Remove 'Bearer ' prefix if present
    const secret = providedSecret.replace(/^Bearer\s+/i, '');
    return secret === this.secret;
  }

  async processTranscriptAsync(transcriptId) {
    try {
      console.log(`Processing transcript asynchronously: ${transcriptId}`);
      
      // Add a small delay to ensure Fireflies has finished processing
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const result = await this.automation.processTranscript(transcriptId);
      
      if (result) {
        console.log(`Successfully processed transcript ${transcriptId}`);
      } else {
        console.error(`Failed to process transcript ${transcriptId}`);
      }
    } catch (error) {
      console.error(`Error processing transcript ${transcriptId}:`, error);
    }
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`Webhook server running on port ${this.port}`);
      console.log(`Health check: http://localhost:${this.port}/health`);
      console.log(`Webhook endpoint: http://localhost:${this.port}/webhook/fireflies`);
      console.log(`Manual trigger: http://localhost:${this.port}/trigger`);
    });
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new WebhookServer();
  server.start();
}

module.exports = { WebhookServer };