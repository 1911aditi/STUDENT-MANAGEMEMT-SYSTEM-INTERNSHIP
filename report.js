// ============================================
// REPORT MANAGEMENT SYSTEM
// PART 1
// ============================================

// ----------------------------
// Sample Report Data
// ----------------------------

let reports = [

{
id:"REP001",
name:"Student Summary",
type:"Student",
department:"Computer Science",
generatedBy:"Admin",
date:"02 Jul 2026",
format:"PDF",
status:"Completed"
},

{
id:"REP002",
name:"Department Report",
type:"Department",
department:"Mechanical",
generatedBy:"Admin",
date:"01 Jul 2026",
format:"Excel",
status:"Completed"
},

{
id:"REP003",
name:"College Report",
type:"College",
department:"-",
generatedBy:"Admin",
date:"30 Jun 2026",
format:"CSV",
status:"Processing"
},

{
id:"REP004",
name:"Guide Report",
type:"Guide",
department:"Electrical",
generatedBy:"Admin",
date:"29 Jun 2026",
format:"PDF",
status:"Completed"
},

{
id:"REP005",
name:"Course Report",
type:"Course",
department:"Civil",
generatedBy:"Admin",
date:"28 Jun 2026",
format:"Excel",
status:"Completed"
}

];

let filteredReports=[...reports];
let generatedReports = [];

let reportTrendChart;
let reportTypeChart;
let reportFormatChart;

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
// TABLE
// ============================================

function renderTable(data=filteredReports){

const tbody=
document.getElementById("reportTableBody");

tbody.innerHTML="";

data.forEach((r,index)=>{

tbody.innerHTML+=`

<tr>

<td>${r.id}</td>

<td>${r.name}</td>

<td>${r.type}</td>

<td>${r.department}</td>

<td>${r.generatedBy}</td>

<td>${r.date}</td>

<td>${r.format}</td>

<td>

<span class="status ${r.status.toLowerCase()}">

${r.status}

</span>

</td>

<td>

<div class="action-cell">

<button
class="table-action-btn download-btn">

<i class="fa-solid fa-download"></i>

</button>

</div>

</td>

</tr>

`;

});

}

renderTable();

// ============================================
// LINE CHART
// ============================================

function drawTrendChart(){

const ctx=
document
.getElementById("reportTrendChart")
.getContext("2d");

if(reportTrendChart)
reportTrendChart.destroy();

reportTrendChart=
new Chart(ctx,{

type:"line",

data:{

labels:[
"26 Jun",
"27 Jun",
"28 Jun",
"29 Jun",
"30 Jun",
"01 Jul",
"02 Jul"
],

datasets:[{

label:"Reports",

data:[8,12,15,18,16,20,24],

borderColor:"#2563eb",

backgroundColor:"rgba(37,99,235,.15)",

fill:true,

tension:.4

}]

},

options:{

responsive:true,

plugins:{

legend:{
display:false
}

}

}

});

}

drawTrendChart();

// ============================================
// REPORT TYPE CHART
// ============================================

function drawTypeChart(){

const ctx=
document
.getElementById("reportTypeChart")
.getContext("2d");

if(reportTypeChart)
reportTypeChart.destroy();

reportTypeChart=
new Chart(ctx,{

type:"doughnut",

data:{

labels:[
"Student",
"College",
"Department",
"Guide",
"Course"
],

datasets:[{

data:[45,20,15,12,8],

backgroundColor:[

"#2563eb",
"#22c55e",
"#7c3aed",
"#f59e0b",
"#ef4444"

]

}]

},

options:{

responsive:true,

plugins:{

legend:{
position:"bottom"
}

}

}

});

}

drawTypeChart();

// ============================================
// REPORT FORMAT CHART
// ============================================

function drawFormatChart(){

const ctx=
document
.getElementById("reportFormatChart")
.getContext("2d");

if(reportFormatChart)
reportFormatChart.destroy();

reportFormatChart=
new Chart(ctx,{

type:"doughnut",

data:{

labels:[
"PDF",
"Excel",
"CSV"
],

datasets:[{

data:[60,25,15],

backgroundColor:[

"#2563eb",
"#22c55e",
"#f59e0b"

]

}]

},

options:{

responsive:true,

plugins:{

legend:{
position:"bottom"
}

}

}

});

}

drawFormatChart();

// ============================================
// PART 2
// SEARCH
// EXPORT
// LOCAL STORAGE
// ============================================

