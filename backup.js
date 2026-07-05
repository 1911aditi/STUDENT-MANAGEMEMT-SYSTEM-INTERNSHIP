// ============================================
// BACKUP MANAGEMENT
// PART 1
// ============================================

// ----------------------------
// Backup Data
// ----------------------------

let backups = [

{
id:"BKP001",
name:"Full Backup",
type:"Manual",
date:"2026-07-02",
time:"10:30 AM",
size:"24 MB",
status:"Completed",
createdBy:"Admin"
},

{
id:"BKP002",
name:"Auto Backup",
type:"Auto",
date:"2026-07-01",
time:"11:00 PM",
size:"22 MB",
status:"Completed",
createdBy:"System"
},

{
id:"BKP003",
name:"Weekly Backup",
type:"Manual",
date:"2026-06-28",
time:"09:45 AM",
size:"20 MB",
status:"Completed",
createdBy:"Admin"
}

];

let filteredBackups=[...backups];

// ============================================
// DATE
// ============================================

function getToday(){

return new Date().toISOString().split("T")[0];

}

// ============================================
// LOCAL STORAGE
// ============================================

function loadBackups(){

const data=localStorage.getItem("backupData");

if(data){

backups=JSON.parse(data);

filteredBackups=[...backups];

}

}

function saveBackups(){

localStorage.setItem(

"backupData",

JSON.stringify(backups)

);

}

// ============================================
// STATISTICS
// ============================================

function updateStats(){

document.getElementById("totalBackups").innerHTML=

backups.length;

document.getElementById("latestBackup").innerHTML=

backups.length
?
backups[0].date
:
"--";

let total=0;

backups.forEach(b=>{

total+=parseFloat(b.size);

});

document.getElementById("storage").innerHTML=

total.toFixed(1)+" MB";

}

// ============================================
// TABLE
// ============================================

function renderTable(data=filteredBackups){

const tbody=

document.getElementById("backupTable");

tbody.innerHTML="";

data.forEach((b,index)=>{

tbody.innerHTML+=`

<tr>

<td>${b.id}</td>

<td>${b.name}</td>

<td>${b.type}</td>

<td>${b.date}<br>${b.time}</td>

<td>${b.size}</td>

<td>

<span class="status ${b.status.toLowerCase()}">

${b.status}

</span>

</td>

<td>${b.createdBy}</td>

<td>

<div class="action-buttons">

<button

class="action-btn download-btn"

onclick="downloadBackup(${index})">

<i class="fa-solid fa-download"></i>

</button>

<button

class="action-btn restore-btn"

onclick="restoreBackup(${index})">

<i class="fa-solid fa-rotate-left"></i>

</button>

<button

class="action-btn delete-btn"

onclick="deleteBackup(${index})">

<i class="fa-solid fa-trash"></i>

</button>

</div>

</td>

</tr>

`;

});

document.getElementById("backupCount").innerHTML=

`Showing ${data.length} backups`;

}

loadBackups();

updateStats();

renderTable();

// ============================================
// PART 2
// BUTTON FUNCTIONS
// ============================================

// ----------------------------
// Create Backup
// ----------------------------

document.getElementById("createBackup").onclick=function(){

const now=new Date();

const newBackup={

id:"BKP"+String(backups.length+1).padStart(3,"0"),

name:"Manual Backup",

type:"Manual",

date:now.toISOString().split("T")[0],

time:now.toLocaleTimeString("en-IN",{

hour:"2-digit",

minute:"2-digit"

}),

size:(15+Math.random()*15).toFixed(1)+" MB",

status:"Completed",

createdBy:"Admin"

};

backups.unshift(newBackup);

filteredBackups=[...backups];

saveBackups();

updateStats();

renderTable();

alert("Backup created successfully.");

};

// ----------------------------
// Download Backup
// ----------------------------

