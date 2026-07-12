const ADODB = require('node-adodb');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'student_demodata.accdb');

// If configured absolute path does not exist (e.g. copied to another PC), search locally for the same file name first
if (process.env.DB_PATH && !fs.existsSync(process.env.DB_PATH)) {
    const filename = path.basename(process.env.DB_PATH);
    const localPath = path.join(__dirname, '..', filename);
    if (fs.existsSync(localPath)) {
        dbPath = localPath;
    } else {
        dbPath = path.join(__dirname, '..', 'student_demodata.accdb');
    }
}

const is64 = process.arch.includes('64');
let dbInstance = ADODB.open(`Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};Persist Security Info=False;Mode=Share Deny None;`, is64);

const schemaMap = {
    Students: {
        id: 'id',
        name: 'name',
        gender: 'gender',
        dob: 'dob',
        college: 'college',
        department: 'department',
        branch: 'branch',
        semester: 'semester',
        guide: 'guide',
        project: 'project',
        batch: 'batch',
        phone: 'phone',
        email: 'email',
        address: 'address'
    },
    Colleges: {
        id: 'id',
        name: 'name',
        code: 'code',
        status: 'status',
        type: 'type',
        district: 'district',
        state: 'state',
        university: 'university',
        students: 'students',
        guides: 'guides',
        departments: 'departments'
    },
    Departments: {
        id: 'id',
        name: 'name',
        code: 'code',
        status: 'status',
        faculty: 'faculty',
        students: 'students',
        courses: 'courses'
    },
    Guides: {
        id: 'id',
        name: 'name',
        department: 'department',
        designation: 'designation',
        students: 'students',
        projects: 'projects',
        email: 'email',
        phone: 'phone',
        status: 'status'
    }
};

async function detectSchema() {
    try {
        // Inspect Students table
        const studentRow = await dbInstance.query('SELECT TOP 1 * FROM Students');
        if (studentRow.length > 0) {
            const keys = Object.keys(studentRow[0]);
            const map = schemaMap.Students;
            
            if (keys.includes('Student ID')) map.id = '[Student ID]';
            else map.id = 'id';

            if (keys.includes('Name')) map.name = '[Name]';
            else map.name = 'name';

            if (keys.includes('Gender')) map.gender = '[Gender]';
            else map.gender = 'gender';

            if (keys.includes('DOB')) map.dob = '[DOB]';
            else map.dob = 'dob';

            if (keys.includes('College')) map.college = '[College]';
            else map.college = 'college';

            if (keys.includes('Branch')) {
                map.branch = '[Branch]';
                map.department = '[Branch]';
            } else {
                map.branch = 'branch';
                map.department = 'department';
            }

            if (keys.includes('Semester')) map.semester = '[Semester]';
            else map.semester = 'semester';

            if (keys.includes('Guide')) map.guide = '[Guide]';
            else map.guide = 'guide';

            if (keys.includes('Project')) map.project = '[Project]';
            else map.project = 'project';

            if (keys.includes('Batch')) map.batch = '[Batch]';
            else map.batch = 'batch';

            if (keys.includes('Phone')) map.phone = '[Phone]';
            else map.phone = 'phone';

            if (keys.includes('Email')) map.email = '[Email]';
            else map.email = 'email';

            if (keys.includes('District') && keys.includes('State')) {
                map.address = "([District] & ', ' & [State])";
            } else {
                map.address = 'address';
            }
        }
        
        // Inspect Colleges table
        const collegeRow = await dbInstance.query('SELECT TOP 1 * FROM Colleges');
        if (collegeRow.length > 0) {
            const keys = Object.keys(collegeRow[0]);
            const map = schemaMap.Colleges;
            if (keys.includes('university')) map.code = '[university]';
            else map.code = 'code';
            
            if (keys.includes('status')) map.status = 'status';
            else map.status = "'Active'";

            if (keys.includes('type')) map.type = 'type';
            else map.type = "'Private'";

            if (keys.includes('district')) map.district = 'district';
            else map.district = "''";

            if (keys.includes('state')) map.state = 'state';
            else map.state = "'Odisha'";

            if (keys.includes('university')) map.university = 'university';
            else map.university = "''";

            if (keys.includes('students')) map.students = 'students';
            else map.students = `(SELECT COUNT(*) FROM Students WHERE Students.${schemaMap.Students.college} = Colleges.name)`;

            if (keys.includes('guides')) map.guides = 'guides';
            else map.guides = '0';

            if (keys.includes('departments')) map.departments = 'departments';
            else map.departments = '0';
        }

        // Inspect Departments table
        const deptRow = await dbInstance.query('SELECT TOP 1 * FROM Departments');
        if (deptRow.length > 0) {
            const keys = Object.keys(deptRow[0]);
            const map = schemaMap.Departments;
            if (keys.includes('faculty')) map.code = '[faculty]';
            else map.code = 'code';
            
            if (keys.includes('status')) map.status = 'status';
            else map.status = "'Active'";

            if (keys.includes('faculty')) map.faculty = 'faculty';
            else map.faculty = '0';

            if (keys.includes('students')) map.students = 'students';
            else map.students = `(SELECT COUNT(*) FROM Students WHERE Students.${schemaMap.Students.department} = Departments.name)`;

            if (keys.includes('courses')) map.courses = 'courses';
            else map.courses = '0';
        }

        // Inspect Guides table
        const guideRow = await dbInstance.query('SELECT TOP 1 * FROM Guides');
        if (guideRow.length > 0) {
            const keys = Object.keys(guideRow[0]);
            const map = schemaMap.Guides;
            if (keys.includes('Guide')) {
                map.id = '[Guide]';
                map.name = '[Guide]';
            } else {
                map.id = 'id';
                map.name = 'name';
            }
            if (keys.includes('Dept')) map.department = '[Dept]';
            else map.department = 'department';

            if (keys.includes('Status')) map.status = '[Status]';
            else map.status = 'status';

            if (keys.includes('Exclusive Projects')) map.projects = '[Exclusive Projects]';
            else map.projects = 'projects';

            if (!keys.includes('designation')) map.designation = "'Professor'";
            else map.designation = 'designation';
            
            if (!keys.includes('students')) {
                // Compute students dynamically by counting students assigned to this guide name!
                map.students = `(SELECT COUNT(*) FROM Students WHERE Students.${schemaMap.Students.guide} = Guides.${map.name})`;
            } else {
                map.students = 'students';
            }
            
            if (!keys.includes('email')) map.email = "''";
            else map.email = 'email';
            
            if (!keys.includes('phone')) map.phone = "''";
            else map.phone = 'phone';
        }

        console.log('Dynamic schema mapping established successfully.');
    } catch (err) {
        console.error('Failed to detect schema maps, using default mappings:', err);
    }
}

// Initial detection
detectSchema();

const db = {
    query: (sql) => dbInstance.query(sql),
    execute: (sql) => dbInstance.execute(sql)
};

function updateDatabasePath(newPath) {
    dbPath = newPath;
    const connectionString = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};Persist Security Info=False;Mode=Share Deny None;`;
    dbInstance = ADODB.open(connectionString, is64);
    console.log(`Database re-initialized to path: ${dbPath}`);
    detectSchema(); // Re-detect columns on database change
}

console.log(`Database initialized in ${is64 ? '64-bit' : '32-bit'} mode with connection path: ${dbPath}`);

module.exports = {
    db,
    get dbPath() { return dbPath; },
    schemaMap,
    updateDatabasePath
};
