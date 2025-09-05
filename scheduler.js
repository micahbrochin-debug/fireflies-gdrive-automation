require('dotenv').config();
const cron = require('node-cron');
const { FirefliesGDriveAutomation } = require('./index');

class SchedulerService {
  constructor() {
    this.automation = new FirefliesGDriveAutomation();
    this.isRunning = false;
  }

  start() {
    console.log('Starting Fireflies to Google Drive scheduler...');
    
    // Run every hour to check for new transcripts
    const hourlyTask = cron.schedule('0 * * * *', async () => {
      if (this.isRunning) {
        console.log('Previous task still running, skipping...');
        return;
      }
      
      try {
        this.isRunning = true;
        console.log(`${new Date().toISOString()} - Checking for new transcripts...`);
        
        const results = await this.automation.processRecentTranscripts(2); // Check last 2 hours with overlap
        
        console.log(`Processed ${results.length} transcripts:`, results);
      } catch (error) {
        console.error('Error in scheduled task:', error);
      } finally {
        this.isRunning = false;
      }
    });

    // Run daily at 9 AM to catch any missed transcripts
    const dailyTask = cron.schedule('0 9 * * *', async () => {
      if (this.isRunning) {
        console.log('Another task running, skipping daily check...');
        return;
      }
      
      try {
        this.isRunning = true;
        console.log(`${new Date().toISOString()} - Daily check for missed transcripts...`);
        
        const results = await this.automation.processRecentTranscripts(25); // Check last 25 hours
        
        console.log(`Daily check processed ${results.length} transcripts:`, results);
      } catch (error) {
        console.error('Error in daily scheduled task:', error);
      } finally {
        this.isRunning = false;
      }
    });

    hourlyTask.start();
    dailyTask.start();
    
    console.log('Scheduler started:');
    console.log('- Checking for new transcripts every hour');
    console.log('- Daily catch-up check at 9 AM');
    console.log('- Use Ctrl+C to stop');

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nShutting down scheduler...');
      hourlyTask.stop();
      dailyTask.stop();
      process.exit(0);
    });

    // Keep the process alive
    process.stdin.resume();
  }

  // Method to run scheduler with custom cron expression
  startCustom(cronExpression, hoursToCheck = 2) {
    console.log(`Starting custom scheduler with cron: ${cronExpression}`);
    
    const task = cron.schedule(cronExpression, async () => {
      if (this.isRunning) {
        console.log('Previous task still running, skipping...');
        return;
      }
      
      try {
        this.isRunning = true;
        console.log(`${new Date().toISOString()} - Custom scheduled check...`);
        
        const results = await this.automation.processRecentTranscripts(hoursToCheck);
        
        console.log(`Custom check processed ${results.length} transcripts:`, results);
      } catch (error) {
        console.error('Error in custom scheduled task:', error);
      } finally {
        this.isRunning = false;
      }
    });

    task.start();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nShutting down custom scheduler...');
      task.stop();
      process.exit(0);
    });

    process.stdin.resume();
  }
}

// CLI usage
if (require.main === module) {
  const scheduler = new SchedulerService();
  
  const args = process.argv.slice(2);
  
  if (args.length >= 2 && args[0] === '--cron') {
    const cronExpression = args[1];
    const hours = args[3] ? parseInt(args[3]) : 2;
    
    if (args[2] === '--hours' && hours) {
      scheduler.startCustom(cronExpression, hours);
    } else {
      scheduler.startCustom(cronExpression);
    }
  } else if (args.length > 0) {
    console.log('Usage:');
    console.log('  node scheduler.js                                    # Default schedule (hourly + daily)');
    console.log('  node scheduler.js --cron "*/30 * * * *"             # Custom cron (every 30 minutes)');
    console.log('  node scheduler.js --cron "0 */2 * * *" --hours 3    # Every 2 hours, check last 3 hours');
    console.log('');
    console.log('Cron format: minute hour day month day-of-week');
    console.log('Examples:');
    console.log('  "0 * * * *"     - Every hour');
    console.log('  "*/30 * * * *"  - Every 30 minutes');
    console.log('  "0 9,17 * * *"  - At 9 AM and 5 PM daily');
    process.exit(1);
  } else {
    scheduler.start();
  }
}

module.exports = { SchedulerService };