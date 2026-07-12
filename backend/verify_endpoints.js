const http = require('http');

function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('Starting end-to-end API verification tests...');
    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`[PASS] ${message}`);
            passed++;
        } else {
            console.error(`[FAIL] ${message}`);
            failed++;
        }
    }

    try {
        // 1. Test Login Authentication
        const loginRes = await request('POST', '/api/login', { username: 'admin1', password: 'admin123' });
        assert(loginRes.status === 200 && loginRes.body.Username === 'admin1', 'POST /api/login authenticates admin1 successfully');

        // 2. Test Dashboard Stats
        const statsRes = await request('GET', '/api/dashboard/stats');
        assert(statsRes.status === 200 && statsRes.body.totalStudents !== undefined, 'GET /api/dashboard/stats returns stats object');
        console.log(`Current Statistics - Students: ${statsRes.body.totalStudents}, Colleges: ${statsRes.body.totalColleges}, Guides: ${statsRes.body.totalGuides}, Departments: ${statsRes.body.totalDepartments}`);

        // 3. Test Students CRUD
        const newStudent = {
            id: 'ST_TEST_99',
            name: 'API Test Student',
            gender: 'Male',
            dob: '2000-01-01',
            college: 'KIIT University',
            department: 'Computer Science',
            branch: 'CSE',
            semester: '5th',
            guide: 'Dr. Sharma',
            project: 'Cloud Systems',
            batch: '2022-26',
            phone: '9876543210',
            email: 'apitest@example.com',
            address: 'Bhubaneswar, Odisha'
        };

        // Add
        const addStudentRes = await request('POST', '/api/students', newStudent);
        assert(addStudentRes.status === 201, 'POST /api/students adds a new student');

        // Verify added student in the list
        const studentsList = await request('GET', '/api/students');
        const found = studentsList.body.find(s => s.id === 'ST_TEST_99');
        assert(found !== undefined && found.name === 'API Test Student', 'GET /api/students contains the newly added student');

        // Update
        newStudent.name = 'API Test Student Updated';
        const updateStudentRes = await request('PUT', `/api/students/${newStudent.id}`, newStudent);
        assert(updateStudentRes.status === 200, 'PUT /api/students/:id updates student details');

        // Delete
        const deleteStudentRes = await request('DELETE', `/api/students/${newStudent.id}`);
        assert(deleteStudentRes.status === 200, 'DELETE /api/students/:id deletes student successfully');

        // 4. Test Colleges CRUD
        const collegeRes = await request('GET', '/api/colleges');
        assert(collegeRes.status === 200 && Array.isArray(collegeRes.body), 'GET /api/colleges returns colleges array');

        // 5. Test Departments CRUD
        const deptRes = await request('GET', '/api/departments');
        assert(deptRes.status === 200 && Array.isArray(deptRes.body), 'GET /api/departments returns departments array');

        // 6. Test Guides CRUD
        const guideRes = await request('GET', '/api/guides');
        assert(guideRes.status === 200 && Array.isArray(guideRes.body), 'GET /api/guides returns guides array');

        // 7. Test Admins CRUD
        const adminRes = await request('GET', '/api/admins');
        assert(adminRes.status === 200 && Array.isArray(adminRes.body), 'GET /api/admins returns administrators array');

        // 8. Test Trend Analysis Filters
        const trendsFilters = await request('GET', '/api/trends/filters');
        assert(trendsFilters.status === 200 && Array.isArray(trendsFilters.body.years) && trendsFilters.body.years.length > 0, 'GET /api/trends/filters returns lists of year, college, branch, etc.');

        // 9. Test Trend Analysis Stats
        const trendsStats = await request('GET', '/api/trends/stats');
        assert(trendsStats.status === 200 && trendsStats.body.totalApplied !== undefined, 'GET /api/trends/stats returns basic aggregated trends statistics');

        // 10. Test Trend Analysis Yearly Breakdown
        const trendsAnalysis = await request('GET', '/api/trends/analysis');
        assert(trendsAnalysis.status === 200 && Array.isArray(trendsAnalysis.body.list), 'GET /api/trends/analysis returns historical year breakdown lists');

        // 11. Test Trend Correlation Analysis
        const trendsCorr = await request('GET', '/api/trends/correlation');
        assert(trendsCorr.status === 200 && trendsCorr.body.correlations !== undefined, 'GET /api/trends/correlation returns pearson correlation coefficients');

        // 12. Test Trend Regression Model
        const trendsReg = await request('GET', '/api/trends/regression');
        assert(trendsReg.status === 200 && Array.isArray(trendsReg.body.coefficients), 'GET /api/trends/regression returns multiple linear regression coefficients and stats');

        // 13. Test Trend Forecasting Models
        const trendsForecast = await request('GET', '/api/trends/forecast');
        assert(trendsForecast.status === 200 && trendsForecast.body.predictions !== undefined, 'GET /api/trends/forecast returns predictions for next 5 years across 4 models');

        console.log(`=========================================`);
        console.log(`VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
        console.log(`=========================================`);

        if (failed > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    } catch (err) {
        console.error('Verification failed due to error:', err);
        process.exit(1);
    }
}

runTests();
