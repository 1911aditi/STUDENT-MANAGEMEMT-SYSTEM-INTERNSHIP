const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, schemaMap } = require('./db');
const { loadExcelStudents, saveExcelStudents } = require('./excelDb');
let activeDataSource = process.env.ACTIVE_DATA_SOURCE || 'Access';
const { initializeDatabase } = require('./dbInit');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Log requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// SQL Injection prevention utility for MS Access OLEDB string literals
function escapeSql(val) {
    if (val === null || val === undefined) {
        return 'NULL';
    }
    if (typeof val === 'number') {
        return val;
    }
    // Replace single quotes with double single quotes for standard SQL escaping
    const escaped = String(val).replace(/'/g, "''");
    return `'${escaped}'`;
}

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        const query = `
            SELECT * FROM Users 
            WHERE Username = ${escapeSql(username)} 
              AND [Password] = ${escapeSql(password)} 
              AND Status = 'Active'
        `;
        const result = await db.query(query);
        if (result && result.length > 0) {
            const user = result[0];
            // Format and update LastLogin
            const loginTime = new Date().toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
            await db.execute(`UPDATE Users SET LastLogin = ${escapeSql(loginTime)} WHERE AdminID = ${escapeSql(user.AdminID)}`);
            
            // Exclude password from response
            delete user.Password;
            res.json(user);
        } else {
            res.status(401).json({ error: 'Invalid username, password, or account is inactive.' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Database error during login.' });
    }
});

// ----------------------------------------------------
// STUDENTS CRUD ENDPOINTS
// ----------------------------------------------------
app.get('/api/students', async (req, res) => {
    if (activeDataSource === 'Excel') {
        try {
            const students = loadExcelStudents();
            res.json(students);
        } catch (err) {
            console.error('Error fetching students from Excel:', err);
            res.status(500).json({ error: 'Excel read error.' });
        }
        return;
    }
    const map = schemaMap.Students;
    try {
        const result = await db.query(`SELECT ${map.id} AS id, ${map.name} AS name, ${map.gender} AS gender, ${map.dob} AS dob, ${map.college} AS college, ${map.department} AS department, ${map.branch} AS branch, ${map.semester} AS semester, ${map.guide} AS guide, ${map.project} AS project, ${map.batch} AS batch, ${map.phone} AS phone, ${map.email} AS email, ${map.address} AS address FROM Students ORDER BY ${map.id} DESC`);
        res.json(result);
    } catch (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({ error: 'Database error fetching students.' });
    }
});

app.get('/api/students/search', async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ error: 'Search query parameter is required.' });
    }
    if (activeDataSource === 'Excel') {
        try {
            const students = loadExcelStudents();
            const q = query.toLowerCase();
            const filtered = students.filter(s => 
                s.name.toLowerCase().includes(q) || 
                s.id.toLowerCase().includes(q) || 
                s.college.toLowerCase().includes(q) || 
                s.branch.toLowerCase().includes(q) || 
                s.guide.toLowerCase().includes(q)
            );
            res.json(filtered);
        } catch (err) {
            console.error('Error searching students in Excel:', err);
            res.status(500).json({ error: 'Excel read error.' });
        }
        return;
    }
    const map = schemaMap.Students;
    try {
        const escapedQuery = `%${query}%`;
        const sql = `
            SELECT ${map.id} AS id, ${map.name} AS name, ${map.gender} AS gender, ${map.dob} AS dob, ${map.college} AS college, ${map.department} AS department, ${map.branch} AS branch, ${map.semester} AS semester, ${map.guide} AS guide, ${map.project} AS project, ${map.batch} AS batch, ${map.phone} AS phone, ${map.email} AS email, ${map.address} AS address 
            FROM Students 
            WHERE ${map.name} LIKE ${escapeSql(escapedQuery)} 
               OR ${map.id} LIKE ${escapeSql(escapedQuery)} 
               OR ${map.college} LIKE ${escapeSql(escapedQuery)} 
               OR ${map.department} LIKE ${escapeSql(escapedQuery)} 
               OR ${map.branch} LIKE ${escapeSql(escapedQuery)} 
               OR ${map.semester} LIKE ${escapeSql(escapedQuery)} 
               OR ${map.guide} LIKE ${escapeSql(escapedQuery)} 
            ORDER BY ${map.id} DESC
        `;
        const result = await db.query(sql);
        res.json(result);
    } catch (err) {
        console.error('Error searching students:', err);
        res.status(500).json({ error: 'Database error searching students.' });
    }
});

app.post('/api/students', async (req, res) => {
    const s = req.body;
    if (!s.id || !s.name || !s.college || !s.branch) {
        return res.status(400).json({ error: 'ID, Name, College, and Branch are required.' });
    }
    if (activeDataSource === 'Excel') {
        try {
            const students = loadExcelStudents();
            if (students.some(item => item.id.toLowerCase() === s.id.toLowerCase())) {
                return res.status(400).json({ error: 'Student ID already exists.' });
            }
            students.push(s);
            saveExcelStudents(students);
            res.status(201).json({ message: 'Student added successfully.', student: s });
        } catch (err) {
            console.error('Error adding student in Excel:', err);
            res.status(500).json({ error: 'Excel write error.' });
        }
        return;
    }
    const map = schemaMap.Students;
    try {
        // Check if student ID already exists
        const exists = await db.query(`SELECT ${map.id} FROM Students WHERE ${map.id} = ${escapeSql(s.id)}`);
        if (exists && exists.length > 0) {
            return res.status(400).json({ error: 'Student ID already exists.' });
        }

        let addressCol = 'address';
        let addressVal = escapeSql(s.address);
        if (map.address.includes('&')) {
            addressCol = '[State]';
            addressVal = escapeSql(s.address ? (s.address.split(',')[1] || s.address).trim() : '');
        }

        const insertQuery = `
            INSERT INTO Students (
                ${map.id}, ${map.name}, ${map.gender}, ${map.dob}, ${map.college}, ${map.branch}, 
                ${map.semester}, ${map.guide}, ${map.project}, ${map.batch}, ${map.phone}, ${map.email}, ${addressCol}
            ) VALUES (
                ${escapeSql(s.id)}, 
                ${escapeSql(s.name)}, 
                ${escapeSql(s.gender)}, 
                ${escapeSql(s.dob)}, 
                ${escapeSql(s.college)}, 
                ${escapeSql(s.branch)}, 
                ${escapeSql(s.semester)}, 
                ${escapeSql(s.guide)}, 
                ${escapeSql(s.project)}, 
                ${escapeSql(s.batch)}, 
                ${escapeSql(s.phone)}, 
                ${escapeSql(s.email)}, 
                ${addressVal}
            )
        `;
        await db.execute(insertQuery);
        res.status(201).json({ message: 'Student added successfully.', student: s });
    } catch (err) {
        console.error('Error adding student:', err);
        res.status(500).json({ error: 'Database error adding student.' });
    }
});