// ----------------------------
// Load Local Storage
// ----------------------------

let students = [];
let colleges = [];
let guides = [];

async function populateFilters() {
    const deptSelect = document.getElementById("departmentFilter");
    if (deptSelect) {
        deptSelect.innerHTML = '<option value="All">All Departments</option>';
        const depts = [...new Set(students.map(s => s.branch || s.department))].filter(Boolean);
        depts.forEach(d => {
            deptSelect.innerHTML += `<option value="${d}">${d}</option>`;
        });
    }
    
    const colSelect = document.getElementById("collegeFilter");
    if (colSelect) {
        colSelect.innerHTML = '<option value="All">All Colleges</option>';
        colleges.forEach(c => {
            colSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
        });
    }
}

async function loadReports(){
    await populateFilters();

    if (!students || students.length === 0) {
        filteredReports = [...reports];
        renderEverything();
        return;
    }

    reports = [
        {
            id: "REP001",
            name: "Student Report",
            type: "Student",
            department: "All",
            generatedBy: "Admin",
            date: new Date().toLocaleDateString("en-IN"),
            format: "CSV",
            status: "Completed"
        },
        {
            id: "REP002",
            name: "College Report",
            type: "College",
            department: "-",
            generatedBy: "Admin",
            date: new Date().toLocaleDateString("en-IN"),
            format: "CSV",
            status: "Completed"
        },
        {
            id: "REP003",
            name: "Department Report",
            type: "Department",
            department: "All",
            generatedBy: "Admin",
            date: new Date().toLocaleDateString("en-IN"),
            format: "CSV",
            status: "Completed"
        },
        {
            id: "REP004",
            name: "Guide Report",
            type: "Guide",
            department: "All",
            generatedBy: "Admin",
            date: new Date().toLocaleDateString("en-IN"),
            format: "CSV",
            status: "Completed"
        }
    ];

    filteredReports = [...reports];
    renderEverything();
}

async function loadPageData() {
    try {
        students = await window.fetchData('/api/students', 'studentManagementData');
        colleges = await window.fetchData('/api/colleges', 'collegeData');
        guides = await window.fetchData('/api/guides', 'guideManagementData');
        await loadReports();
    } catch (e) {
        console.error("Error loading report page data:", e);
    }
}

loadPageData();

// ----------------------------
// Save Local Storage
// ----------------------------

function saveReports(){

    localStorage.setItem(

        "reportsData",

        JSON.stringify(reports)

    );

}

// ----------------------------
// Generate Report
// ----------------------------

document.querySelector(".search-grid")
.addEventListener("submit",function(e){

    e.preventDefault();

    const reportType =
document.getElementById("reportType").value;

const report = {

    id: "REP" + String(generatedReports.length + 1).padStart(3, "0"),

    name: reportType,

    type: reportType.replace(" Report",""),

    department:
    document.getElementById("departmentFilter").value,

    generatedBy: "Admin",

    date: new Date().toLocaleDateString("en-IN"),

    format: "CSV",

    status: "Completed"

};

generatedReports.unshift(report);

filteredReports = [...generatedReports];

renderEverything();


    });

    renderEverything();

// ----------------------------
// Export CSV
// ----------------------------

document
.getElementById("exportReports")
.onclick=function(){

let csv=
"ID,Report Name,Type,Department,Generated By,Date,Format,Status\n";

filteredReports.forEach(r=>{

csv+=`${r.id},
${r.name},
${r.type},
${r.department},
${r.generatedBy},
${r.date},
${r.format},
${r.status}\n`;

});

const blob=new Blob([csv],{

type:"text/csv"

});

const link=document.createElement("a");

link.href=URL.createObjectURL(blob);

link.download="Reports.csv";

link.click();

};

// ----------------------------
// Statistics
// ----------------------------

function updateStatistics(){
    // Total Students
    document.getElementById("studentCount").innerHTML = students.length;

    // Total Colleges
    document.getElementById("collegeCount").innerHTML = colleges.length;

    // Total Guides
    document.getElementById("guideCount").innerHTML = guides.length;

    // Reports Generated
    document.getElementById("reportCount").innerHTML = generatedReports.length;
}
// ----------------------------
// Refresh Everything
// ----------------------------

function renderEverything(){

updateStatistics();

renderTable(filteredReports);

drawTrendChart();

drawTypeChart();

drawFormatChart();

saveReports();

}

renderEverything();