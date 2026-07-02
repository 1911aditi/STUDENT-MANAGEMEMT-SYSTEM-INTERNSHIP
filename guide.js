// =========================================
// GUIDE MANAGEMENT SYSTEM
// PART 1
// =========================================

// ------------------------------
// Sample Data
// ------------------------------

let guides = [

{
id:"GUI001",
name:"Dr. Rajesh Sharma",
department:"Computer Science",
designation:"Professor",
students:28,
projects:18,
email:"rajesh@college.edu",
phone:"9876543210",
status:"Active"
},

{
id:"GUI002",
name:"Dr. Anita Verma",
department:"Information Technology",
designation:"Associate Professor",
students:25,
projects:16,
email:"anita@college.edu",
phone:"9876543211",
status:"Active"
},

{
id:"GUI003",
name:"Dr. Sandeep Singh",
department:"Mechanical",
designation:"Professor",
students:22,
projects:14,
email:"sandeep@college.edu",
phone:"9876543212",
status:"Inactive"
},

{
id:"GUI004",
name:"Dr. Meera Das",
department:"Civil",
designation:"Assistant Professor",
students:20,
projects:11,
email:"meera@college.edu",
phone:"9876543213",
status:"Active"
},

{
id:"GUI005",
name:"Dr. Vivek Rao",
department:"Electrical",
designation:"Professor",
students:30,
projects:20,
email:"vivek@college.edu",
phone:"9876543214",
status:"Active"
}

];

let filteredGuides = [...guides];

let editIndex = null;

let departmentChart;
let statusChart;

// =========================================
// DATE & TIME
// =========================================

function updateDateTime(){

document.getElementById("currentDateTime").innerHTML =
new Date().toLocaleString("en-IN",{

day:"2-digit",
month:"short",
year:"numeric",
hour:"2-digit",
minute:"2-digit"

});

}

updateDateTime();

setInterval(updateDateTime,1000);

// =========================================
// AUTO GUIDE ID
// =========================================

function generateGuideID(){

let max = 0;

guides.forEach(g=>{

const num = parseInt(g.id.replace("GUI",""));

if(num>max) max=num;

});

return "GUI"+String(max+1).padStart(3,"0");

}

function setGuideID(){

document.getElementById("guideId").value =
generateGuideID();

}

setGuideID();

// =========================================
// STATISTICS
// =========================================

function renderStats(){

document.getElementById("totalGuides").innerHTML =
guides.length;

document.getElementById("activeGuides").innerHTML =
guides.filter(g=>g.status==="Active").length;

let students = 0;
let projects = 0;

guides.forEach(g=>{

students += g.students;
projects += g.projects;

});

document.getElementById("studentsAssigned").innerHTML =
students;

document.getElementById("projectsGuided").innerHTML =
projects;

}

renderStats();

// =========================================
// TABLE
// =========================================

function renderTable(data = filteredGuides){

const tbody =
document.getElementById("guideTableBody");

tbody.innerHTML = "";

data.forEach((guide,index)=>{

tbody.innerHTML += `

<tr>

<td>${guide.id}</td>

<td>${guide.name}</td>

<td>${guide.department}</td>

<td>${guide.designation}</td>

<td>${guide.students}</td>

<td>${guide.projects}</td>

<td>${guide.email}</td>

<td>${guide.phone}</td>

<td>

<span class="badge ${guide.status.toLowerCase()}">

${guide.status}

</span>

</td>

<td>

<div class="action-cell">

<button
class="table-action-btn edit-btn"
onclick="editGuide(${index})">

<i class="fa-solid fa-pen"></i>

</button>

<button
class="table-action-btn delete-btn"
onclick="deleteGuide(${index})">

<i class="fa-solid fa-trash"></i>

</button>

</div>

</td>

</tr>

`;

});

}

renderTable();

// =========================================
// DEPARTMENT CHART
// =========================================

