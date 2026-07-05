let students = [
  {
    id: "STU1258",
    name: "Aarav Sharma",
    gender: "Male",
    dob: "2003-05-12",
    college: "ABC College",
    department: "Computer Science",
    branch: "Computer Science",
    semester: "Semester 6",
    guide: "Dr. Sharma",
    project: "AI Chatbot",
    batch: "Batch-2 2026",
    phone: "9876543210",
    email: "aarav@example.com",
    address: "Delhi"
  },
  {
    id: "STU1257",
    name: "Priya Verma",
    gender: "Female",
    dob: "2004-02-08",
    college: "XYZ Institute",
    department: "Electronics",
    branch: "Electronics",
    semester: "Semester 4",
    guide: "Dr. Verma",
    project: "IoT System",
    batch: "Batch-2 2026",
    phone: "8765432109",
    email: "priya@example.com",
    address: "Mumbai"
  },
  {
    id: "STU1256",
    name: "Rohan Singh",
    gender: "Male",
    dob: "2002-11-20",
    college: "PQR University",
    department: "Mechanical",
    branch: "Mechanical",
    semester: "Semester 8",
    guide: "Dr. Singh",
    project: "Robotics",
    batch: "Batch-2 2026",
    phone: "7654321098",
    email: "rohan@example.com",
    address: "Pune"
  },
  {
    id: "STU1255",
    name: "Sneha Patel",
    gender: "Female",
    dob: "2003-07-18",
    college: "LMN College",
    department: "Information Tech",
    branch: "Information Tech",
    semester: "Semester 6",
    guide: "Dr. Patel",
    project: "ML Model",
    batch: "Batch-2 2026",
    phone: "6543210987",
    email: "sneha@example.com",
    address: "Ahmedabad"
  },
  {
    id: "STU1254",
    name: "Vivek Gupta",
    gender: "Male",
    dob: "2003-01-10",
    college: "ABC College",
    department: "Civil",
    branch: "Civil",
    semester: "Semester 6",
    guide: "Dr. Gupta",
    project: "Smart Bridge",
    batch: "Batch-2 2026",
    phone: "5432109876",
    email: "vivek@example.com",
    address: "Jaipur"
  }
];

let filteredStudents = [...students];
let editIndex = null;
let branchChart = null;
let genderChart = null;

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

function generateStudentId() {
  let max = 1258;
  students.forEach((student) => {
    const num = parseInt(student.id.replace("STU", ""), 10);
    if (num > max) {
      max = num;
    }
  });
  return "STU" + (max + 1);
}

function saveStudents() {
  localStorage.setItem("studentManagementData", JSON.stringify(students));
}

