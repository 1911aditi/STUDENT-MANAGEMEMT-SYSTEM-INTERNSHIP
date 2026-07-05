let excelData = getExcelData();
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

function buildDashboardFromExcel() {
    let studentsList = JSON.parse(localStorage.getItem("studentManagementData"));
    if (!studentsList || studentsList.length === 0) {
        const data = getExcelData();
        if (!data || data.length === 0) return;
        studentsList = data.map((student, idx) => ({
            id: student.Student_ID || student["Student ID"] || ("STU" + (1259 + idx)),
            name: student.Student_Name || student.Name || "Unknown",
            gender: student.Gender || "Male",
            dob: student.DOB || "",
            college: student.College || "Unknown College",
            department: student.Branch || "General",
            branch: student.Branch || "General",
            semester: student.Semester || student.Year || "1st Year",
            guide: student.Guide || "No Guide",
            project: student.Project || "",
            batch: student.Batch || "Batch-2 2026",
            phone: student.Phone || "",
            email: student.Email || "",
            address: (student.District ? student.District + ", " : "") + (student.State || "")
        }));
        localStorage.setItem("studentManagementData", JSON.stringify(studentsList));
    }

    dashboardData.records = [];
    dashboardData.colleges = {};
    dashboardData.guides = {};
    dashboardData.departments = {};
    dashboardData.genders = { "Male": 0, "Female": 0 };

    dashboardData.totalStudents = studentsList.length;

    studentsList.forEach(student => {
        dashboardData.records.push({
            id: student.id,
            studentName: student.name,
            gender: student.gender,
            college: student.college,
            department: student.department,
            guide: student.guide,
            year: student.semester || "-",
            addedOn: student.batch || "Excel"
        });

        if (!dashboardData.colleges[student.college]) {
            dashboardData.colleges[student.college] = 0;
        }
        dashboardData.colleges[student.college]++;

        if (!dashboardData.guides[student.guide]) {
            dashboardData.guides[student.guide] = 0;
        }
        dashboardData.guides[student.guide]++;

        if (!dashboardData.departments[student.department]) {
            dashboardData.departments[student.department] = 0;
        }
        dashboardData.departments[student.department]++;

        const gender = (student.gender || "Male").trim();
        if (!dashboardData.genders[gender]) {
            dashboardData.genders[gender] = 0;
        }
        dashboardData.genders[gender]++;
    });

    dashboardData.totalColleges = Object.keys(dashboardData.colleges).length;
    dashboardData.totalGuides = Object.keys(dashboardData.guides).length;
    dashboardData.totalDepartments = Object.keys(dashboardData.departments).length;
}

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

  const colors20 = [
    "#2c67f2", "#35c885", "#8b5cf6", "#ffb020", "#ff6b6b", 
    "#00d2fc", "#e84393", "#ffeaa7", "#55efc4", "#81ecec", 
    "#74b9ff", "#a29bfe", "#fab1a0", "#ff7675", "#fd79a8", 
    "#fdcb6e", "#e17055", "#d63031", "#b2bec3", "#6c5ce7"
  ];

  collegeChart = new Chart(collegeCtx, {
    type: "doughnut",
    data: {
      labels: Object.keys(dashboardData.colleges),
      datasets: [{
        data: Object.values(dashboardData.colleges),
        backgroundColor: colors20.slice(0, Object.keys(dashboardData.colleges).length),
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
        backgroundColor: colors20.slice(0, Object.keys(dashboardData.departments).length),
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

    buildDashboardFromExcel();

    updateDateTime();
    setInterval(updateDateTime, 60000);

    updateStats();

    renderTable();

    createCharts();
}

init();

// Redundant Excel File listener removed - now handled globally in common.js