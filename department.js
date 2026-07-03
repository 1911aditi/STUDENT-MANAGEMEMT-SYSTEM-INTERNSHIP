// ============================================
// DEPARTMENT MANAGEMENT SYSTEM
// PART 1
// ============================================
Chart.register(ChartDataLabels);
// ----------------------------
// Sample Data
// ----------------------------

let departments = [

{
id:"DEP001",
name:"Computer Science",
faculty:28,
students:620,
courses:8,
status:"Active"
},

{
id:"DEP002",
name:"Information Technology",
faculty:22,
students:510,
courses:6,
status:"Active"
},

{
id:"DEP003",
name:"Mechanical",
faculty:18,
students:380,
courses:5,
status:"Active"
},

{
id:"DEP004",
name:"Civil",
faculty:16,
students:310,
courses:4,
status:"Inactive"
},

{
id:"DEP005",
name:"Electrical",
faculty:20,
students:430,
courses:5,
status:"Active"
},

{
id:"DEP006",
name:"Electronics",
faculty:17,
students:290,
courses:4,
status:"Active"
}

];

let filteredDepartments=[...departments];

let studentChart;
let courseChart;

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
// STATISTICS
// ============================================

function updateStatistics(){

document.getElementById("totalDepartments").innerHTML=

departments.length;

let students = 0;

departments.forEach(d => {
    students += d.students;
});

const excelData = getExcelData();

const maleStudents = excelData.filter(s =>
    (s.Gender || "").trim().toLowerCase() === "male"
).length;

const femaleStudents = excelData.filter(s =>
    (s.Gender || "").trim().toLowerCase() === "female"
).length;

document.getElementById("totalStudents").innerHTML =
students;

document.getElementById("maleStudents").innerHTML =
maleStudents;

document.getElementById("femaleStudents").innerHTML =
femaleStudents;

}

updateStatistics();

// ============================================
// TABLE
// ============================================

function renderTable(data=filteredDepartments){

const tbody=
document.getElementById("departmentTableBody");

tbody.innerHTML="";

data.forEach((d,index)=>{

tbody.innerHTML+=`

<tr>

<td>${d.id}</td>

<td>${d.name}</td>

<td>${d.faculty}</td>

<td>${d.students}</td>

<td>${d.courses}</td>

<td>

<span class="badge ${d.status.toLowerCase()}">

${d.status}

</span>

</td>

<td>

<div class="action-cell">

<button
class="table-action-btn edit-btn"
onclick="editDepartment(${index})">

<i class="fa-solid fa-pen"></i>

</button>

<button
class="table-action-btn delete-btn"
onclick="deleteDepartment(${index})">

<i class="fa-solid fa-trash"></i>

</button>

</div>

</td>

</tr>

`;

});

document.getElementById("tableCount").innerHTML=data.length;

}

renderTable();

// ============================================
// STUDENTS BAR CHART
// ============================================

// ============================================
// STUDENTS BAR CHART
// ============================================

