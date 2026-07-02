let excelData = [];
let dashboardData = {
  totalStudents: 2358,
  totalColleges: 28,
  totalGuides: 142,
  totalDepartments: 12,

  colleges: {
    "ABC College": 659,
    "XYZ Institute": 518,
    "PQR University": 424,
    "LMN College": 377,
    "STU Institute": 212,
    "Others": 168
  },

  guides: {
    "Dr. Sharma": 280,
    "Dr. Verma": 235,
    "Dr. Singh": 210,
    "Dr. Patel": 180,
    "Dr. Gupta": 165,
    "Dr. Rao": 140,
    "Dr. Mehta": 120,
    "Dr. Iyer": 95,
    "Dr. Nair": 75,
    "Dr. Khan": 58
  },

  departments: {
    "Computer Science": 665,
    "Electronics": 487,
    "Mechanical": 356,
    "Civil": 298,
    "Electrical": 242,
    "Information Tech": 163,
    "Others": 147
  },

  genders: {
    "Male": 0,
    "Female": 0
  },

  records: [
    {
      id: "STU1258",
      studentName: "Aarav Sharma",
      college: "ABC College",
      department: "Computer Science",
      guide: "Dr. Sharma",
      year: "3rd Year",
      addedOn: "24 May 2025"
    },
    {
      id: "STU1257",
      studentName: "Priya Verma",
      college: "XYZ Institute",
      department: "Electronics",
      guide: "Dr. Verma",
      year: "2nd Year",
      addedOn: "24 May 2025"
    },
    {
      id: "STU1256",
      studentName: "Rohan Singh",
      college: "PQR University",
      department: "Mechanical",
      guide: "Dr. Singh",
      year: "4th Year",
      addedOn: "24 May 2025"
    }
  ]
};

let collegeChart;
let guideChart;
let departmentChart;
let yearChart;

