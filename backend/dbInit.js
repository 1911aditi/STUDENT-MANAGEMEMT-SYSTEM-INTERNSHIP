const { db } = require('./db');

async function initializeDatabase() {
    console.log('Starting Microsoft Access database initialization...');

    // 1. Users Table
    try {
        await db.query('SELECT TOP 1 * FROM Users');
        console.log('Table "Users" already exists.');
    } catch (err) {
        console.log('Table "Users" does not exist. Creating...');
        const createQuery = `
            CREATE TABLE Users (
                AdminID VARCHAR(50) PRIMARY KEY,
                FullName VARCHAR(100),
                Username VARCHAR(50),
                [Password] VARCHAR(50),
                Email VARCHAR(100),
                Phone VARCHAR(50),
                Role VARCHAR(50),
                Status VARCHAR(50),
                LastLogin VARCHAR(50)
            )
        `;
        await db.execute(createQuery);
        console.log('Table "Users" created successfully.');

        // Insert default admins
        const seedQueries = [
            `INSERT INTO Users (AdminID, FullName, Username, [Password], Email, Phone, Role, Status, LastLogin) VALUES ('ADM001', 'Super Administrator', 'superadmin', 'super123', 'superadmin@college.local', '9876543210', 'Super Administrator', 'Active', '-')`,
            `INSERT INTO Users (AdminID, FullName, Username, [Password], Email, Phone, Role, Status, LastLogin) VALUES ('ADM002', 'Admin User', 'admin1', 'admin123', 'admin1@college.local', '9876500001', 'Administrator', 'Active', '-')`,
            `INSERT INTO Users (AdminID, FullName, Username, [Password], Email, Phone, Role, Status, LastLogin) VALUES ('ADM003', 'College Admin', 'admin2', 'admin234', 'admin2@college.local', '9876500002', 'Administrator', 'Inactive', '-')`
        ];
        for (const query of seedQueries) {
            await db.execute(query);
        }
        console.log('Table "Users" seeded with default accounts.');
    }

    // 2. Colleges Table
    try {
        await db.query('SELECT TOP 1 * FROM Colleges');
        console.log('Table "Colleges" already exists.');
    } catch (err) {
        console.log('Table "Colleges" does not exist. Creating...');
        const createQuery = `
            CREATE TABLE Colleges (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255),
                type VARCHAR(50),
                district VARCHAR(100),
                state VARCHAR(100),
                university VARCHAR(100),
                students INT,
                guides INT,
                departments INT
            )
        `;
        await db.execute(createQuery);
        console.log('Table "Colleges" created successfully.');

        // Insert seed colleges
        const seedQueries = [
            `INSERT INTO Colleges (id, name, type, district, state, university, students, guides, departments) VALUES ('COL001', 'KIIT University', 'Private', 'Khordha', 'Odisha', 'KIIT', 832, 45, 10)`,
            `INSERT INTO Colleges (id, name, type, district, state, university, students, guides, departments) VALUES ('COL002', 'SOA University', 'Private', 'Bhubaneswar', 'Odisha', 'SOA', 645, 38, 12)`,
            `INSERT INTO Colleges (id, name, type, district, state, university, students, guides, departments) VALUES ('COL003', 'CET Bhubaneswar', 'Government', 'Bhubaneswar', 'Odisha', 'BPUT', 512, 25, 8)`,
            `INSERT INTO Colleges (id, name, type, district, state, university, students, guides, departments) VALUES ('COL004', 'ITER', 'Private', 'Bhubaneswar', 'Odisha', 'SOA', 210, 15, 6)`
        ];
        for (const query of seedQueries) {
            await db.execute(query);
        }
        console.log('Table "Colleges" seeded with default data.');
    }

    // 3. Departments Table
    try {
        await db.query('SELECT TOP 1 * FROM Departments');
        console.log('Table "Departments" already exists.');
    } catch (err) {
        console.log('Table "Departments" does not exist. Creating...');
        const createQuery = `
            CREATE TABLE Departments (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255),
                faculty INT,
                students INT,
                courses INT,
                status VARCHAR(50)
            )
        `;
        await db.execute(createQuery);
        console.log('Table "Departments" created successfully.');

        // Insert seed departments
        const seedQueries = [
            `INSERT INTO Departments (id, name, faculty, students, courses, status) VALUES ('DEP001', 'Computer Science', 28, 620, 8, 'Active')`,
            `INSERT INTO Departments (id, name, faculty, students, courses, status) VALUES ('DEP002', 'Information Technology', 22, 510, 6, 'Active')`,
            `INSERT INTO Departments (id, name, faculty, students, courses, status) VALUES ('DEP003', 'Mechanical', 18, 380, 5, 'Active')`,
            `INSERT INTO Departments (id, name, faculty, students, courses, status) VALUES ('DEP004', 'Civil', 16, 310, 4, 'Inactive')`,
            `INSERT INTO Departments (id, name, faculty, students, courses, status) VALUES ('DEP005', 'Electrical', 20, 430, 5, 'Active')`,
            `INSERT INTO Departments (id, name, faculty, students, courses, status) VALUES ('DEP006', 'Electronics', 17, 390, 5, 'Active')`
        ];
        for (const query of seedQueries) {
            await db.execute(query);
        }
        console.log('Table "Departments" seeded with default data.');
    }

    // 4. Guides Table
    try {
        await db.query('SELECT TOP 1 * FROM Guides');
        console.log('Table "Guides" already exists.');
    } catch (err) {
        console.log('Table "Guides" does not exist. Creating...');
        const createQuery = `
            CREATE TABLE Guides (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255),
                department VARCHAR(255),
                designation VARCHAR(100),
                students INT,
                projects INT,
                email VARCHAR(100),
                phone VARCHAR(50),
                status VARCHAR(50)
            )
        `;
        await db.execute(createQuery);
        console.log('Table "Guides" created successfully.');

        // Insert seed guides
        const seedQueries = [
            `INSERT INTO Guides (id, name, department, designation, students, projects, email, phone, status) VALUES ('GUI001', 'Dr. Rajesh Sharma', 'Computer Science', 'Professor', 28, 18, 'rajesh@college.edu', '9876543210', 'Active')`,
            `INSERT INTO Guides (id, name, department, designation, students, projects, email, phone, status) VALUES ('GUI002', 'Dr. Anita Verma', 'Information Technology', 'Associate Professor', 25, 16, 'anita@college.edu', '9876543211', 'Active')`,
            `INSERT INTO Guides (id, name, department, designation, students, projects, email, phone, status) VALUES ('GUI003', 'Dr. Sandeep Singh', 'Mechanical', 'Professor', 22, 14, 'sandeep@college.edu', '9876543212', 'Inactive')`,
            `INSERT INTO Guides (id, name, department, designation, students, projects, email, phone, status) VALUES ('GUI004', 'Dr. Meera Das', 'Civil', 'Assistant Professor', 20, 11, 'meera@college.edu', '9876543213', 'Active')`
        ];
        for (const query of seedQueries) {
            await db.execute(query);
        }
        console.log('Table "Guides" seeded with default data.');
    }

    // 5. Students Table
    try {
        await db.query('SELECT TOP 1 * FROM Students');
        console.log('Table "Students" already exists.');
    } catch (err) {
        console.log('Table "Students" does not exist. Creating...');
        const createQuery = `
            CREATE TABLE Students (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255),
                gender VARCHAR(20),
                dob VARCHAR(50),
                college VARCHAR(255),
                department VARCHAR(255),
                branch VARCHAR(255),
                semester VARCHAR(50),
                guide VARCHAR(255),
                project VARCHAR(255),
                batch VARCHAR(100),
                phone VARCHAR(50),
                email VARCHAR(100),
                address VARCHAR(255)
            )
        `;
        await db.execute(createQuery);
        console.log('Table "Students" created successfully.');

        // Insert seed students
        const seedQueries = [
            `INSERT INTO Students (id, name, gender, dob, college, department, branch, semester, guide, project, batch, phone, email, address) VALUES ('STU1258', 'Aarav Sharma', 'Male', '2003-05-12', 'KIIT University', 'Computer Science', 'Computer Science', 'Semester 6', 'Dr. Rajesh Sharma', 'AI Chatbot', 'Batch-2 2026', '9876543210', 'aarav@example.com', 'Delhi')`,
            `INSERT INTO Students (id, name, gender, dob, college, department, branch, semester, guide, project, batch, phone, email, address) VALUES ('STU1257', 'Priya Verma', 'Female', '2004-02-08', 'SOA University', 'Electronics', 'Electronics', 'Semester 4', 'Dr. Anita Verma', 'IoT System', 'Batch-2 2026', '8765432109', 'priya@example.com', 'Mumbai')`,
            `INSERT INTO Students (id, name, gender, dob, college, department, branch, semester, guide, project, batch, phone, email, address) VALUES ('STU1256', 'Rohan Singh', 'Male', '2002-11-20', 'CET Bhubaneswar', 'Mechanical', 'Mechanical', 'Semester 8', 'Dr. Sandeep Singh', 'Robotics', 'Batch-2 2026', '7654321098', 'rohan@example.com', 'Pune')`,
            `INSERT INTO Students (id, name, gender, dob, college, department, branch, semester, guide, project, batch, phone, email, address) VALUES ('STU1255', 'Sneha Patel', 'Female', '2003-07-18', 'ITER', 'Information Technology', 'Information Tech', 'Semester 6', 'Dr. Anita Verma', 'ML Model', 'Batch-2 2026', '6543210987', 'sneha@example.com', 'Ahmedabad')`,
            `INSERT INTO Students (id, name, gender, dob, college, department, branch, semester, guide, project, batch, phone, email, address) VALUES ('STU1254', 'Vivek Gupta', 'Male', '2003-01-10', 'KIIT University', 'Civil', 'Civil', 'Semester 6', 'Dr. Meera Das', 'Smart Bridge', 'Batch-2 2026', '5432109876', 'vivek@example.com', 'Jaipur')`
        ];
        for (const query of seedQueries) {
            await db.execute(query);
        }
        console.log('Table "Students" seeded with default data.');
    }

    // 6. InternshipTrends Table
    try {
        const check = await db.query('SELECT COUNT(*) AS cnt FROM InternshipTrends');
        if (check[0].cnt < 10) {
            console.log('Table "InternshipTrends" has incomplete data. Dropping and recreating...');
            try { await db.execute('DROP TABLE InternshipTrends'); } catch (e) {}
            throw new Error('recreate');
        }
        console.log('Table "InternshipTrends" already exists and is fully seeded.');
    } catch (err) {
        console.log('Table "InternshipTrends" does not exist or is incomplete. Creating...');
        const createQuery = `
            CREATE TABLE InternshipTrends (
                TrendID VARCHAR(50) PRIMARY KEY,
                [Year] INT,
                University VARCHAR(150),
                College VARCHAR(255),
                Branch VARCHAR(100),
                StudentsApplied INT,
                StudentsSelected INT,
                InternshipSeats INT,
                Duration INT,
                InternshipMonth VARCHAR(50),
                Gender VARCHAR(20),
                [State] VARCHAR(50)
            )
        `;
        await db.execute(createQuery);
        console.log('Table "InternshipTrends" created successfully.');

        const universities = ['KIIT University', 'SOA University', 'CET Bhubaneswar', 'BPUT'];
        const colleges = ['KIIT College', 'SOA Institute', 'CET Engine', 'ITER College', 'Silicon Tech'];
        const branches = ['Computer Science', 'Information Technology', 'Mechanical', 'Electrical', 'Electronics', 'Civil'];
        const states = ['Odisha', 'Delhi', 'Maharashtra', 'Karnataka', 'West Bengal'];
        const months = ['May', 'June', 'July', 'December'];
        
        console.log('Seeding InternshipTrends table with 10-year historical dataset (30 records)...');
        let counter = 1;
        for (let year = 2017; year <= 2026; year++) {
            // Seed exactly 3 records per year to ensure statistical variance while keeping OLEDB write time extremely short
            const numRecords = 3;
            for (let i = 0; i < numRecords; i++) {
                const university = universities[Math.floor(Math.random() * universities.length)];
                const college = colleges[Math.floor(Math.random() * colleges.length)];
                const branch = branches[Math.floor(Math.random() * branches.length)];
                const state = states[Math.floor(Math.random() * states.length)];
                const month = months[Math.floor(Math.random() * months.length)];
                const gender = Math.random() > 0.5 ? 'Male' : 'Female';
                
                const baseMultiplier = 1 + (year - 2017) * 0.12; 
                
                const applied = Math.floor((40 + Math.random() * 50) * baseMultiplier);
                const selected = Math.floor(applied * (0.3 + Math.random() * 0.3));
                const seats = Math.floor(selected * (1.1 + Math.random() * 0.4));
                const duration = 2 + Math.floor(Math.random() * 5); // 2 to 6 months
                
                const insertQuery = `
                    INSERT INTO InternshipTrends (
                        TrendID, [Year], University, College, Branch, 
                        StudentsApplied, StudentsSelected, InternshipSeats, 
                        Duration, InternshipMonth, Gender, [State]
                    ) VALUES (
                        'TRD${String(counter).padStart(4, '0')}',
                        ${year},
                        '${university}',
                        '${college}',
                        '${branch}',
                        ${applied},
                        ${selected},
                        ${seats},
                        ${duration},
                        '${month}',
                        '${gender}',
                        '${state}'
                    )
                `;
                await db.execute(insertQuery);
                counter++;
            }
        }
        console.log(`Seeding completed. Inserted ${counter - 1} records.`);
    }

    // Skipping synchronization since everything is dynamically derived from the Students table
    console.log('Skipping separate tables synchronization (single-table derived model).');

    console.log('Microsoft Access database initialization completed.');
}

