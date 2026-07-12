const ADODB = require('node-adodb');
const conn = ADODB.open('Provider=Microsoft.ACE.OLEDB.12.0;Data Source=C:\\Users\\shamb\\Desktop\\internship\\student_demodata.accdb;Persist Security Info=False;', true);

async function inspect() {
    try {
        console.log('Inspecting InternshipTrends Table:');
        const res = await conn.query('SELECT COUNT(*) AS count FROM InternshipTrends');
        console.log('Current row count in InternshipTrends:', res[0].count);
    } catch (e) {
        console.error('Inspection failed:', e.message);
    }
}

inspect();