function drawStudentChart() {

    const ctx = document
        .getElementById("studentChart")
        .getContext("2d");

    if (studentChart) {
        studentChart.destroy();
    }
    // Sort departments by students (highest to lowest)
const sortedDepartments = [...departments].sort((a, b) => b.students - a.students);

    studentChart = new Chart(ctx, {

        type: "bar",

        data: {

            labels: sortedDepartments.map(d => d.name),

            datasets: [{

                label: "Students",

                data: sortedDepartments.map(d => d.students),

                backgroundColor: [
                    "#2563eb",
                    "#3b82f6",
                    "#60a5fa",
                    "#93c5fd",
                    "#bfdbfe",
                    "#dbeafe"
                ],

                borderRadius: 12,
                borderSkipped: false

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            layout: {
    padding: {
        top: 30
    }
},

            plugins: {

                // Hide "Students" legend
                legend: {
                    display: false
                },

                // Numbers above bars
                datalabels: {

    color: "#000",

    anchor: "end",

    align: "top",

    offset: 10,

    clip: false,

    clamp: true,

    font: {
        size: 14,
        weight: "bold"
    },

    formatter: function(value) {
        return value;
    }

}

            },

            scales: {

                x: {

                    grid: {
                        display: false
                    },

                    ticks: {
                        color: "#374151",
                        font: {
                            size: 13,
                            weight: "bold"
                        }
                    }

                },

                y: {

                    beginAtZero: true,

                    ticks: {
                        color: "#374151"
                    },

                    grid: {
                        color: "#e5e7eb"
                    }

                }

            }

        },

        plugins: [ChartDataLabels]

    });

}

drawStudentChart();



// ============================================
// COURSE CHART
// ============================================

function drawCourseChart(){

    const excelData = getExcelData();

    const male = excelData.filter(s =>
        (s.Gender || "").trim().toLowerCase() === "male"
    ).length;

    const female = excelData.filter(s =>
        (s.Gender || "").trim().toLowerCase() === "female"
    ).length;

    const ctx = document
        .getElementById("courseChart")
        .getContext("2d");

    if(courseChart)
        courseChart.destroy();

    courseChart = new Chart(ctx,{

        type:"doughnut",

        data:{

            labels:["Male","Female"],

            datasets:[{

                data:[male,female],

                backgroundColor:[
                    "#2563eb",
                    "#ec4899"
                ],

                borderColor:"#ffffff",

                borderWidth:3

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            cutout:"60%",

            plugins:{

                legend:{
                    position:"bottom"
                },

                datalabels:{
                    display:false
                }

            }

        },

        plugins:[ChartDataLabels]

    });

}

drawCourseChart();

// ============================================
// PART 2
// SEARCH + LOCAL STORAGE + EXPORT
// ============================================

// ----------------------------
// Load Local Storage
// ----------------------------

function loadData(){

    const excelData = getExcelData();

    if (!excelData || excelData.length === 0) {

        filteredDepartments = [...departments];
        renderEverything();
        return;

    }

    const departmentMap = {};

    excelData.forEach(student => {

        const dept = student.Branch;

        if (!departmentMap[dept]) {

            departmentMap[dept] = {

                id: "DEP" + String(Object.keys(departmentMap).length + 1).padStart(3, "0"),

                name: dept,

                faculty: 0,

                students: 0,

                courses: 0,

                status: "Active"

            };

        }

        departmentMap[dept].students++;

    });

    departments = Object.values(departmentMap);

    filteredDepartments = [...departments];

    renderEverything();

}

loadData();

// ----------------------------
// Save Local Storage
// ----------------------------

function saveData(){

    localStorage.setItem(

        "departmentData",

        JSON.stringify(departments)

    );

}

// ----------------------------
// Search
// ----------------------------

document.querySelector(".search-grid")
.addEventListener("submit",function(e){

    e.preventDefault();

    const name = document
    .getElementById("searchDepartment")
    .value
    .toLowerCase();

    const status = document
    .getElementById("searchStatus")
    .value;

    filteredDepartments = departments.filter(d=>{

        const a = d.name
        .toLowerCase()
        .includes(name);

        const b = status==="All Status"
        || d.status===status;

        return a && b;

    });

    renderTable(filteredDepartments);

});

// ----------------------------
// Export CSV
// ----------------------------

document.getElementById("exportDepartment")
.onclick=function(){

let csv="ID,Department,Faculty,Students,Courses,Status\n";

filteredDepartments.forEach(d=>{

csv+=`${d.id},
${d.name},
${d.faculty},
${d.students},
${d.courses},
${d.status}\n`;

});

const blob=new Blob([csv],{

type:"text/csv"

});

const link=document.createElement("a");

link.href=URL.createObjectURL(blob);

link.download="DepartmentData.csv";

link.click();

};

// ----------------------------
// Dummy Edit
// ----------------------------

function editDepartment(index){

const d=departments[index];

alert(

"Department : "+d.name+

"\nFaculty : "+d.faculty+

"\nStudents : "+d.students+

"\nCourses : "+d.courses

);

}

// ----------------------------
// Delete
// ----------------------------

function deleteDepartment(index){

if(confirm("Delete this department?")){

departments.splice(index,1);

filteredDepartments=[...departments];

saveData();

renderEverything();

}

}

// ----------------------------
// Refresh Everything
// ----------------------------

function renderEverything(){

updateStatistics();

renderTable(filteredDepartments);

drawStudentChart();

drawCourseChart();

}

renderEverything();