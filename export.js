// ============================================
// EXPORT DATA DASHBOARD
// PART 1
// ============================================

// ----------------------------
// Sample Preview Data
// ----------------------------

let previewData = [

{
id:"ST001",
name:"Rahul Kumar",
department:"Computer Science",
college:"KIIT University",
guide:"Dr. Sharma",
year:"3rd Year",
status:"Active"
},

{
id:"ST002",
name:"Priya Singh",
department:"Mechanical",
college:"SOA University",
guide:"Dr. Anita",
year:"4th Year",
status:"Active"
},

{
id:"ST003",
name:"Amit Das",
department:"Electrical",
college:"CET Bhubaneswar",
guide:"Dr. Rajesh",
year:"2nd Year",
status:"Active"
},

{
id:"ST004",
name:"Neha Gupta",
department:"Civil",
college:"ITER",
guide:"Dr. Sandeep",
year:"1st Year",
status:"Active"
}

];

// ----------------------------
// Export History
// ----------------------------

let exportHistory=[

{
id:"EXP001",
module:"Students",
format:"Excel",
records:2358,
by:"Admin",
date:"02 Jul 2026",
status:"Completed"
},

{
id:"EXP002",
module:"Departments",
format:"CSV",
records:12,
by:"Admin",
date:"01 Jul 2026",
status:"Completed"
},

{
id:"EXP003",
module:"Guides",
format:"PDF",
records:142,
by:"Admin",
date:"30 Jun 2026",
status:"Completed"
}

];

// ============================================
// DATE & TIME
// ============================================

function updateDateTime(){

document.getElementById("currentDateTime").innerHTML=

new Date().toLocaleString("en-IN",{

day:"2-digit",
month:"short",
year:"numeric",
hour:"2-digit",
minute:"2-digit"

});

}

updateDateTime();

setInterval(updateDateTime, 60000);

// ============================================
// SIDEBAR
// ============================================

document
.getElementById("toggleSidebar")
.addEventListener("click",()=>{

document
.querySelector(".sidebar")
.classList.toggle("collapsed");

});

// ============================================
// PREVIEW TABLE
// ============================================

function renderPreview(){

const tbody=
document.getElementById("previewTable");

tbody.innerHTML="";

const excelData = getExcelData();

let dataToShow =
excelData.length > 0 ? excelData : previewData;

const selectedDepartment =
document.getElementById("department").value;

const selectedCollege =
document.getElementById("college").value;

if(selectedDepartment !== "All Departments"){

    dataToShow = dataToShow.filter(
        s => (s.Branch || s.department) === selectedDepartment
    );

}

if(selectedCollege !== "All Colleges"){

    dataToShow = dataToShow.filter(
        s => (s.College || s.college) === selectedCollege
    );

}
dataToShow.forEach(item=>{

    tbody.innerHTML += `

<tr>

<td>${item.Student_ID || item.id}</td>

<td>${item.Student_Name || item.name}</td>

<td>${item.Branch || item.department}</td>

<td>${item.College || item.college}</td>

<td>${item.Guide || item.guide}</td>

<td>${item.Year || item.year || "-"}</td>

<td>Active</td>

</tr>

`;

});

}

renderPreview();

// ============================================
// PART 2
// EXPORT FUNCTIONS
// LOCAL STORAGE
// ============================================

// ----------------------------
// Load History
// ----------------------------

function loadHistory(){

    const data = localStorage.getItem("exportHistory");

    if(data){

        exportHistory = JSON.parse(data);

    }

}

loadHistory();

// ----------------------------
// Save History
// ----------------------------

function saveHistory(){

    localStorage.setItem(

        "exportHistory",

        JSON.stringify(exportHistory)

    );

}

// ----------------------------
// Export CSV
// ----------------------------

document
.getElementById("exportCSV")
.onclick=function(){

let csv="ID,Name,Department,College,Guide,Year,Status\n";

const data = getExcelData().length > 0 ? getExcelData() : previewData;

data.forEach(d=>{

csv += `${d.Student_ID || d.id},
${d.Student_Name || d.name},
${d.Branch || d.department},
${d.College || d.college},
${d.Guide || d.guide},
${d.Year || d.year || "-"},
Active\n`;

});

const blob=new Blob([csv],{

type:"text/csv"

});

const link=document.createElement("a");

link.href=URL.createObjectURL(blob);

link.download="StudentData.csv";

link.click();

addHistory("CSV");

};

// ----------------------------
// Export Excel
// ----------------------------

document
.getElementById("exportExcel")
.onclick=function(){

let csv="ID,Name,Department,College,Guide,Year,Status\n";

const data = getExcelData().length > 0 ? getExcelData() : previewData;

data.forEach(d=>{

csv+=`${d.Student_ID || d.id},
${d.Student_Name || d.name},
${d.Branch || d.department},
${d.College || d.college},
${d.Guide || d.guide},
${d.Year || d.year || "-"},
Active\n`;

});

const blob=new Blob([csv],{

type:"application/vnd.ms-excel"

});

const link=document.createElement("a");

link.href=URL.createObjectURL(blob);

link.download="StudentData.xls";

link.click();

addHistory("Excel");

};

// ----------------------------
// Export PDF
// ----------------------------

document
.getElementById("exportPDF")
.onclick=function(){

window.print();

addHistory("PDF");

};

// ----------------------------
// Add Export History
// ----------------------------

function addHistory(format){

const today=new Date();

const date=today.toLocaleDateString("en-IN");

exportHistory.unshift({

id:"EXP"+String(exportHistory.length+1).padStart(3,"0"),

module:document.getElementById("dataType").value,

format:format,

records:previewData.length,

by:"Admin",

date:date,

status:"Completed"

});

saveHistory();

renderHistory();

updateSummary();

}

// ----------------------------
// Render History
// ----------------------------

function renderHistory(){

const tbody=document.getElementById("historyTable");

tbody.innerHTML="";

exportHistory.forEach(h=>{

tbody.innerHTML+=`

<tr>

<td>${h.id}</td>

<td>${h.module}</td>

<td>${h.format}</td>

<td>${h.records}</td>

<td>${h.by}</td>

<td>${h.date}</td>

<td>

<span class="status success">

${h.status}

</span>

</td>

</tr>

`;

});

}

renderHistory();

// ----------------------------
// Update Summary
// ----------------------------

function updateSummary(){

document.getElementById("todayExports").innerHTML=

exportHistory.length;

document.getElementById("monthExports").innerHTML=

150+exportHistory.length;

}

updateSummary();

function loadDepartmentDropdown(){

    const select = document.getElementById("department");

    const departments = [...new Set(
        getExcelData().map(s => s.Branch)
    )];

    select.innerHTML = "<option>All Departments</option>";

    departments.forEach(dept => {

        select.innerHTML += `<option>${dept}</option>`;

    });

}

loadDepartmentDropdown();

function loadCollegeDropdown(){

    const select = document.getElementById("college");

    const colleges = [...new Set(
        getExcelData().map(s => s.College)
    )];

    select.innerHTML = "<option>All Colleges</option>";

    colleges.forEach(college => {

        select.innerHTML += `<option>${college}</option>`;

    });

}

loadCollegeDropdown();

document.getElementById("department")
.addEventListener("change", renderPreview);

document.getElementById("college")
.addEventListener("change", renderPreview);