const ADODB = require('node-adodb');
const conn = ADODB.open('Provider=Microsoft.ACE.OLEDB.12.0;Data Source=C:\\Users\\shamb\\Desktop\\internship\\st_database (1).accdb;Persist Security Info=False;', true);

async function inspectTable(name) {
    try {
        const rows = await conn.query(`SELECT TOP 1 * FROM ${name}`);
        if (rows.length > 0) {
            console.log(`Columns in ${name}:`, Object.keys(rows[0]));
        } else {
            console.log(`Table ${name} is empty.`);
        }
    } catch (e) {
        console.log(`Failed to read table ${name}:`, e.message);
    }
}

async function run() {
    console.log('Inspecting st_database (1).accdb schemas:');
    await inspectTable('Users');
    await inspectTable('Colleges');
    await inspectTable('Departments');
    await inspectTable('Guides');
}

run();
