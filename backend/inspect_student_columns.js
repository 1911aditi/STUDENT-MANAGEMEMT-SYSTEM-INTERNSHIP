const ADODB = require('node-adodb');
const conn = ADODB.open('Provider=Microsoft.ACE.OLEDB.12.0;Data Source=C:\\Users\\shamb\\Desktop\\internship\\st_database (1).accdb;Persist Security Info=False;', true);

async function inspect() {
    try {
        console.log('Inspecting st_database (1).accdb Students table schema:');
        const rows = await conn.query('SELECT TOP 1 * FROM Students');
        if (rows.length > 0) {
            console.log('Columns found in Students table:');
            console.log(Object.keys(rows[0]));
        } else {
            console.log('Students table is empty.');
        }
    } catch (e) {
        console.error('Inspection failed:', e.message);
    }
}

inspect();