function downloadBackup(index){
  const backup = filteredBackups[index];
  const dbData = {
    backupMeta: backup,
    studentManagementData: JSON.parse(localStorage.getItem("studentManagementData") || "[]"),
    collegeData: JSON.parse(localStorage.getItem("collegeData") || "[]"),
    guideManagementData: JSON.parse(localStorage.getItem("guideManagementData") || "[]"),
    departmentData: JSON.parse(localStorage.getItem("departmentData") || "[]"),
    administrators: JSON.parse(localStorage.getItem("administrators") || "[]"),
    studentDashboardSettings: JSON.parse(localStorage.getItem("studentDashboardSettings") || "{}"),
    studentManagementExcelData: JSON.parse(localStorage.getItem("studentManagementExcelData") || "[]")
  };

  const blob = new Blob([JSON.stringify(dbData, null, 2)], {type: "application/json"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = backup.id + "_" + backup.date + "_db_backup.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

// ----------------------------
// Restore Backup
// ----------------------------

function restoreBackup(index){
  const backup = filteredBackups[index];
  alert("To restore database to state '" + backup.id + "', please upload the corresponding JSON backup file using the 'Restore Backup File' button above.");
}

// Listen to restore file input
const restoreInput = document.getElementById("restoreFileInput");
if (restoreInput) {
  restoreInput.addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        
        if (!data.studentManagementData || !data.administrators) {
          alert("Invalid backup file structure. Please upload a valid JSON backup file.");
          return;
        }

        if (confirm("Are you sure you want to restore the database? This will overwrite your current settings, students, colleges, guides, and departments data.")) {
          if (data.studentManagementData) localStorage.setItem("studentManagementData", JSON.stringify(data.studentManagementData));
          if (data.collegeData) localStorage.setItem("collegeData", JSON.stringify(data.collegeData));
          if (data.guideManagementData) localStorage.setItem("guideManagementData", JSON.stringify(data.guideManagementData));
          if (data.departmentData) localStorage.setItem("departmentData", JSON.stringify(data.departmentData));
          if (data.administrators) localStorage.setItem("administrators", JSON.stringify(data.administrators));
          if (data.studentDashboardSettings) localStorage.setItem("studentDashboardSettings", JSON.stringify(data.studentDashboardSettings));
          if (data.studentManagementExcelData) localStorage.setItem("studentManagementExcelData", JSON.stringify(data.studentManagementExcelData));
          
          alert("Database restored successfully!");
          window.location.reload();
        }
      } catch (err) {
        console.error(err);
        alert("Failed to read backup file. Error: " + err.message);
      }
    };
    reader.readAsText(file);
  });
}

// ----------------------------
// Delete Backup
// ----------------------------

function deleteBackup(index){

const backup=filteredBackups[index];

if(confirm(

"Delete "+backup.id+" ?"

)){

backups=backups.filter(

b=>b.id!==backup.id

);

filteredBackups=[...backups];

saveBackups();

updateStats();

renderTable();

}

}

// ----------------------------
// Filter
// ----------------------------

document.getElementById("filterBtn").onclick=function(){

const type=

document.getElementById("filterType").value;

const status=

document.getElementById("filterStatus").value;

const date=

document.getElementById("filterDate").value;

filteredBackups=backups.filter(b=>{

const a=

type==="All"||

b.type===type;

const c=

status==="All"||

b.status===status;

const d=

date===""||

b.date===date;

return a&&c&&d;

});

renderTable();

};

// ----------------------------
// Reset Filters
// ----------------------------

document.getElementById("resetBtn").onclick=function(){

document.getElementById("filterType").value="All";

document.getElementById("filterStatus").value="All";

document.getElementById("filterDate").value="";

filteredBackups=[...backups];

renderTable();

};

// ----------------------------
// Export CSV
// ----------------------------

document.getElementById("exportBackup").onclick=function(){

let csv=

"ID,Name,Type,Date,Time,Size,Status,Created By\n";

filteredBackups.forEach(b=>{

csv+=

`${b.id},
${b.name},
${b.type},
${b.date},
${b.time},
${b.size},
${b.status},
${b.createdBy}\n`;

});

const blob=new Blob([csv],{

type:"text/csv"

});

const link=document.createElement("a");

link.href=URL.createObjectURL(blob);

link.download="Backup_List.csv";

link.click();

URL.revokeObjectURL(link.href);

};

// ----------------------------
// Print
// ----------------------------

document.getElementById("printBackup").onclick=function(){

window.print();

};

// ----------------------------
// Sidebar
// ----------------------------

document
.getElementById("toggleSidebar")
.onclick=function(){

document
.querySelector(".sidebar")
.classList.toggle("collapsed");

};