const ADODB = require('node-adodb');
const conn = ADODB.open('Provider=Microsoft.ACE.OLEDB.12.0;Data Source=C:\\Users\\shamb\\Desktop\\internship\\st_database (1).accdb;Persist Security Info=False;', true);

async function inspect(tableName) {
    try {
        const rows = await conn.query(`SELECT COUNT(*) AS total FROM ${tableName}`);
        console.log(`Table ${tableName}: Total rows = ${rows[0].total}`);
        if (rows[0].total > 0) {
            const firstRow = await conn.query(`SELECT TOP 1 * FROM ${tableName}`);
            console.log(`First row in ${tableName}:`, firstRow[0]);
        }
    } catch (e) {
        console.error(`Failed to inspect ${tableName}:`, e.message);
    }
}

async function run() {
    console.log('Inspecting st_database (1).accdb data rows:');
    await inspect('Students');
    await inspect('Colleges');
    await inspect('Departments');
    await inspect('Guides');
    await inspect('Users');
}

run();
