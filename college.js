// ===============================
// COLLEGE MANAGEMENT SYSTEM
// PART 3A
// ===============================

// ----------------------------
// Sample College Data
// ----------------------------

let colleges = [

{
id:"COL001",
name:"KIIT University",
type:"Private",
district:"Khordha",
state:"Odisha",
university:"KIIT",
students:832,
guides:45,
departments:10
},

{
id:"COL002",
name:"SOA University",
type:"Private",
district:"Bhubaneswar",
state:"Odisha",
university:"SOA",
students:645,
guides:38,
departments:12
},

{
id:"COL003",
name:"CET Bhubaneswar",
type:"Government",
district:"Bhubaneswar",
state:"Odisha",
university:"BPUT",
students:512,
guides:25,
departments:8
},

{
id:"COL004",
name:"ITER",
type:"Private",
district:"Bhubaneswar",
state:"Odisha",
university:"SOA",
students:210,
guides:15,
departments:6
},

{
id:"COL005",
name:"Silicon Institute",
type:"Private",
district:"Rayagada",
state:"Odisha",
university:"BPUT",
students:159,
guides:11,
departments:5
}

];

let filteredColleges=[...colleges];

let editIndex=null;

let pieChart;
let barChart;

// ===============================
// LIVE DATE & TIME
// ===============================

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

setInterval(updateDateTime, 60000);

updateDateTime();

// ===============================
// AUTO COLLEGE ID
// ===============================

function generateCollegeID(){

let max=0;

colleges.forEach(c=>{

let n=parseInt(c.id.replace("COL",""));

if(n>max) max=n;

});

return "COL"+String(max+1).padStart(3,"0");

}

// ===============================
// LOAD DEFAULT ID
// ===============================

function setCollegeID(){

document.getElementById("collegeId").value=generateCollegeID();

}

setCollegeID();

// ===============================
// TABLE
// ===============================

function renderTable(data=filteredColleges){

const body=document.getElementById("collegeTableBody");

body.innerHTML="";

data.forEach((c,index)=>{

body.innerHTML+=`

<tr>

<td>${c.id}</td>

<td>${c.name}</td>

<td>${c.type}</td>

<td>${c.district}</td>

<td>${c.state}</td>

<td>${c.students}</td>

<td>${c.guides}</td>

<td>${c.departments}</td>

<td>

<div class="action-cell">

<button
class="table-action-btn edit-btn"
onclick="editCollege(${index})">

<i class="fa-solid fa-pen"></i>

</button>

<button
class="table-action-btn delete-btn"
onclick="deleteCollege(${index})">

<i class="fa-solid fa-trash"></i>

</button>

</div>

</td>

</tr>

`;

});

}

renderTable();

// ===============================
// STATISTICS
// ===============================

function updateStats(){

document.getElementById("totalColleges").innerHTML=colleges.length;

document.getElementById("odishaCollege").innerHTML=
colleges.filter(c=>c.state==="Odisha").length;

document.getElementById("outsideCollege").innerHTML=
colleges.filter(c=>c.state!=="Odisha").length;

let students=0;
let guides=0;

colleges.forEach(c=>{

students+=Number(c.students);

guides+=Number(c.guides);

});

document.getElementById("studentCount").innerHTML=students;

document.getElementById("guideCount").innerHTML =
new Set(getExcelData().map(s => s.Guide)).size;

}

updateStats();

// ===============================
// PIE CHART
// ===============================

function drawPieChart(){

let govt=0;
let privateCollege=0;
let auto=0;

colleges.forEach(c=>{

if(c.type==="Government") govt++;

if(c.type==="Private") privateCollege++;

if(c.type==="Autonomous") auto++;

});

const ctx=document
.getElementById("collegeTypeChart")
.getContext("2d");

if(pieChart) pieChart.destroy();

pieChart=new Chart(ctx,{

type:"doughnut",

data:{

labels:["Government","Private","Autonomous"],

datasets:[{

data:[govt,privateCollege,auto],

backgroundColor:[

"#2c67f2",

"#22c55e",

"#f59e0b"

],

borderWidth:1

}]

},

options:{

responsive:true,

plugins:{

legend:{

position:"right"

}

}

}

});

}

drawPieChart();

// ===============================
// BAR GRAPH
// ===============================

function drawBarChart() {

    const ctx = document
        .getElementById("topCollegeChart")
        .getContext("2d");

    if (barChart) {
        barChart.destroy();
    }

    barChart = new Chart(ctx, {

        type: "bar",

        data: {

            labels: colleges.map(c => c.name),

            datasets:[{

    label:"Students",

    data:colleges.map(c=>c.students),

    backgroundColor:[
        "#2563eb",
        "#3b82f6",
        "#60a5fa",
        "#93c5fd",
        "#bfdbfe"
    ],

    borderRadius:12,
    borderSkipped:false,

    barThickness:26,
    maxBarThickness:30

}]

        },

        options:{

    indexAxis:"y",

    responsive:true,

    maintainAspectRatio:false,

    layout:{
        padding:{
            left:10,
            right:15,
            top:10,
            bottom:10
        }
    },

    plugins:{

                legend: {
                    display: false
                }

            },

            scales: {

                x:{

    beginAtZero:true,

    suggestedMax:900,

    ticks:{

        stepSize:200,
        color:"#64748b"

    },

    grid:{

        color:"#edf2f7"

    }

},
                y: {

                    grid: {
                        display: false
                    }

                }

            }

        }

    });

}
drawBarChart();

