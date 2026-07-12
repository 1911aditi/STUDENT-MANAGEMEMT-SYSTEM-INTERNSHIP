const { db } = require('./db');
const { initializeDatabase } = require('./dbInit');

async function test() {
    console.log("Testing MS Access connection via node-adodb...");
    try {
        await initializeDatabase();
        const users = await db.query('SELECT * FROM Users');
        console.log("Users Table Count:", users.length);
        console.log("Test Connection and Initialization Successful!");
        process.exit(0);
    } catch (err) {
        console.error("Test Connection Failed:", err);
        process.exit(1);
    }
}

test();
