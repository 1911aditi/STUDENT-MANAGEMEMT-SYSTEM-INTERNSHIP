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

  years: {
    "1st Year": 642,
    "2nd Year": 613,
    "3rd Year": 560,
    "4th Year": 543
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
      labels: Object.keys(dashboardData.years),
      datasets: [{
        data: Object.values(dashboardData.years),
        backgroundColor: ["#2c67f2", "#35c885", "#ffb020", "#8b5cf6"],
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

  yearChart.data.labels = Object.keys(dashboardData.years);
  yearChart.data.datasets[0].data = Object.values(dashboardData.years);
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

  if (!dashboardData.years[student.year]) {
    dashboardData.years[student.year] = 0;
  }
  dashboardData.years[student.year] += 1;

  dashboardData.records.unshift(student);

  updateStats();
  renderTable();
  refreshCharts();
  saveToLocalStorage();
}

document.getElementById("studentForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const studentName = document.getElementById("studentName").value.trim();
  const collegeName = document.getElementById("collegeName").value.trim();
  const departmentName = document.getElementById("departmentName").value.trim();
  const guideName = document.getElementById("guideName").value.trim();
  const yearName = document.getElementById("yearName").value;

  if (!studentName || !collegeName || !departmentName || !guideName || !yearName) {
    alert("Please fill all fields.");
    return;
  }

  const newStudent = {
    id: generateStudentId(),
    studentName: studentName,
    college: collegeName,
    department: departmentName,
    guide: guideName,
    year: yearName,
    addedOn: getTodayDate()
  };

  addStudentRecord(newStudent);
  this.reset();
});

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