// ===============================
// SIDEBAR
// ===============================

document.getElementById("toggleSidebar")
.addEventListener("click",()=>{

document
.querySelector(".sidebar")
.classList.toggle("collapsed");

});

// ======================================
// LOCAL STORAGE
// ======================================

function saveData() {
    localStorage.setItem("collegeData", JSON.stringify(colleges));
}

function loadData() {

    const excelData = getExcelData();

    if (!excelData || excelData.length === 0) {
        filteredColleges = [...colleges];
        renderEverything();
        return;
    }

    const collegeMap = {};

    excelData.forEach(student => {

        const collegeName = student.College;

        if (!collegeMap[collegeName]) {

            collegeMap[collegeName] = {

                id: "COL" + String(Object.keys(collegeMap).length + 1).padStart(3, "0"),

                name: collegeName,

                type: "",

                district: "",

                state: student.State || "",

                university: "",

                students: 0,

                guides: new Set(),

                departments: new Set()

            };

        }

        collegeMap[collegeName].students++;

        if (student.Guide)
            collegeMap[collegeName].guides.add(student.Guide);

        if (student.Branch)
            collegeMap[collegeName].departments.add(student.Branch);

    });

    colleges = Object.values(collegeMap).map(college => ({

        ...college,

        guides: college.guides.size,

        departments: college.departments.size

    }));

    filteredColleges = [...colleges];

    renderEverything();

}
loadData();
// ======================================
// FORM DATA
// ======================================

function getCollegeData() {

    return {

        id: document.getElementById("collegeId").value,
        name: document.getElementById("collegeName").value,
        type: document.getElementById("collegeType").value,
        university: document.getElementById("university").value,
        address: document.getElementById("address").value,
        district: document.getElementById("district").value,
        state: "Odisha",
        pincode: document.getElementById("pincode").value,
        principal: document.getElementById("principal").value,
        contact: document.getElementById("contact").value,
        email: document.getElementById("email").value,
        website: document.getElementById("website").value,
        year: document.getElementById("year").value,
        code: document.getElementById("code").value,
        naac: document.getElementById("naac").value,
        departments: Number(document.getElementById("department").value || 0),

        students: Math.floor(Math.random() * 500) + 100,
        guides: Math.floor(Math.random() * 40) + 5

    };

}

// ======================================
// SAVE
// ======================================

document.getElementById("collegeForm").addEventListener("submit", function(e){

    e.preventDefault();

    const college = getCollegeData();

    if(college.name==""){
        alert("Enter College Name");
        return;
    }

    if(editIndex===null){

        colleges.unshift(college);

    }else{

        colleges[editIndex]=college;
        editIndex=null;

    }

    saveData();

    renderEverything();

    this.reset();

    setCollegeID();

});

// ======================================
// EDIT
// ======================================

function editCollege(index){

    editIndex=index;

    const c=colleges[index];

    collegeId.value=c.id;
    collegeName.value=c.name;
    collegeType.value=c.type;
    university.value=c.university;
    address.value=c.address;
    district.value=c.district;
    pincode.value=c.pincode;
    principal.value=c.principal;
    contact.value=c.contact;
    email.value=c.email;
    website.value=c.website;
    year.value=c.year;
    code.value=c.code;
    naac.value=c.naac;
    department.value=c.departments;

}

// ======================================
// DELETE
// ======================================

function deleteCollege(index){

    if(confirm("Delete this college?")){

        colleges.splice(index,1);

        saveData();

        renderEverything();

        document.getElementById("collegeForm").reset();

        setCollegeID();

    }

}

// ======================================
// UPDATE BUTTON
// ======================================

document.getElementById("updateBtn").onclick=function(){

    if(editIndex==null){

        alert("Select a college first.");

        return;

    }

    document.getElementById("collegeForm").requestSubmit();

}

// ======================================
// DELETE BUTTON
// ======================================

document.getElementById("deleteBtn").onclick=function(){

    if(editIndex==null){

        alert("Select a college first.");

        return;

    }

    deleteCollege(editIndex);

}

// ======================================
// SEARCH
// ======================================

document.querySelector(".search-grid").addEventListener("submit",function(e){

    e.preventDefault();

    let name=document.getElementById("searchCollege").value.toLowerCase();

    let type=document.getElementById("searchType").value;

    filteredColleges=colleges.filter(c=>{

        let a=c.name.toLowerCase().includes(name);

        let b=(type=="All Types") || (c.type==type);

        return a && b;

    });

    renderTable(filteredColleges);

});

// ======================================
// EXPORT CSV
// ======================================

document.getElementById("exportCollege").onclick=function(){

let csv="ID,College,Type,District,State,Students,Guides,Departments\n";

filteredColleges.forEach(c=>{

csv+=`${c.id},${c.name},${c.type},${c.district},${c.state},${c.students},${c.guides},${c.departments}\n`;

});

const blob=new Blob([csv],{type:"text/csv"});

const link=document.createElement("a");

link.href=URL.createObjectURL(blob);

link.download="CollegeData.csv";

link.click();

};

// ======================================
// REFRESH EVERYTHING
// ======================================

function renderEverything(){

    renderTable(filteredColleges);

    updateStats();

    drawPieChart();

    drawBarChart();

}

// ======================================

renderEverything();