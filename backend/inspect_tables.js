const ADODB = require('node-adodb');
const conn = ADODB.open('Provider=Microsoft.ACE.OLEDB.12.0;Data Source=C:\\Users\\shamb\\Desktop\\internship\\student_demodata.accdb;Persist Security Info=False;', true);

async function inspect() {
    try {
        console.log('Inspecting Tables:');
        
        try {
            const users = await conn.query('SELECT COUNT(*) AS count FROM Users');
            console.log('- Users table count:', users[0].count);
        } catch (e) {
            console.log('- Users table check failed:', e.message);
        }

        try {
            const students = await conn.query('SELECT COUNT(*) AS count FROM Students');
            console.log('- Students table count:', students[0].count);
            if (students[0].count > 0) {
                const sample = await conn.query('SELECT TOP 3 id, [name], college, department FROM Students');
                console.log('  Sample students:', JSON.stringify(sample, null, 2));
            }
        } catch (e) {
            console.log('- Students table check failed:', e.message);
        }

        try {
            const colleges = await conn.query('SELECT COUNT(*) AS count FROM Colleges');
            console.log('- Colleges table count:', colleges[0].count);
        } catch (e) {
            console.log('- Colleges table check failed:', e.message);
        }

        try {
            const departments = await conn.query('SELECT COUNT(*) AS count FROM Departments');
            console.log('- Departments table count:', departments[0].count);
        } catch (e) {
            console.log('- Departments table check failed:', e.message);
        }

        try {
            const guides = await conn.query('SELECT COUNT(*) AS count FROM Guides');
            console.log('- Guides table count:', guides[0].count);
        } catch (e) {
            console.log('- Guides table check failed:', e.message);
        }

    } catch (err) {
        console.error('Error during inspection:', err);
    }
}

inspect();
