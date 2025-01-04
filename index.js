const { login } = require('./bot.js');

async function startProcess() {
    try {
        // Start the bot
        const client = await login();
    } catch (error) {
        console.error('Startup error:', error);
        process.exit(1);
    }
}

startProcess();