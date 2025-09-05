const PDFDocument = require('pdfkit');
const fs = require('fs');

class PDFGeneratorService {
  constructor() {
    this.doc = null;
  }

  async generateTranscriptPDF(transcript, fileName, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        // Create a new PDF document
        this.doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 72,
            right: 72
          }
        });

        // Create write stream
        const stream = fs.createWriteStream(outputPath);
        this.doc.pipe(stream);

        // Add content
        this.addHeader(transcript);
        this.addSummary(transcript);
        this.addTranscript(transcript);
        this.addAnalytics(transcript);

        // Finalize the PDF
        this.doc.end();

        stream.on('finish', () => {
          console.log(`PDF generated: ${outputPath}`);
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  addHeader(transcript) {
    // Title
    this.doc.fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#2E4A6B')
      .text('CUSTOMER CALL TRANSCRIPT', 72, 72)
      .moveDown(0.5);

    // Meeting details
    this.doc.fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('Meeting:', 72, this.doc.y)
      .font('Helvetica')
      .text(transcript.title || 'N/A', 130, this.doc.y);

    this.doc.font('Helvetica-Bold')
      .text('Date:', 72, this.doc.y + 15)
      .font('Helvetica')
      .text(this.formatDate(transcript.dateString), 130, this.doc.y);

    this.doc.font('Helvetica-Bold')
      .text('Duration:', 72, this.doc.y + 15)
      .font('Helvetica')
      .text(`${transcript.duration || 0} minutes`, 130, this.doc.y);

    this.doc.font('Helvetica-Bold')
      .text('Host:', 72, this.doc.y + 15)
      .font('Helvetica')
      .text(transcript.host_email || 'N/A', 130, this.doc.y);

    if (transcript.participants && transcript.participants.length > 0) {
      this.doc.font('Helvetica-Bold')
        .text('Participants:', 72, this.doc.y + 15)
        .font('Helvetica')
        .text(transcript.participants.join(', '), 130, this.doc.y, {
          width: 350,
          align: 'left'
        });
    }

    this.addSeparator();
  }

  addSummary(transcript) {
    if (!transcript.summary) return;

    this.doc.fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#2E4A6B')
      .text('SUMMARY', 72, this.doc.y + 20);

    this.addSeparator(false);

    // Overview
    if (transcript.summary.overview) {
      this.doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#333333')
        .text('Overview:', 72, this.doc.y + 10)
        .moveDown(0.3);

      this.doc.font('Helvetica')
        .text(transcript.summary.overview, 72, this.doc.y, {
          width: 450,
          align: 'left'
        })
        .moveDown(0.8);
    }

    // Action Items
    if (transcript.summary.action_items) {
      this.doc.font('Helvetica-Bold')
        .text('Action Items:', 72, this.doc.y)
        .moveDown(0.3);

      this.doc.font('Helvetica');
      if (Array.isArray(transcript.summary.action_items)) {
        transcript.summary.action_items.forEach((item, index) => {
          this.doc.text(`${index + 1}. ${item}`, 72, this.doc.y, {
            width: 450,
            indent: 20
          });
          this.doc.moveDown(0.3);
        });
      } else {
        this.doc.text(transcript.summary.action_items, 72, this.doc.y, {
          width: 450
        });
      }
      this.doc.moveDown(0.5);
    }

    // Keywords
    if (transcript.summary.keywords) {
      this.doc.font('Helvetica-Bold')
        .text('Keywords:', 72, this.doc.y)
        .font('Helvetica');
      
      if (Array.isArray(transcript.summary.keywords)) {
        this.doc.text(transcript.summary.keywords.join(', '), 130, this.doc.y, {
          width: 390
        });
      } else {
        this.doc.text(transcript.summary.keywords, 130, this.doc.y, {
          width: 390
        });
      }
      this.doc.moveDown(0.8);
    }

    this.addSeparator();
  }

  addTranscript(transcript) {
    this.doc.fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#2E4A6B')
      .text('TRANSCRIPT', 72, this.doc.y + 20);

    this.addSeparator(false);

    if (transcript.sentences && transcript.sentences.length > 0) {
      this.doc.fontSize(10)
        .font('Helvetica');

      transcript.sentences.forEach((sentence, index) => {
        const timestamp = this.formatTime(sentence.start_time);
        
        // Check if we need a new page
        if (this.doc.y > 720) {
          this.doc.addPage();
        }

        // Timestamp and speaker
        this.doc.font('Helvetica-Bold')
          .fillColor('#666666')
          .text(`[${timestamp}] ${sentence.speaker_name}:`, 72, this.doc.y, {
            continued: true
          });

        // Speech content
        this.doc.font('Helvetica')
          .fillColor('#333333')
          .text(` ${sentence.text}`, {
            width: 450,
            align: 'left'
          });

        this.doc.moveDown(0.4);
      });
    } else {
      this.doc.fontSize(12)
        .font('Helvetica')
        .fillColor('#666666')
        .text('No transcript sentences available.', 72, this.doc.y);
    }

    this.addSeparator();
  }

  addAnalytics(transcript) {
    if (!transcript.analytics) return;

    this.doc.fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#2E4A6B')
      .text('ANALYTICS', 72, this.doc.y + 20);

    this.addSeparator(false);

    // Speaker Statistics
    if (transcript.analytics.speakers && transcript.analytics.speakers.length > 0) {
      this.doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#333333')
        .text('Speaker Statistics:', 72, this.doc.y + 10)
        .moveDown(0.3);

      this.doc.font('Helvetica');
      transcript.analytics.speakers.forEach(speaker => {
        const duration = Math.round(speaker.duration || 0);
        this.doc.text(`• ${speaker.name}: ${duration} minutes, ${speaker.word_count || 0} words`, 72, this.doc.y);
        this.doc.moveDown(0.3);
      });
    }

    // Sentiment Analysis
    if (transcript.analytics.sentiments) {
      const sentiments = transcript.analytics.sentiments;
      this.doc.font('Helvetica-Bold')
        .text('Sentiment Analysis:', 72, this.doc.y + 10)
        .moveDown(0.3);

      this.doc.font('Helvetica')
        .text(`• Positive: ${Math.round(sentiments.positive_pct || 0)}%`, 72, this.doc.y)
        .text(`• Neutral: ${Math.round(sentiments.neutral_pct || 0)}%`, 72, this.doc.y + 15)
        .text(`• Negative: ${Math.round(sentiments.negative_pct || 0)}%`, 72, this.doc.y + 15);
    }
  }

  addSeparator(thick = true) {
    this.doc.moveDown(0.5);
    if (thick) {
      this.doc.strokeColor('#2E4A6B')
        .lineWidth(2);
    } else {
      this.doc.strokeColor('#CCCCCC')
        .lineWidth(1);
    }
    
    this.doc.moveTo(72, this.doc.y)
      .lineTo(523, this.doc.y)
      .stroke();
    
    this.doc.moveDown(0.5);
  }

  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString || 'Unknown';
    }
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

module.exports = { PDFGeneratorService };