function formatDateTime() {
  const now = new Date();
  return now.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function updateDateTime() {
  document.getElementById("currentDateTime").textContent = formatDateTime();
}

function updateStats() {
  document.getElementById("totalStudents").textContent = dashboardData.totalStudents;
  document.getElementById("totalColleges").textContent = dashboardData.totalColleges;
  document.getElementById("totalGuides").textContent = dashboardData.totalGuides;
  document.getElementById("totalDepartments").textContent = dashboardData.totalDepartments;
}

function renderTable() {
  const tbody = document.getElementById("recordsTable");
  tbody.innerHTML = "";

  dashboardData.records.slice(0, 10).forEach((record) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${record.id}</td>
      <td>${record.studentName}</td>
      <td>${record.college}</td>
      <td>${record.department}</td>
      <td>${record.guide}</td>
      <td>${record.year}</td>
      <td>${record.addedOn}</td>
    `;
    tbody.appendChild(tr);
  });
}

function createCharts() {
  const collegeCtx = document.getElementById("collegeChart").getContext("2d");
  const guideCtx = document.getElementById("guideChart").getContext("2d");
  const deptCtx = document.getElementById("departmentChart").getContext("2d");
  const yearCtx = document.getElementById("yearChart").getContext("2d");

  collegeChart = new Chart(collegeCtx, {
    type: "doughnut",
    data: {
      labels: Object.keys(dashboardData.colleges),
      datasets: [{
        data: Object.values(dashboardData.colleges),
        backgroundColor: [
          "#2c67f2",
          "#35c885",
          "#8b5cf6",
          "#ffb020",
          "#ff6b6b",
          "#94a3b8"
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right"
        }
      }
    }
  });

  guideChart = new Chart(guideCtx, {
    type: "bar",
    data: {
      labels: Object.keys(dashboardData.guides),
      datasets: [{
        label: "No. of Students",
        data: Object.values(dashboardData.guides),
        backgroundColor: "#2c67f2",
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  departmentChart = new Chart(deptCtx, {
    type: "bar",
    data: {
      labels: Object.keys(dashboardData.departments),
      datasets: [{
        label: "Students",
        data: Object.values(dashboardData.departments),
        backgroundColor: [
          "#2c67f2",
          "#35c885",
          "#ffb020",
          "#8b5cf6",
          "#ff7a45",
          "#22b8cf",
          "#94a3b8"
        ],
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true
        }
      }
    }
  });

  yearChart = new Chart(yearCtx, {
    type: "pie",
    data: {
        labels: Object.keys(dashboardData.genders),
        datasets: [{
            data: Object.values(dashboardData.genders),
            backgroundColor: ["#2c67f2", "#35c885"],
            borderWidth: 0
        }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right"
        }
      }
    }
  });
}

function refreshCharts() {
  collegeChart.data.labels = Object.keys(dashboardData.colleges);
  collegeChart.data.datasets[0].data = Object.values(dashboardData.colleges);
  collegeChart.update();

  guideChart.data.labels = Object.keys(dashboardData.guides);
  guideChart.data.datasets[0].data = Object.values(dashboardData.guides);
  guideChart.update();

  departmentChart.data.labels = Object.keys(dashboardData.departments);
  departmentChart.data.datasets[0].data = Object.values(dashboardData.departments);
  departmentChart.update();

  yearChart.data.labels = Object.keys(dashboardData.genders);
  yearChart.data.datasets[0].data = Object.values(dashboardData.genders);
  yearChart.update();
}

function generateStudentId() {
  const num = 1259 + dashboardData.records.length;
  return "STU" + num;
}

function getTodayDate() {
  const now = new Date();
  return now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function saveToLocalStorage() {
  localStorage.setItem("studentDashboardData", JSON.stringify(dashboardData));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem("studentDashboardData");
  if (saved) {
    dashboardData = JSON.parse(saved);
  }
}

function addStudentRecord(student) {
  dashboardData.totalStudents += 1;

  if (!dashboardData.colleges[student.college]) {
    dashboardData.colleges[student.college] = 0;
    dashboardData.totalColleges += 1;
  }
  dashboardData.colleges[student.college] += 1;

  if (!dashboardData.guides[student.guide]) {
    dashboardData.guides[student.guide] = 0;
    dashboardData.totalGuides += 1;
  }
  dashboardData.guides[student.guide] += 1;

  if (!dashboardData.departments[student.department]) {
    dashboardData.departments[student.department] = 0;
    dashboardData.totalDepartments += 1;
  }
  dashboardData.departments[student.department] += 1;

  dashboardData.records.unshift(student);

  updateStats();
  renderTable();
  refreshCharts();
  saveToLocalStorage();
}

document.getElementById("toggleSidebar").addEventListener("click", function () {
  document.querySelector(".sidebar").classList.toggle("collapsed");
});

function init() {
  loadFromLocalStorage();
  updateDateTime();
  setInterval(updateDateTime, 1000);
  updateStats();
  renderTable();
  createCharts();
}

init();

document.getElementById("excelFile").addEventListener("change", function (event) {

    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {

        const data = new Uint8Array(e.target.result);

        const workbook = XLSX.read(data, {
            type: "array"
        });

        const sheetName = workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];

        excelData = XLSX.utils.sheet_to_json(worksheet);

        console.log(excelData);

        dashboardData.records = [];

dashboardData.colleges = {};

dashboardData.guides = {};

dashboardData.departments = {};

dashboardData.genders = {
    Male: 0,
    Female: 0
};

dashboardData.totalStudents = excelData.length;

dashboardData.totalColleges = 0;

dashboardData.totalGuides = 0;

dashboardData.totalDepartments = 0;

excelData.forEach(student => {

    dashboardData.records.push({
        id: student.Student_ID,
        studentName: student.Student_Name,
        college: student.College,
        department: student.Branch,
        guide: student.Guide,
        year: "-",
        addedOn: "Excel"
    });

    // College Count
    if (!dashboardData.colleges[student.College]) {
        dashboardData.colleges[student.College] = 0;
        dashboardData.totalColleges++;
    }
    dashboardData.colleges[student.College]++;

    // Guide Count
    if (!dashboardData.guides[student.Guide]) {
        dashboardData.guides[student.Guide] = 0;
        dashboardData.totalGuides++;
    }
    dashboardData.guides[student.Guide]++;

    // Department Count
    if (!dashboardData.departments[student.Branch]) {
        dashboardData.departments[student.Branch] = 0;
        dashboardData.totalDepartments++;
    }
    dashboardData.departments[student.Branch]++;


    // Gender Count
    if (!dashboardData.genders[student.Gender]) {
    dashboardData.genders[student.Gender] = 0;
    }

const gender = student.Gender ? student.Gender.trim() : "";

if (gender === "Male" || gender === "Female") {
    dashboardData.genders[gender]++;
}

});

updateStats();

renderTable();

refreshCharts();

saveToLocalStorage();

alert("Excel Loaded Successfully");

};

reader.readAsArrayBuffer(file);

});