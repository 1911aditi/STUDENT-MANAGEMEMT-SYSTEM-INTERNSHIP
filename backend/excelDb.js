const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const excelPath = process.env.EXCEL_PATH || path.join(__dirname, '..', 'Student_Management_System_5000_Records.xlsx');

function loadExcelStudents() {
    if (!fs.existsSync(excelPath)) {
        // If file doesn't exist, create an empty one with Students sheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet([]);
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        XLSX.writeFile(wb, excelPath);
        return [];
    }
    const wb = XLSX.readFile(excelPath);
    const ws = wb.Sheets['Students'];
    if (!ws) return [];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(ws);
    
    // Standardize field keys to match the database mapping
    return data.map((row, idx) => ({
        id: String(row['Student ID'] || row['id'] || `STU${1000 + idx}`).trim(),
        name: String(row['Name'] || row['name'] || '').trim(),
        gender: String(row['Gender'] || row['gender'] || 'Male').trim(),
        dob: String(row['DOB'] || row['dob'] || '').trim(),
        college: String(row['College'] || row['college'] || '').trim(),
        department: String(row['Branch'] || row['department'] || row['branch'] || '').trim(),
        branch: String(row['Branch'] || row['branch'] || '').trim(),
        semester: String(row['Semester'] || row['semester'] || '').trim(),
        guide: String(row['Guide'] || row['guide'] || '').trim(),
        project: String(row['Project'] || row['project'] || '').trim(),
        batch: String(row['Batch'] || row['batch'] || '').trim(),
        phone: String(row['Phone'] || row['phone'] || '').trim(),
        email: String(row['Email'] || row['email'] || '').trim(),
        address: String(row['District'] || row['address'] || '').trim()
    }));
}

function saveExcelStudents(students) {
    const wb = XLSX.utils.book_new();
    // Map back to standard column names for Excel
    const rows = students.map(s => ({
        'Student ID': s.id,
        'Name': s.name,
        'Gender': s.gender,
        'DOB': s.dob,
        'College': s.college,
        'Branch': s.branch,
        'Semester': s.semester,
        'Guide': s.guide,
        'Project': s.project,
        'Batch': s.batch,
        'Phone': s.phone,
        'Email': s.email,
        'District': s.address
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, excelPath);
}

module.exports = {
    loadExcelStudents,
    saveExcelStudents
};