app.put('/api/students/:id', async (req, res) => {
    const studentId = req.params.id;
    const s = req.body;

    if (!s.name || !s.college || !s.branch) {
        return res.status(400).json({ error: 'Name, College, and Branch are required.' });
    }
    if (activeDataSource === 'Excel') {
        try {
            const students = loadExcelStudents();
            const idx = students.findIndex(item => item.id.toLowerCase() === studentId.toLowerCase());
            if (idx === -1) {
                return res.status(404).json({ error: 'Student not found.' });
            }
            students[idx] = { ...students[idx], ...s };
            saveExcelStudents(students);
            res.json({ message: 'Student updated successfully.' });
        } catch (err) {
            console.error('Error updating student in Excel:', err);
            res.status(500).json({ error: 'Excel write error.' });
        }
        return;
    }
    const map = schemaMap.Students;
    try {
        let addressSet = `address = ${escapeSql(s.address)}`;
        if (map.address.includes('&')) {
            addressSet = `[State] = ${escapeSql(s.address ? (s.address.split(',')[1] || s.address).trim() : '')}`;
        }

        const updateQuery = `
            UPDATE Students SET 
                ${map.name} = ${escapeSql(s.name)}, 
                ${map.gender} = ${escapeSql(s.gender)}, 
                ${map.dob} = ${escapeSql(s.dob)}, 
                ${map.college} = ${escapeSql(s.college)}, 
                ${map.branch} = ${escapeSql(s.branch)}, 
                ${map.semester} = ${escapeSql(s.semester)}, 
                ${map.guide} = ${escapeSql(s.guide)}, 
                ${map.project} = ${escapeSql(s.project)}, 
                ${map.batch} = ${escapeSql(s.batch)}, 
                ${map.phone} = ${escapeSql(s.phone)}, 
                ${map.email} = ${escapeSql(s.email)}, 
                ${addressSet}
            WHERE ${map.id} = ${escapeSql(studentId)}
        `;
        await db.execute(updateQuery);
        res.json({ message: 'Student updated successfully.' });
    } catch (err) {
        console.error('Error updating student:', err);
        res.status(500).json({ error: 'Database error updating student.' });
    }
});

app.delete('/api/students/:id', async (req, res) => {
    const studentId = req.params.id;
    if (activeDataSource === 'Excel') {
        try {
            let students = loadExcelStudents();
            students = students.filter(item => item.id.toLowerCase() !== studentId.toLowerCase());
            saveExcelStudents(students);
            res.json({ message: 'Student deleted successfully.' });
        } catch (err) {
            console.error('Error deleting student in Excel:', err);
            res.status(500).json({ error: 'Excel write error.' });
        }
        return;
    }
    const map = schemaMap.Students;
    try {
        await db.execute(`DELETE FROM Students WHERE ${map.id} = ${escapeSql(studentId)}`);
        res.json({ message: 'Student deleted successfully.' });
    } catch (err) {
        console.error('Error deleting student:', err);
        res.status(500).json({ error: 'Database error deleting student.' });
    }
});

// ----------------------------------------------------
// COLLEGES CRUD ENDPOINTS
// ----------------------------------------------------
app.get('/api/colleges', async (req, res) => {
    if (activeDataSource === 'Excel') {
        try {
            const students = loadExcelStudents();
            const collegesMap = {};
            students.forEach(s => {
                const name = s.college || "Unknown College";
                if (!collegesMap[name]) {
                    collegesMap[name] = {
                        id: `COL${String(Object.keys(collegesMap).length + 1).padStart(3, '0')}`,
                        name: name,
                        university: 'BPUT',
                        students: 0,
                        type: "Private",
                        district: "Khordha",
                        state: "Odisha",
                        departments: 5,
                        guides: 4,
                        status: "Active",
                        code: name.split(' ').map(w => w[0]).join('').toUpperCase()
                    };
                }
                collegesMap[name].students++;
            });
            res.json(Object.values(collegesMap));
        } catch (err) {
            console.error('Error fetching colleges in Excel:', err);
            res.status(500).json({ error: 'Excel read error.' });
        }
        return;
    }
    try {
        const rows = await db.query('SELECT college, Count(*) AS studentCount FROM Students GROUP BY college');
        const result = rows.map((r, idx) => ({
            id: `COL${String(idx + 1).padStart(3, '0')}`,
            name: r.college || 'Unknown College',
            university: 'BPUT',
            students: r.studentCount || 0,
            type: 'Private',
            district: 'Khordha',
            state: 'Odisha',
            departments: 5,
            guides: 4,
            status: 'Active',
            code: (r.college || 'COL').split(' ').map(w => w[0]).join('').toUpperCase()
        }));
        res.json(result);
    } catch (err) {
        console.error('Error fetching colleges:', err);
        res.status(500).json({ error: 'Database error fetching colleges.' });
    }
});

app.post('/api/colleges', async (req, res) => {
    res.status(201).json({ message: 'College added successfully (derived model).' });
});

app.put('/api/colleges/:id', async (req, res) => {
    const id = req.params.id;
    const c = req.body;
    if (activeDataSource === 'Excel') {
        try {
            const students = loadExcelStudents();
            const collegesMap = {};
            students.forEach(s => {
                const name = s.college || "Unknown College";
                if (!collegesMap[name]) {
                    collegesMap[name] = {
                        id: `COL${String(Object.keys(collegesMap).length + 1).padStart(3, '0')}`,
                        name: name
                    };
                }
            });
            const colleges = Object.values(collegesMap);
            const college = colleges.find(item => item.id === id);
            if (college) {
                students.forEach(s => {
                    if (s.college === college.name) {
                        s.college = c.name;
                    }
                });
                saveExcelStudents(students);
            }
            res.json({ message: 'College updated successfully.' });
        } catch (err) {
            console.error('Error updating college in Excel:', err);
            res.status(500).json({ error: 'Excel write error.' });
        }
        return;
    }
    try {
        const rows = await db.query('SELECT college FROM Students GROUP BY college');
        const colleges = rows.map((r, idx) => ({
            id: `COL${String(idx + 1).padStart(3, '0')}`,
            name: r.college
        }));
        const college = colleges.find(item => item.id === id);
        if (college) {
            await db.execute(`UPDATE Students SET college = ${escapeSql(c.name)} WHERE college = ${escapeSql(college.name)}`);
        }
        res.json({ message: 'College updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error.' });
    }
});