function drawDepartmentChart(){

const dept={};

guides.forEach(g=>{

dept[g.department]=(dept[g.department]||0)+1;

});

const ctx =
document.getElementById("departmentChart")
.getContext("2d");

if(departmentChart)
departmentChart.destroy();

departmentChart =
new Chart(ctx,{

type:"doughnut",

data:{

labels:Object.keys(dept),

datasets:[{

data:Object.values(dept),

backgroundColor:[

"#2563eb",
"#22c55e",
"#f59e0b",
"#7c3aed",
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

drawDepartmentChart();

// =========================================
// STATUS CHART
// =========================================

function drawStatusChart(){

const active =
guides.filter(g=>g.status==="Active").length;

const inactive =
guides.filter(g=>g.status==="Inactive").length;

const ctx =
document.getElementById("statusChart")
.getContext("2d");

if(statusChart)
statusChart.destroy();

statusChart =
new Chart(ctx,{

type:"doughnut",

data:{

labels:["Active","Inactive"],

datasets:[{

data:[active,inactive],

backgroundColor:[

"#22c55e",
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

drawStatusChart();

// =========================================
// SIDEBAR
// =========================================

document.getElementById("toggleSidebar")
.addEventListener("click",()=>{

document.querySelector(".sidebar")
.classList.toggle("collapsed");

});

// =========================================
// PART 2
// CRUD + SEARCH + EXPORT + LOCAL STORAGE
// =========================================

// ------------------------------
// Local Storage
// ------------------------------

function saveGuides(){

    localStorage.setItem(
        "guideManagementData",
        JSON.stringify(guides)
    );

}

function loadGuides(){

    const data =
    localStorage.getItem("guideManagementData");

    if(data){

        guides = JSON.parse(data);

        filteredGuides = [...guides];

    }

}

loadGuides();

// ------------------------------
// Render Everything
// ------------------------------

function renderAll(){

    renderStats();

    renderTable(filteredGuides);

    drawDepartmentChart();

    drawStatusChart();

}

renderAll();

// ------------------------------
// Get Form Data
// ------------------------------

function getGuideForm(){

    return{

        id:guideId.value,
        name:guideName.value,
        department:department.value,
        designation:designation.value,

        students:Math.floor(Math.random()*15)+18,

        projects:Math.floor(Math.random()*10)+8,

        email:email.value,

        phone:phone.value,

        status:status.value

    };

}

// ------------------------------
// Save Guide
// ------------------------------

document.getElementById("guideForm")
.addEventListener("submit",function(e){

e.preventDefault();

const guide = getGuideForm();

if(guide.name==""){

alert("Please enter Guide Name");

return;

}

if(editIndex===null){

guides.unshift(guide);

}else{

guides[editIndex]=guide;

editIndex=null;

}

filteredGuides=[...guides];

saveGuides();

renderAll();

this.reset();

setGuideID();

});

// ------------------------------
// Edit Guide
// ------------------------------

function editGuide(index){

editIndex=index;

const g=guides[index];

guideId.value=g.id;

guideName.value=g.name;

department.value=g.department;

designation.value=g.designation;

email.value=g.email;

phone.value=g.phone;

status.value=g.status;

}

// ------------------------------
// Delete Guide
// ------------------------------

function deleteGuide(index){

if(confirm("Delete this guide?")){

guides.splice(index,1);

filteredGuides=[...guides];

saveGuides();

renderAll();

guideForm.reset();

setGuideID();

}

}

// ------------------------------
// Update Button
// ------------------------------

updateBtn.onclick=function(){

if(editIndex==null){

alert("Select a guide first.");

return;

}

guideForm.requestSubmit();

};

// ------------------------------
// Delete Button
// ------------------------------

deleteBtn.onclick=function(){

if(editIndex==null){

alert("Select a guide first.");

return;

}

deleteGuide(editIndex);

};

// ------------------------------
// Search
// ------------------------------

document.querySelector(".search-grid")
.addEventListener("submit",function(e){

e.preventDefault();

const name=document
.querySelector(".search-grid input")
.value
.toLowerCase();

const dept=document
.querySelectorAll(".search-grid select")[0]
.value;

const statusValue=document
.querySelectorAll(".search-grid select")[2]
.value;

filteredGuides=guides.filter(g=>{

const a=g.name
.toLowerCase()
.includes(name);

const b=dept==="All Departments"
|| g.department===dept;

const c=statusValue==="All Status"
|| g.status===statusValue;

return a&&b&&c;

});

renderTable(filteredGuides);

});

// ------------------------------
// Export CSV
// ------------------------------

document
.getElementById("exportGuide")
.onclick=function(){

let csv=
"ID,Guide Name,Department,Designation,Students,Projects,Email,Phone,Status\n";

filteredGuides.forEach(g=>{

csv+=`${g.id},
${g.name},
${g.department},
${g.designation},
${g.students},
${g.projects},
${g.email},
${g.phone},
${g.status}\n`;

});

const blob=
new Blob([csv],{type:"text/csv"});

const link=
document.createElement("a");

link.href=
URL.createObjectURL(blob);

link.download="GuideData.csv";

link.click();

};

// ------------------------------
// Department Summary
// ------------------------------

function renderDepartmentSummary(){

const container=
document.getElementById("departmentSummary");

if(!container) return;

container.innerHTML="";

const map={};

guides.forEach(g=>{

map[g.department]=(map[g.department]||0)+1;

});

const colors=[
"#2563eb",
"#22c55e",
"#f59e0b",
"#7c3aed",
"#ef4444",
"#06b6d4"
];

let i=0;

for(let key in map){

container.innerHTML+=`

<div class="summary-item">

<div class="summary-left">

<span class="summary-dot"
style="background:${colors[i++]}">

</span>

<span class="summary-name">

${key}

</span>

</div>

<div class="summary-value">

${map[key]}

</div>

</div>

`;

}

}

renderDepartmentSummary();

// ------------------------------
// Refresh Everything Again
// ------------------------------

renderAll();