function escapeSql(val) {
    if (val === null || val === undefined) {
        return 'NULL';
    }
    if (typeof val === 'number') {
        return val;
    }
    return `'${String(val).replace(/'/g, "''")}'`;
}

async function syncDatabaseTables() {
    try {
        const { schemaMap } = require('./db');
        const mapS = schemaMap.Students;
        
        console.log('Synchronizing Colleges, Departments, and Guides from Students records...');
        
        // 1. Sync Colleges
        const uniqueColleges = await db.query(`SELECT DISTINCT ${mapS.college} AS college FROM Students WHERE ${mapS.college} IS NOT NULL AND ${mapS.college} <> ''`);
        let colMax = 0;
        const currentColleges = await db.query('SELECT id, name FROM Colleges');
        const collegeNamesSet = new Set(currentColleges.map(c => c.name.toLowerCase().trim()));
        
        currentColleges.forEach(c => {
            const num = parseInt(c.id.replace('COL', ''), 10);
            if (!isNaN(num) && num > colMax) colMax = num;
        });
        
        for (const colRow of uniqueColleges) {
            const cName = colRow.college.trim();
            if (!collegeNamesSet.has(cName.toLowerCase())) {
                colMax++;
                const newId = `COL${String(colMax).padStart(3, '0')}`;
                
                // Fetch info from a student record for this college to populate type/district/state
                const studentSample = await db.query(`SELECT TOP 1 * FROM Students WHERE ${mapS.college} = ${escapeSql(cName)}`);
                let colType = 'Private';
                let colDistrict = '';
                let colState = 'Odisha';
                
                if (studentSample && studentSample.length > 0) {
                    const keys = Object.keys(studentSample[0]);
                    if (keys.includes('College Type')) colType = studentSample[0]['College Type'] || 'Private';
                    if (keys.includes('District')) colDistrict = studentSample[0]['District'] || '';
                    if (keys.includes('State')) colState = studentSample[0]['State'] || 'Odisha';
                }
                
                const query = `
                    INSERT INTO Colleges (id, name, type, district, state, university, students, guides, departments) 
                    VALUES (
                        '${newId}', 
                        ${escapeSql(cName)}, 
                        ${escapeSql(colType)}, 
                        ${escapeSql(colDistrict)}, 
                        ${escapeSql(colState)}, 
                        'BPUT', 
                        0, 0, 0
                    )
                `;
                await db.execute(query);
                collegeNamesSet.add(cName.toLowerCase());
                console.log(`Synced missing College: ${cName} -> ${newId}`);
            }
        }

        // 2. Sync Departments (Branches)
        const uniqueBranches = await db.query(`SELECT DISTINCT ${mapS.branch} AS branch FROM Students WHERE ${mapS.branch} IS NOT NULL AND ${mapS.branch} <> ''`);
        let deptMax = 0;
        const currentDepts = await db.query('SELECT id, name FROM Departments');
        const deptNamesSet = new Set(currentDepts.map(d => d.name.toLowerCase().trim()));
        
        currentDepts.forEach(d => {
            const num = parseInt(d.id.replace('DEP', ''), 10);
            if (!isNaN(num) && num > deptMax) deptMax = num;
        });

        for (const branchRow of uniqueBranches) {
            const bName = branchRow.branch.trim();
            if (!deptNamesSet.has(bName.toLowerCase())) {
                deptMax++;
                const newId = `DEP${String(deptMax).padStart(3, '0')}`;
                const query = `
                    INSERT INTO Departments (id, name, faculty, students, courses, status) 
                    VALUES (
                        '${newId}', 
                        ${escapeSql(bName)}, 
                        10, 0, 6, 'Active'
                    )
                `;
                await db.execute(query);
                deptNamesSet.add(bName.toLowerCase());
                console.log(`Synced missing Department: ${bName} -> ${newId}`);
            }
        }

        // 3. Sync Guides
        const uniqueGuides = await db.query(`SELECT DISTINCT ${mapS.guide} AS guide FROM Students WHERE ${mapS.guide} IS NOT NULL AND ${mapS.guide} <> ''`);
        const mapG = schemaMap.Guides;
        const currentGuides = await db.query(`SELECT ${mapG.name} AS name FROM Guides`);
        const guideNamesSet = new Set(currentGuides.map(g => g.name.toLowerCase().trim()));

        for (const guideRow of uniqueGuides) {
            const gName = guideRow.guide.trim();
            if (!guideNamesSet.has(gName.toLowerCase())) {
                let query;
                if (mapG.name.includes('[')) {
                    query = `
                        INSERT INTO Guides (${mapG.name}, ${mapG.department}, ${mapG.status}, ${mapG.projects}) 
                        VALUES (
                            ${escapeSql(gName)}, 
                            'CSE', 
                            'Active', 
                            'AI Chatbot, Student Portal'
                        )
                    `;
                } else {
                    const newId = `GUI${String(guideNamesSet.size + 1).padStart(3, '0')}`;
                    query = `
                        INSERT INTO Guides (id, name, department, designation, students, projects, email, phone, status) 
                        VALUES (
                            '${newId}', 
                            ${escapeSql(gName)}, 
                            'CSE', 
                            'Professor', 
                            0, 0, 
                            '${gName.toLowerCase().replace(/[^a-z]/g, '')}@college.edu', 
                            '9876543210', 
                            'Active'
                        )
                    `;
                }
                await db.execute(query);
                guideNamesSet.add(gName.toLowerCase());
                console.log(`Synced missing Guide: ${gName}`);
            }
        }

        console.log('Synchronization of database tables completed successfully.');
    } catch (err) {
        console.error('Failed to synchronize database tables:', err);
    }
}

module.exports = {
    initializeDatabase
};