app.delete('/api/colleges/:id', async (req, res) => {
    const id = req.params.id;
    if (activeDataSource === 'Excel') {
        try {
            let students = loadExcelStudents();
            const collegesMap = {};
            students.forEach(s => {
                const name = s.college || "Unknown College";
                if (!collegesMap[name]) {
                    collegesMap[name] = {
                        id: `COL${String(Object.keys(collegesMap).length + 1).padStart(3, '0')}`,
                        name: name
                    };
                }
            });
            const colleges = Object.values(collegesMap);
            const college = colleges.find(item => item.id === id);
            if (college) {
                students = students.filter(s => s.college !== college.name);
                saveExcelStudents(students);
            }
            res.json({ message: 'College deleted successfully.' });
        } catch (err) {
            console.error('Error deleting college in Excel:', err);
            res.status(500).json({ error: 'Excel write error.' });
        }
        return;
    }
    try {
        const rows = await db.query('SELECT college FROM Students GROUP BY college');
        const colleges = rows.map((r, idx) => ({
            id: `COL${String(idx + 1).padStart(3, '0')}`,
            name: r.college
        }));
        const college = colleges.find(item => item.id === id);
        if (college) {
            await db.execute(`DELETE FROM Students WHERE college = ${escapeSql(college.name)}`);
        }
        res.json({ message: 'College deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error.' });
    }
});

// ----------------------------------------------------
// DEPARTMENTS CRUD ENDPOINTS
// ----------------------------------------------------
app.get('/api/departments', async (req, res) => {
    if (activeDataSource === 'Excel') {
        try {
            const students = loadExcelStudents();
            const deptsMap = {};
            students.forEach(s => {
                const name = s.branch || s.department || "General";
                if (!deptsMap[name]) {
                    deptsMap[name] = {
                        id: `DEP${String(Object.keys(deptsMap).length + 1).padStart(3, '0')}`,
                        name: name,
                        students: 0,
                        status: "Active",
                        faculty: 12,
                        courses: 5,
                        code: name.split(' ').map(w => w[0]).join('').toUpperCase()
                    };
                }
                deptsMap[name].students++;
            });
            res.json(Object.values(deptsMap));
        } catch (err) {
            console.error('Error fetching departments in Excel:', err);
            res.status(500).json({ error: 'Excel read error.' });
        }
        return;
    }
    try {
        const rows = await db.query('SELECT branch, Count(*) AS studentCount FROM Students GROUP BY branch');
        const result = rows.map((r, idx) => ({
            id: `DEP${String(idx + 1).padStart(3, '0')}`,
            name: r.branch || 'General',
            students: r.studentCount || 0,
            status: 'Active',
            faculty: 12,
            courses: 5,
            code: (r.branch || 'DEP').split(' ').map(w => w[0]).join('').toUpperCase()
        }));
        res.json(result);
    } catch (err) {
        console.error('Error fetching departments:', err);
        res.status(500).json({ error: 'Database error fetching departments.' });
    }
});

app.post('/api/departments', async (req, res) => {
    res.status(201).json({ message: 'Department added successfully (derived model).' });
});

app.put('/api/departments/:id', async (req, res) => {
    const id = req.params.id;
    const d = req.body;
    if (activeDataSource === 'Excel') {
        try {
            const students = loadExcelStudents();
            const deptsMap = {};
            students.forEach(s => {
                const name = s.branch || s.department || "General";
                if (!deptsMap[name]) {
                    deptsMap[name] = {
                        id: `DEP${String(Object.keys(deptsMap).length + 1).padStart(3, '0')}`,
                        name: name
                    };
                }
            });
            const depts = Object.values(deptsMap);
            const dept = depts.find(item => item.id === id);
            if (dept) {
                students.forEach(s => {
                    if (s.branch === dept.name || s.department === dept.name) {
                        s.branch = d.name;
                        s.department = d.name;
                    }
                });
                saveExcelStudents(students);
            }
            res.json({ message: 'Department updated successfully.' });
        } catch (err) {
            console.error('Error updating department in Excel:', err);
            res.status(500).json({ error: 'Excel write error.' });
        }
        return;
    }
    try {
        const rows = await db.query('SELECT branch FROM Students GROUP BY branch');
        const depts = rows.map((r, idx) => ({
            id: `DEP${String(idx + 1).padStart(3, '0')}`,
            name: r.branch
        }));
        const dept = depts.find(item => item.id === id);
        if (dept) {
            await db.execute(`UPDATE Students SET branch = ${escapeSql(d.name)}, department = ${escapeSql(d.name)} WHERE branch = ${escapeSql(dept.name)}`);
        }
        res.json({ message: 'Department updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error.' });
    }
});

app.delete('/api/departments/:id', async (req, res) => {
    const id = req.params.id;
    if (activeDataSource === 'Excel') {
        try {
            let students = loadExcelStudents();
            const deptsMap = {};
            students.forEach(s => {
                const name = s.branch || s.department || "General";
                if (!deptsMap[name]) {
                    deptsMap[name] = {
                        id: `DEP${String(Object.keys(deptsMap).length + 1).padStart(3, '0')}`,
                        name: name
                    };
                }
            });
            const depts = Object.values(deptsMap);
            const dept = depts.find(item => item.id === id);
            if (dept) {
                students = students.filter(s => s.branch !== dept.name && s.department !== dept.name);
                saveExcelStudents(students);
            }
            res.json({ message: 'Department deleted successfully.' });
        } catch (err) {
            console.error('Error deleting department in Excel:', err);
            res.status(500).json({ error: 'Excel write error.' });
        }
        return;
    }
    try {
        const rows = await db.query('SELECT branch FROM Students GROUP BY branch');
        const depts = rows.map((r, idx) => ({
            id: `DEP${String(idx + 1).padStart(3, '0')}`,
            name: r.branch
        }));
        const dept = depts.find(item => item.id === id);
        if (dept) {
            await db.execute(`DELETE FROM Students WHERE branch = ${escapeSql(dept.name)}`);
        }
        res.json({ message: 'Department deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error.' });
    }
});