function loadStudents() {
  const stored = localStorage.getItem("studentManagementData");
  if (stored) {
    students = JSON.parse(stored);
  } else {
    const excel = getExcelData();
    if (excel && excel.length > 0) {
      students = excel.map((student, idx) => ({
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
      saveStudents();
    } else {
      saveStudents();
    }
  }
  filteredStudents = [...students];
}

function setDefaultStudentId() {
  document.getElementById("studentId").value = generateStudentId();
}

function getStats() {
  const totalStudents = students.length;
  const activeStudents = students.length;
  const maleStudents = students.filter((s) => s.gender === "Male").length;
  const femaleStudents = students.filter((s) => s.gender === "Female").length;

  return {
    totalStudents,
    activeStudents,
    maleStudents,
    femaleStudents
  };
}

function renderStats() {
  const stats = getStats();
  document.getElementById("totalStudents").textContent = stats.totalStudents;
  document.getElementById("activeStudents").textContent = stats.activeStudents;
  document.getElementById("maleStudents").textContent = stats.maleStudents;
  document.getElementById("femaleStudents").textContent = stats.femaleStudents;
}

function renderTable(data = filteredStudents) {
  const tbody = document.getElementById("studentTableBody");
  tbody.innerHTML = "";

  data.forEach((student, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${student.id}</td>
      <td>${student.name}</td>
      <td>${student.college}</td>
      <td>${student.branch}</td>
      <td>${student.guide}</td>
      <td>${student.project}</td>
      <td>${student.batch}</td>
      <td>${student.phone || "-"}</td>
      <td>${student.email || "-"}</td>
      <td>
        <div class="action-cell">
          <button class="table-action-btn edit-btn" onclick="editStudent('${student.id}')">✎</button>
          <button class="table-action-btn delete-btn" onclick="removeStudent('${student.id}')">🗑</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const count = data.length;
  document.getElementById("tableInfo").textContent = `Showing 1 to ${count} of ${count} entries`;
}

function buildUniqueOptions(key, elementId, firstText) {
  const select = document.getElementById(elementId);
  const values = [...new Set(students.map((item) => item[key]).filter(Boolean))];
  select.innerHTML = `<option value="">${firstText}</option>`;

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function populateSearchFilters() {
  buildUniqueOptions("college", "searchCollege", "All Colleges");
  buildUniqueOptions("branch", "searchBranch", "All Branches");
  buildUniqueOptions("guide", "searchGuide", "All Guides");
  buildUniqueOptions("batch", "searchBatch", "All Batches");
}

function renderBranchSummary() {

    const branchData = {};

    students.forEach(student => {
        branchData[student.branch] = (branchData[student.branch] || 0) + 1;
    });

    const ctx = document.getElementById("branchChart");

    if (branchChart) {
        branchChart.destroy();
    }

    branchChart = new Chart(ctx, {

        type: "pie",

        data: {

            labels: Object.keys(branchData),

            datasets: [{

                data: Object.values(branchData),

                backgroundColor: [
                    "#2c67f2",
                    "#22c55e",
                    "#f59e0b",
                    "#8b5cf6",
                    "#ef4444",
                    "#14b8a6"
                ]

            }]
        },

        options: {

            responsive: true,

            plugins: {

                legend: {
                    position: "bottom"
                }

            }

        }

    });

}

function renderGenderSummary() {

    const ctx = document.getElementById("genderChart");

    if (genderChart) {
        genderChart.destroy();
    }

    genderChart = new Chart(ctx, {

        type: "doughnut",

        data: {

            labels: ["Male", "Female"],

            datasets: [{

                data: [

                    students.filter(s => s.gender === "Male").length,
                    students.filter(s => s.gender === "Female").length

                ],

                backgroundColor: [

                    "#2c67f2",
                    "#ec4899"

                ]

            }]
        },

        options: {

            responsive: true,

            plugins: {

                legend: {

                    position: "bottom"

                }

            }

        }

    });

}

function clearFormForNewEntry() {
  document.getElementById("studentForm").reset();
  editIndex = null;
  document.querySelector('input[name="gender"][value="Male"]').checked = true;
  document.getElementById("batch").value = "Batch-2 2026";
  setDefaultStudentId();
}

function getFormData() {
  return {
    id: document.getElementById("studentId").value.trim(),
    name: document.getElementById("studentName").value.trim(),
    gender: document.querySelector('input[name="gender"]:checked').value,
    dob: document.getElementById("dob").value,
    college: document.getElementById("college").value.trim(),
    department: document.getElementById("department").value.trim(),
    branch: document.getElementById("branch").value.trim(),
    semester: document.getElementById("semester").value,
    guide: document.getElementById("guide").value.trim(),
    project: document.getElementById("project").value.trim(),
    batch: document.getElementById("batch").value,
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    address: document.getElementById("address").value.trim()
  };
}

function validateStudent(student) {
  if (
    !student.name ||
    !student.dob ||
    !student.college ||
    !student.department ||
    !student.branch ||
    !student.semester ||
    !student.guide ||
    !student.project ||
    !student.batch
  ) {
    alert("Please fill all required fields.");
    return false;
  }

  return true;
}

document.getElementById("studentForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const student = getFormData();

  if (!validateStudent(student)) {
    return;
  }

  if (editIndex !== null) {
    students[editIndex] = student;
    alert("Student updated successfully.");
  } else {
    students.unshift(student);
    alert("Student added successfully.");
  }

  saveStudents();
  filteredStudents = [...students];
  renderAll();
  clearFormForNewEntry();
});

function editStudent(studentId) {
  const index = students.findIndex((student) => student.id === studentId);
  if (index === -1) {
    return;
  }

  const student = students[index];
  editIndex = index;

  document.getElementById("studentId").value = student.id;
  document.getElementById("studentName").value = student.name;
  document.querySelector(`input[name="gender"][value="${student.gender}"]`).checked = true;
  document.getElementById("dob").value = student.dob;
  document.getElementById("college").value = student.college;
  document.getElementById("department").value = student.department;
  document.getElementById("branch").value = student.branch;
  document.getElementById("semester").value = student.semester;
  document.getElementById("guide").value = student.guide;
  document.getElementById("project").value = student.project;
  document.getElementById("batch").value = student.batch;
  document.getElementById("email").value = student.email;
  document.getElementById("phone").value = student.phone;
  document.getElementById("address").value = student.address;
}

function removeStudent(studentId) {
  const confirmed = confirm("Are you sure you want to delete this student?");
  if (!confirmed) {
    return;
  }

  students = students.filter((student) => student.id !== studentId);
  filteredStudents = [...students];
  saveStudents();
  renderAll();
  clearFormForNewEntry();
}

document.getElementById("updateBtn").addEventListener("click", function () {
  if (editIndex === null) {
    alert("Please click edit on a student record first.");
    return;
  }

  document.getElementById("studentForm").requestSubmit();
});

document.getElementById("deleteBtn").addEventListener("click", function () {
  const currentId = document.getElementById("studentId").value.trim();

  if (!currentId || editIndex === null) {
    alert("Please select a student by clicking edit first.");
    return;
  }

  removeStudent(currentId);
});

document.getElementById("clearBtn").addEventListener("click", function () {
  setTimeout(() => {
    clearFormForNewEntry();
  }, 0);
});

document.getElementById("searchForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("searchName").value.trim().toLowerCase();
  const id = document.getElementById("searchId").value.trim().toLowerCase();
  const college = document.getElementById("searchCollege").value;
  const branch = document.getElementById("searchBranch").value;
  const guide = document.getElementById("searchGuide").value;
  const batch = document.getElementById("searchBatch").value;

  filteredStudents = students.filter((student) => {
    const matchName = !name || student.name.toLowerCase().includes(name);
    const matchId = !id || student.id.toLowerCase().includes(id);
    const matchCollege = !college || student.college === college;
    const matchBranch = !branch || student.branch === branch;
    const matchGuide = !guide || student.guide === guide;
    const matchBatch = !batch || student.batch === batch;

    return matchName && matchId && matchCollege && matchBranch && matchGuide && matchBatch;
  });

  renderTable(filteredStudents);
});

document.getElementById("resetSearch").addEventListener("click", function () {
  document.getElementById("searchForm").reset();
  filteredStudents = [...students];
  renderTable(filteredStudents);
});

document.getElementById("batchFilter").addEventListener("change", function () {
  const selectedBatch = this.value;

  if (selectedBatch === "all") {
    filteredStudents = [...students];
  } else {
    filteredStudents = students.filter((student) => student.batch === selectedBatch);
  }

  renderTable(filteredStudents);
});

document.getElementById("printIdCard").addEventListener("click", function () {
  window.print();
});

document.getElementById("exportStudents").addEventListener("click", function () {
  let csv =
    "ID,Student Name,College,Branch,Guide,Project,Batch,Phone,Email\n";

  filteredStudents.forEach((student) => {
    csv += `"${student.id}","${student.name}","${student.college}","${student.branch}","${student.guide}","${student.project}","${student.batch}","${student.phone}","${student.email}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "student-records.csv";
  link.click();
  URL.revokeObjectURL(url);
});

document.getElementById("toggleSidebar").addEventListener("click", function () {
  document.querySelector(".sidebar").classList.toggle("collapsed");
});

function renderAll() {
  renderStats();
  populateSearchFilters();
  renderTable(filteredStudents);
  renderBranchSummary();
  renderGenderSummary();
}

function init() {
  loadStudents();
  updateDateTime();
  setInterval(updateDateTime, 60000);
  setDefaultStudentId();
  renderAll();
}

init();