// ----------------------------------------------------
// GUIDES CRUD ENDPOINTS
// ----------------------------------------------------
app.get('/api/guides', async (req, res) => {
    if (activeDataSource === 'Excel') {
        try {
            const students = loadExcelStudents();
            const guidesMap = {};
            students.forEach(s => {
                const name = s.guide || "Unknown Guide";
                if (!guidesMap[name]) {
                    guidesMap[name] = {
                        id: `GUI${String(Object.keys(guidesMap).length + 1).padStart(3, '0')}`,
                        name: name,
                        department: s.branch || s.department || "General",
                        students: 0,
                        designation: "Professor",
                        email: name.toLowerCase().replace(/[^a-z]/g, '') + '@college.edu',
                        phone: '9876543210',
                        status: "Active",
                        projects: 1
                    };
                }
                guidesMap[name].students++;
                guidesMap[name].projects = Math.round(guidesMap[name].students * 0.7) || 1;
            });
            res.json(Object.values(guidesMap));
        } catch (err) {
            console.error('Error fetching guides in Excel:', err);
            res.status(500).json({ error: 'Excel read error.' });
        }
        return;
    }
    try {
        const rows = await db.query('SELECT guide, Max(branch) AS branch, Count(*) AS studentCount FROM Students GROUP BY guide');
        const result = rows.map((r, idx) => ({
            id: `GUI${String(idx + 1).padStart(3, '0')}`,
            name: r.guide || 'Unknown Guide',
            department: r.branch || 'General',
            students: r.studentCount || 0,
            designation: 'Professor',
            email: (r.guide || 'guide').toLowerCase().replace(/\s+/g, '') + '@college.edu',
            phone: '98765432' + String(idx).padStart(2, '0'),
            status: 'Active',
            projects: Math.round((r.studentCount || 0) * 0.7) || 1
        }));
        res.json(result);
    } catch (err) {
        console.error('Error fetching guides:', err);
        res.status(500).json({ error: 'Database error fetching guides.' });
    }
});

app.post('/api/guides', async (req, res) => {
    res.status(201).json({ message: 'Guide added successfully (derived model).' });
});

app.put('/api/guides/:id', async (req, res) => {
    const id = req.params.id;
    const g = req.body;
    if (activeDataSource === 'Excel') {
        try {
            const students = loadExcelStudents();
            const guidesMap = {};
            students.forEach(s => {
                const name = s.guide || "Unknown Guide";
                if (!guidesMap[name]) {
                    guidesMap[name] = {
                        id: `GUI${String(Object.keys(guidesMap).length + 1).padStart(3, '0')}`,
                        name: name
                    };
                }
            });
            const guides = Object.values(guidesMap);
            const guide = guides.find(item => item.id === id);
            if (guide) {
                students.forEach(s => {
                    if (s.guide === guide.name) {
                        s.guide = g.name;
                    }
                });
                saveExcelStudents(students);
            }
            res.json({ message: 'Guide updated successfully.' });
        } catch (err) {
            console.error('Error updating guide in Excel:', err);
            res.status(500).json({ error: 'Excel write error.' });
        }
        return;
    }
    try {
        const rows = await db.query('SELECT guide FROM Students GROUP BY guide');
        const guides = rows.map((r, idx) => ({
            id: `GUI${String(idx + 1).padStart(3, '0')}`,
            name: r.guide
        }));
        const guide = guides.find(item => item.id === id);
        if (guide) {
            await db.execute(`UPDATE Students SET guide = ${escapeSql(g.name)} WHERE guide = ${escapeSql(guide.name)}`);
        }
        res.json({ message: 'Guide updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error.' });
    }
});

app.delete('/api/guides/:id', async (req, res) => {
    const id = req.params.id;
    if (activeDataSource === 'Excel') {
        try {
            let students = loadExcelStudents();
            const guidesMap = {};
            students.forEach(s => {
                const name = s.guide || "Unknown Guide";
                if (!guidesMap[name]) {
                    guidesMap[name] = {
                        id: `GUI${String(Object.keys(guidesMap).length + 1).padStart(3, '0')}`,
                        name: name
                    };
                }
            });
            const guides = Object.values(guidesMap);
            const guide = guides.find(item => item.id === id);
            if (guide) {
                students = students.filter(s => s.guide !== guide.name);
                saveExcelStudents(students);
            }
            res.json({ message: 'Guide deleted successfully.' });
        } catch (err) {
            console.error('Error deleting guide in Excel:', err);
            res.status(500).json({ error: 'Excel write error.' });
        }
        return;
    }
    try {
        const rows = await db.query('SELECT guide FROM Students GROUP BY guide');
        const guides = rows.map((r, idx) => ({
            id: `GUI${String(idx + 1).padStart(3, '0')}`,
            name: r.guide
        }));
        const guide = guides.find(item => item.id === id);
        if (guide) {
            await db.execute(`DELETE FROM Students WHERE guide = ${escapeSql(guide.name)}`);
        }
        res.json({ message: 'Guide deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error.' });
    }
});

// ----------------------------------------------------
// ADMINS (USERS) CRUD ENDPOINTS
// ----------------------------------------------------
app.get('/api/admins', async (req, res) => {
    try {
        const result = await db.query('SELECT AdminID, FullName, Username, Email, Phone, Role, Status, LastLogin FROM Users ORDER BY AdminID ASC');
        res.json(result);
    } catch (err) {
        console.error('Error fetching admins:', err);
        res.status(500).json({ error: 'Database error fetching admins.' });
    }
});

app.post('/api/admins', async (req, res) => {
    const a = req.body;
    try {
        const query = `
            INSERT INTO Users (AdminID, FullName, Username, [Password], Email, Phone, Role, Status, LastLogin) 
            VALUES (
                ${escapeSql(a.AdminID)}, 
                ${escapeSql(a.FullName)}, 
                ${escapeSql(a.Username)}, 
                ${escapeSql(a.Password)}, 
                ${escapeSql(a.Email)}, 
                ${escapeSql(a.Phone)}, 
                ${escapeSql(a.Role)}, 
                ${escapeSql(a.Status)}, 
                '-'
            )
        `;
        await db.execute(query);
        res.status(201).json({ message: 'Admin created successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error.' });
    }
});

app.put('/api/admins/:id', async (req, res) => {
    const id = req.params.id;
    const a = req.body;
    try {
        let passwordUpdate = '';
        if (a.Password) {
            passwordUpdate = `, [Password] = ${escapeSql(a.Password)}`;
        }
        const query = `
            UPDATE Users SET 
                FullName = ${escapeSql(a.FullName)}, 
                Username = ${escapeSql(a.Username)}, 
                Email = ${escapeSql(a.Email)}, 
                Phone = ${escapeSql(a.Phone)}, 
                Role = ${escapeSql(a.Role)}, 
                Status = ${escapeSql(a.Status)}
                ${passwordUpdate}
            WHERE AdminID = ${escapeSql(id)}
        `;
        await db.execute(query);
        res.json({ message: 'Admin details updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error.' });
    }
});

app.delete('/api/admins/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await db.execute(`DELETE FROM Users WHERE AdminID = ${escapeSql(id)}`);
        res.json({ message: 'Admin deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error.' });
    }
});

// ----------------------------------------------------
// DASHBOARD STATS ENDPOINT
// ----------------------------------------------------
app.get('/api/dashboard/stats', async (req, res) => {
    if (activeDataSource === 'Excel') {
        try {
            const students = loadExcelStudents();
            const totalStudents = students.length;
            
            const collegesDist = {};
            const guidesDist = {};
            const deptsDist = {};
            const genders = { "Male": 0, "Female": 0 };
            
            students.forEach(s => {
                const col = s.college || 'Unknown';
                collegesDist[col] = (collegesDist[col] || 0) + 1;
                
                const gui = s.guide || 'Unknown';
                guidesDist[gui] = (guidesDist[gui] || 0) + 1;
                
                const dep = s.branch || s.department || 'Unknown';
                deptsDist[dep] = (deptsDist[dep] || 0) + 1;
                
                const g = s.gender === 'Female' ? 'Female' : 'Male';
                genders[g] = (genders[g] || 0) + 1;
            });
            
            const totalColleges = Object.keys(collegesDist).filter(k => k !== 'Unknown').length || 0;
            const totalGuides = Object.keys(guidesDist).filter(k => k !== 'Unknown').length || 0;
            const totalDepartments = Object.keys(deptsDist).filter(k => k !== 'Unknown').length || 0;
            
            // Format recent records for frontend table
            const records = students.slice(0, 10).map(s => ({
                id: s.id,
                studentName: s.name,
                college: s.college,
                department: s.branch || s.department,
                guide: s.guide,
                year: s.semester || '-',
                addedOn: s.batch || '-'
            }));
            
            res.json({
                totalStudents,
                totalColleges,
                totalGuides,
                totalDepartments,
                colleges: collegesDist,
                guides: guidesDist,
                departments: deptsDist,
                genders,
                records
            });
        } catch (err) {
            console.error('Error fetching dashboard stats in Excel:', err);
            res.status(500).json({ error: 'Excel read error.' });
        }
        return;
    }
    try {
        const mapS = schemaMap.Students;

        // Fetch counts, distributions, and recent records in parallel
        const [
            studentCountRes,
            collegesDist,
            guidesDist,
            deptsDist,
            gendersDist,
            recentRecords
        ] = await Promise.all([
            db.query('SELECT COUNT(*) AS total FROM Students'),
            db.query(`SELECT ${mapS.college} AS college, COUNT(*) AS cnt FROM Students GROUP BY ${mapS.college}`),
            db.query(`SELECT ${mapS.guide} AS [guide], COUNT(*) AS cnt FROM Students GROUP BY ${mapS.guide}`),
            db.query(`SELECT ${mapS.department} AS department, COUNT(*) AS cnt FROM Students GROUP BY ${mapS.department}`),
            db.query(`SELECT ${mapS.gender} AS [gender], COUNT(*) AS cnt FROM Students GROUP BY ${mapS.gender}`),
            db.query(`SELECT TOP 10 ${mapS.id} AS id, ${mapS.name} AS [name], ${mapS.college} AS college, ${mapS.department} AS department, ${mapS.guide} AS [guide], ${mapS.semester} AS [semester], ${mapS.batch} AS [batch] FROM Students ORDER BY ${mapS.id} DESC`)
        ]);

        const totalStudents = studentCountRes[0].total || 0;
        const totalColleges = collegesDist.filter(item => item.college).length || 0;
        const totalGuides = guidesDist.filter(item => item.guide).length || 0;
        const totalDepartments = deptsDist.filter(item => item.department).length || 0;

        // Convert distributions to objects for frontend mapping
        const colleges = {};
        collegesDist.forEach(item => {
            colleges[item.college || 'Unknown'] = item.cnt;
        });

        const guides = {};
        guidesDist.forEach(item => {
            guides[item.guide || 'Unknown'] = item.cnt;
        });

        const departments = {};
        deptsDist.forEach(item => {
            departments[item.department || 'Unknown'] = item.cnt;
        });

        const genders = { "Male": 0, "Female": 0 };
        gendersDist.forEach(item => {
            const g = (item.gender || 'Male').trim();
            genders[g] = item.cnt;
        });

        // Format recent records for frontend table
        const records = recentRecords.map(r => ({
            id: r.id,
            studentName: r.name,
            college: r.college,
            department: r.department,
            guide: r.guide,
            year: r.semester || '-',
            addedOn: r.batch || '-'
        }));

        res.json({
            totalStudents,
            totalColleges,
            totalGuides,
            totalDepartments,
            colleges,
            guides,
            departments,
            genders,
            records
        });
    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({ error: 'Database error compiling dashboard statistics.' });
    }
});

const fs = require('fs');

const statsHelper = require('./statsHelper');

// Helper to construct WHERE clause for trends
function buildTrendsWhereClause(req) {
    const { year, university, college, branch, state, duration } = req.query;
    const conditions = [];

    if (year && year !== 'All Years') {
        conditions.push(`[Year] = ${Number(year)}`);
    }
    if (university && university !== 'All Universities') {
        conditions.push(`University = ${escapeSql(university)}`);
    }
    if (college && college !== 'All Colleges') {
        conditions.push(`College = ${escapeSql(college)}`);
    }
    if (branch && branch !== 'All Branches') {
        conditions.push(`Branch = ${escapeSql(branch)}`);
    }
    if (state && state !== 'All States') {
        conditions.push(`[State] = ${escapeSql(state)}`);
    }
    if (duration && duration !== 'All Durations') {
        conditions.push(`Duration = ${Number(duration)}`);
    }

    return conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
}

// ----------------------------------------------------
// TREND ANALYSIS ROUTE HANDLERS
// ----------------------------------------------------
app.get('/api/trends/filters', async (req, res) => {
    try {
        const data = await db.query('SELECT [Year], University, College, Branch, [State], Duration FROM InternshipTrends');
        const years = [...new Set(data.map(d => d.Year))].sort((a,b) => b-a);
        const universities = [...new Set(data.map(d => d.University))].sort();
        const colleges = [...new Set(data.map(d => d.College))].sort();
        const branches = [...new Set(data.map(d => d.Branch))].sort();
        const states = [...new Set(data.map(d => d.State))].sort();
        const durations = [...new Set(data.map(d => d.Duration))].sort((a,b) => a-b);

        res.json({ years, universities, colleges, branches, states, durations });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error fetching trend filters.' });
    }
});

app.get('/api/trends/stats', async (req, res) => {
    const where = buildTrendsWhereClause(req);
    try {
        const rows = await db.query(`SELECT University, College, Branch, StudentsApplied, StudentsSelected, InternshipSeats FROM InternshipTrends ${where}`);
        
        let totalApplied = 0;
        let totalSelected = 0;
        let totalSeats = 0;
        const universities = new Set();
        const colleges = new Set();
        const branches = new Set();

        rows.forEach(r => {
            totalApplied += r.StudentsApplied || 0;
            totalSelected += r.StudentsSelected || 0;
            totalSeats += r.InternshipSeats || 0;
            if (r.University) universities.add(r.University);
            if (r.College) colleges.add(r.College);
            if (r.Branch) branches.add(r.Branch);
        });

        const rate = totalApplied === 0 ? 0 : (totalSelected / totalApplied) * 100;

        res.json({
            totalApplied,
            totalSelected,
            totalSeats,
            selectionRate: parseFloat(rate.toFixed(2)),
            universitiesCount: universities.size,
            collegesCount: colleges.size,
            branchesCount: branches.size
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error calculating stats.' });
    }
});

app.get('/api/trends/analysis', async (req, res) => {
    const where = buildTrendsWhereClause(req);
    try {
        const rows = await db.query(`SELECT [Year], StudentsApplied, StudentsSelected, University, College, Branch FROM InternshipTrends ${where} ORDER BY [Year] ASC`);
        
        const yearly = {};
        rows.forEach(r => {
            const yr = r.Year;
            if (!yearly[yr]) {
                yearly[yr] = { year: yr, applied: 0, selected: 0, universities: new Set(), colleges: new Set(), branches: new Set() };
            }
            yearly[yr].applied += r.StudentsApplied || 0;
            yearly[yr].selected += r.StudentsSelected || 0;
            if (r.University) yearly[yr].universities.add(r.University);
            if (r.College) yearly[yr].colleges.add(r.College);
            if (r.Branch) yearly[yr].branches.add(r.Branch);
        });

        const list = Object.values(yearly).sort((a,b) => a.year - b.year);
        
        for (let i = 0; i < list.length; i++) {
            const current = list[i];
            
            if (i === 0) {
                current.growthRate = 0;
            } else {
                const prev = list[i - 1];
                current.growthRate = prev.applied === 0 ? 0 : parseFloat((((current.applied - prev.applied) / prev.applied) * 100).toFixed(2));
            }

            if (i < 2) {
                current.movingAverage = current.applied;
            } else {
                current.movingAverage = Math.round((list[i].applied + list[i - 1].applied + list[i - 2].applied) / 3);
            }
        }

        let cagr = 0;
        if (list.length > 1) {
            const start = list[0].applied;
            const end = list[list.length - 1].applied;
            const n = list.length - 1;
            if (start > 0 && end > 0) {
                cagr = parseFloat(((Math.pow(end / start, 1 / n) - 1) * 100).toFixed(2));
            }
        }

        const resultList = list.map(item => ({
            ...item,
            universities: item.universities.size,
            colleges: item.colleges.size,
            branches: item.branches.size
        }));

        res.json({ list: resultList, cagr });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error calculating trends.' });
    }
});

app.get('/api/trends/correlation', async (req, res) => {
    const where = buildTrendsWhereClause(req);
    try {
        const rows = await db.query(`SELECT [Year], University, College, Branch, StudentsApplied, StudentsSelected, InternshipSeats, Duration FROM InternshipTrends ${where} ORDER BY [Year] ASC`);
        
        const yearly = {};
        rows.forEach(r => {
            const yr = r.Year;
            if (!yearly[yr]) {
                yearly[yr] = { 
                    year: yr, 
                    colleges: new Set(), 
                    universities: new Set(), 
                    branches: new Set(), 
                    seats: 0, 
                    applied: 0, 
                    selected: 0,
                    durationSum: 0,
                    durationCount: 0
                };
            }
            if (r.College) yearly[yr].colleges.add(r.College);
            if (r.University) yearly[yr].universities.add(r.University);
            if (r.Branch) yearly[yr].branches.add(r.Branch);
            yearly[yr].seats += r.InternshipSeats || 0;
            yearly[yr].applied += r.StudentsApplied || 0;
            yearly[yr].selected += r.StudentsSelected || 0;
            yearly[yr].durationSum += r.Duration || 0;
            yearly[yr].durationCount++;
        });

        const list = Object.values(yearly).sort((a,b) => a.year - b.year);
        
        const Y = list.map(item => item.applied);
        const variables = {
            colleges: list.map(item => item.colleges.size),
            universities: list.map(item => item.universities.size),
            branches: list.map(item => item.branches.size),
            seats: list.map(item => item.seats),
            selectionRate: list.map(item => item.applied === 0 ? 0 : item.selected / item.applied),
            duration: list.map(item => item.durationCount === 0 ? 0 : item.durationSum / item.durationCount),
            year: list.map(item => item.year)
        };

        const correlations = {};
        for (const [key, X] of Object.entries(variables)) {
            correlations[key] = parseFloat(statsHelper.calculateCorrelation(X, Y).toFixed(4));
        }

        const interpretations = {};
        for (const [key, val] of Object.entries(correlations)) {
            const absVal = Math.abs(val);
            let strength = 'Weak';
            if (absVal >= 0.7) strength = 'Strong';
            else if (absVal >= 0.4) strength = 'Moderate';
            
            const direction = val >= 0 ? 'positive' : 'negative';
            interpretations[key] = `${strength} ${direction} correlation (${val}).`;
        }

        res.json({ correlations, interpretations });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error calculating correlation.' });
    }
});

app.get('/api/trends/regression', async (req, res) => {
    const where = buildTrendsWhereClause(req);
    try {
        const rows = await db.query(`SELECT [Year], University, College, Branch, StudentsApplied, StudentsSelected, InternshipSeats, Duration FROM InternshipTrends ${where} ORDER BY [Year] ASC`);
        
        const yearly = {};
        rows.forEach(r => {
            const yr = r.Year;
            if (!yearly[yr]) {
                yearly[yr] = { 
                    year: yr, 
                    colleges: new Set(), 
                    universities: new Set(), 
                    branches: new Set(), 
                    seats: 0, 
                    applied: 0, 
                    selected: 0,
                    durationSum: 0,
                    durationCount: 0
                };
            }
            if (r.College) yearly[yr].colleges.add(r.College);
            if (r.University) yearly[yr].universities.add(r.University);
            if (r.Branch) yearly[yr].branches.add(r.Branch);
            yearly[yr].seats += r.InternshipSeats || 0;
            yearly[yr].applied += r.StudentsApplied || 0;
            yearly[yr].selected += r.StudentsSelected || 0;
            yearly[yr].durationSum += r.Duration || 0;
            yearly[yr].durationCount++;
        });

        const list = Object.values(yearly).sort((a,b) => a.year - b.year);
        
        if (list.length < 3) {
            return res.status(400).json({ error: 'At least 3 years of historical records are required to perform multiple linear regression.' });
        }

        const X_matrix = list.map(item => [
            item.colleges.size,
            item.universities.size,
            item.branches.size,
            item.seats,
            item.applied === 0 ? 0 : item.selected / item.applied,
            item.durationCount === 0 ? 0 : item.durationSum / item.durationCount,
            item.year
        ]);

        const Y_vector = list.map(item => item.applied);

        const result = statsHelper.runMultipleRegression(X_matrix, Y_vector);
        
        if (!result.success) {
            return res.status(500).json({ error: result.error || 'Failed to solve regression model.' });
        }

        const labels = ['Intercept', 'Participating Colleges', 'Universities', 'Branches', 'Internship Seats', 'Selection Rate', 'Internship Duration', 'Year'];
        const impacts = [];
        for (let i = 1; i < result.coefficients.length; i++) {
            const coef = result.coefficients[i];
            const direction = coef >= 0 ? 'increases' : 'decreases';
            impacts.push(`Each additional ${labels[i]} ${direction} the applicants by approximately ${Math.abs(Math.round(coef))} students.`);
        }

        res.json({
            coefficients: result.coefficients,
            pValues: result.pValues,
            r2: parseFloat(result.r2.toFixed(4)),
            adjustedR2: parseFloat(result.adjustedR2.toFixed(4)),
            rmse: parseFloat(result.rmse.toFixed(2)),
            mae: parseFloat(result.mae.toFixed(2)),
            impacts,
            labels
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error executing regression analysis.' });
    }
});

app.get('/api/trends/forecast', async (req, res) => {
    const where = buildTrendsWhereClause(req);
    try {
        const rows = await db.query(`SELECT [Year], StudentsApplied FROM InternshipTrends ${where} ORDER BY [Year] ASC`);
        
        const yearly = {};
        rows.forEach(r => {
            const yr = r.Year;
            if (!yearly[yr]) yearly[yr] = 0;
            yearly[yr] += r.StudentsApplied || 0;
        });

        const years = Object.keys(yearly).map(Number).sort((a,b) => a-b);
        const applicants = years.map(yr => yearly[yr]);

        if (years.length < 3) {
            return res.status(400).json({ error: 'At least 3 years of historical records are required to generate statistical forecasts.' });
        }

        const forecast = statsHelper.forecastModels(years, applicants);
        res.json(forecast);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error calculating forecasts.' });
    }
});

app.get('/api/trends/reports', async (req, res) => {
    const where = buildTrendsWhereClause(req);
    try {
        const rows = await db.query(`SELECT [Year], University, College, Branch, StudentsApplied, StudentsSelected, InternshipSeats, Duration FROM InternshipTrends ${where} ORDER BY [Year] DESC, StudentsApplied DESC`);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error fetching reports data.' });
    }
});

// ----------------------------------------------------
// DATABASE UPLOAD & PATH SWITCHING ENDPOINT
// ----------------------------------------------------
app.post('/api/database/upload', async (req, res) => {
    const filename = req.query.name || 'student_demodata.accdb';
    if (!filename.toLowerCase().endsWith('.accdb')) {
        return res.status(400).json({ error: 'Only .accdb MS Access database files are allowed.' });
    }

    const targetPath = path.join(__dirname, '..', filename);
    const tempPath = path.join(__dirname, '..', `temp_upload_${Date.now()}.accdb`);
    console.log(`Received database file upload. Streaming to temp file first: ${tempPath}`);

    const { updateDatabasePath, dbPath } = require('./db');
    const originalPath = dbPath;

    try {
        // Read raw request stream and write to temp file first
        const fileStream = fs.createWriteStream(tempPath);
        
        await new Promise((resolve, reject) => {
            req.pipe(fileStream);
            req.on('end', () => {
                fileStream.end();
                resolve();
            });
            req.on('error', reject);
            fileStream.on('error', reject);
        });

        console.log(`Temp upload completed. Overwriting target path: ${targetPath}`);
        
        // Overwrite the target path by copying the temp file
        fs.copyFileSync(tempPath, targetPath);
        
        // Clean up temp file
        try {
            fs.unlinkSync(tempPath);
        } catch (e) {
            console.error('Failed to delete temp upload file:', e);
        }

        // Update active database path and re-initialize connection in memory
        updateDatabasePath(targetPath);

        // Run dbInit sequence to ensure required tables exist in the new database
        await initializeDatabase();

        // Update the path inside .env file for persistence on server restarts
        const envPath = path.join(__dirname, '..', '.env');
        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        if (envContent.includes('DB_PATH=')) {
            envContent = envContent.replace(/DB_PATH=.*/, `DB_PATH=${targetPath}`);
        } else {
            envContent += `\nDB_PATH=${targetPath}`;
        }
        fs.writeFileSync(envPath, envContent, 'utf8');

        res.json({ message: 'Access database connected successfully!', filename });
    } catch (err) {
        console.error('Error saving or connecting to database file:', err);
        
        // Clean up temp file if still exists
        if (fs.existsSync(tempPath)) {
            try { fs.unlinkSync(tempPath); } catch (e) {}
        }
        
        // Revert active path to original working database
        updateDatabasePath(originalPath);
        res.status(500).json({ error: 'Failed to process and connect to the selected Access database file.' });
    }
});

app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    if (password === adminPassword) {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Incorrect admin password.' });
    }
});

app.get('/api/database/active', (req, res) => {
    try {
        const { dbPath } = require('./db');
        const filename = path.basename(dbPath);
        res.json({ filename, path: dbPath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get active database.' });
    }
});

// Centralized Active Data Source endpoints
app.get('/api/datasource/active', (req, res) => {
    res.json({ activeDataSource });
});

app.post('/api/datasource/active', (req, res) => {
    const { source } = req.body;
    if (source !== 'Excel' && source !== 'Access') {
        return res.status(400).json({ error: 'Invalid data source.' });
    }
    activeDataSource = source;
    
    // Save to .env
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    if (envContent.includes('ACTIVE_DATA_SOURCE=')) {
        envContent = envContent.replace(/ACTIVE_DATA_SOURCE=.*/, `ACTIVE_DATA_SOURCE=${source}`);
    } else {
        envContent += `\nACTIVE_DATA_SOURCE=${source}`;
    }
    fs.writeFileSync(envPath, envContent, 'utf8');
    
    console.log(`[Server] Active data source switched centrally to: ${source}`);
    res.json({ message: `Active data source switched centrally to ${source}`, activeDataSource });
});

// ----------------------------------------------------
// BACKUP & RESTORE ENDPOINTS
// ----------------------------------------------------
app.get('/api/backup/download', async (req, res) => {
    try {
        const students = await db.query('SELECT * FROM Students');
        let colleges = [], departments = [], guides = [];
        try { colleges = await db.query('SELECT * FROM Colleges'); } catch(e){}
        try { departments = await db.query('SELECT * FROM Departments'); } catch(e){}
        try { guides = await db.query('SELECT * FROM Guides'); } catch(e){}
        const users = await db.query('SELECT * FROM Users');

        res.json({
            students,
            colleges,
            departments,
            guides,
            users
        });
    } catch (err) {
        console.error('Backup error:', err);
        res.status(500).json({ error: 'Failed to retrieve database backup.' });
    }
});

app.post('/api/backup/restore', async (req, res) => {
    const data = req.body;
    if (!data.students || !data.users) {
        return res.status(400).json({ error: 'Invalid backup file format.' });
    }

    try {
        // Clear all tables
        await db.execute('DELETE FROM Students');
        try { await db.execute('DELETE FROM Colleges'); } catch(e){}
        try { await db.execute('DELETE FROM Departments'); } catch(e){}
        try { await db.execute('DELETE FROM Guides'); } catch(e){}
        await db.execute('DELETE FROM Users');

        // Restore Users
        for (const u of data.users) {
            const query = `
                INSERT INTO Users (AdminID, FullName, Username, [Password], Email, Phone, Role, Status, LastLogin) 
                VALUES (
                    ${escapeSql(u.AdminID)}, 
                    ${escapeSql(u.FullName)}, 
                    ${escapeSql(u.Username)}, 
                    ${escapeSql(u.Password || 'admin123')}, 
                    ${escapeSql(u.Email)}, 
                    ${escapeSql(u.Phone)}, 
                    ${escapeSql(u.Role)}, 
                    ${escapeSql(u.Status)}, 
                    ${escapeSql(u.LastLogin || '-')}
                )
            `;
            await db.execute(query);
        }

        // Restore Colleges (if table exists)
        if (data.colleges) {
            for (const c of data.colleges) {
                try {
                    const query = `
                        INSERT INTO Colleges (id, name, type, district, state, university, students, guides, departments) 
                        VALUES (
                            ${escapeSql(c.id)}, 
                            ${escapeSql(c.name)}, 
                            ${escapeSql(c.type)}, 
                            ${escapeSql(c.district)}, 
                            ${escapeSql(c.state)}, 
                            ${escapeSql(c.university)}, 
                            ${Number(c.students) || 0}, 
                            ${Number(c.guides) || 0}, 
                            ${Number(c.departments) || 0}
                        )
                    `;
                    await db.execute(query);
                } catch(e){}
            }
        }

        // Restore Departments (if table exists)
        if (data.departments) {
            for (const d of data.departments) {
                try {
                    const query = `
                        INSERT INTO Departments (id, name, faculty, students, courses, status) 
                        VALUES (
                            ${escapeSql(d.id)}, 
                            ${escapeSql(d.name)}, 
                            ${Number(d.faculty) || 0}, 
                            ${Number(d.students) || 0}, 
                            ${Number(d.courses) || 0}, 
                            ${escapeSql(d.status)}
                        )
                    `;
                    await db.execute(query);
                } catch(e){}
            }
        }

        // Restore Guides (if table exists)
        if (data.guides) {
            for (const g of data.guides) {
                try {
                    const query = `
                        INSERT INTO Guides (id, name, department, designation, students, projects, email, phone, status) 
                        VALUES (
                            ${escapeSql(g.id)}, 
                            ${escapeSql(g.name)}, 
                            ${escapeSql(g.department)}, 
                            ${escapeSql(g.designation)}, 
                            ${Number(g.students) || 0}, 
                            ${Number(g.projects) || 0}, 
                            ${escapeSql(g.email)}, 
                            ${escapeSql(g.phone)}, 
                            ${escapeSql(g.status)}
                        )
                    `;
                    await db.execute(query);
                } catch(e){}
            }
        }

        // Restore Students
        for (const s of data.students) {
            const query = `
                INSERT INTO Students (
                    id, name, gender, dob, college, department, branch, 
                    semester, guide, project, batch, phone, email, address
                ) VALUES (
                    ${escapeSql(s.id)}, 
                    ${escapeSql(s.name)}, 
                    ${escapeSql(s.gender)}, 
                    ${escapeSql(s.dob)}, 
                    ${escapeSql(s.college)}, 
                    ${escapeSql(s.department)}, 
                    ${escapeSql(s.branch)}, 
                    ${escapeSql(s.semester)}, 
                    ${escapeSql(s.guide)}, 
                    ${escapeSql(s.project)}, 
                    ${escapeSql(s.batch)}, 
                    ${escapeSql(s.phone)}, 
                    ${escapeSql(s.email)}, 
                    ${escapeSql(s.address)}
                )
            `;
            await db.execute(query);
        }

        res.json({ message: 'Database successfully restored from backup.' });
    } catch (err) {
        console.error('Restore error:', err);
        res.status(500).json({ error: 'Failed to restore database from backup.' });
    }
});

// Serve frontend static files
// Root directory has all html, css, js files
app.use(express.static(path.join(__dirname, '..')));

// Catch-all to direct users to dashboard
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '..', 'login.html'));
});

// Startup sequence
const os = require('os');
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

initializeDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        const localIp = getLocalIpAddress();
        console.log(`====================================================`);
        console.log(`Server listening offline on: http://localhost:${PORT}`);
        console.log(`Offline LAN Access: http://${localIp}:${PORT}/login.html`);
        console.log(`====================================================`);
    });
}).catch(err => {
    console.error('FATAL: Failed to initialize Microsoft Access Database.', err);
    process.exit(1);
});
