(function () {
  // Inject diagnostic error handler to show any JS errors on screen
  window.addEventListener("error", function (e) {
    let errDiv = document.getElementById("debug-error-box");
    if (!errDiv) {
      errDiv = document.createElement("div");
      errDiv.id = "debug-error-box";
      errDiv.style.position = "fixed";
      errDiv.style.bottom = "20px";
      errDiv.style.right = "20px";
      errDiv.style.backgroundColor = "#ff4444";
      errDiv.style.color = "white";
      errDiv.style.padding = "15px";
      errDiv.style.borderRadius = "8px";
      errDiv.style.zIndex = "100000";
      errDiv.style.maxWidth = "400px";
      errDiv.style.fontFamily = "monospace";
      errDiv.style.fontSize = "12px";
      errDiv.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)";
      document.body.appendChild(errDiv);
    }
    errDiv.innerHTML = "<strong>JS Error:</strong> " + e.message + "<br><small>in " + e.filename + ":" + e.lineno + "</small>";
  });

  const DEFAULT_SETTINGS = {
    systemName: "Student Dashboard",
    systemEmail: "admin@studentdashboard.com",
    timezone: "Asia/Kolkata",
    dateFormat: "dd MMM yyyy",
    timeFormat: "12h",
    theme: "blue",
    nightMode: false,
    sidebarCollapsed: false,
    notifications: {
      emailAlerts: true,
      activityAlerts: true,
      backupAlerts: false
    },
    systemPreferences: {
      autoSave: true,
      showWelcomeBanner: true
    },
    userManagement: [],
    rolesPermissions: [
      { role: "Administrator", permissions: ["all"] },
      { role: "Staff", permissions: ["view", "edit"] },
      { role: "Viewer", permissions: ["view"] }
    ],
    activityLogs: []
  };

  const STORAGE_KEY = "studentDashboardSettings";

  function deepMerge(target, source) {
    const output = { ...target };
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        output[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }
    return output;
  }

  function getSettings() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return { ...DEFAULT_SETTINGS };
    }

    try {
      const parsed = JSON.parse(saved);
      return deepMerge(DEFAULT_SETTINGS, parsed);
    } catch (error) {
      console.error("Invalid settings data. Resetting settings.", error);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings(newSettings) {
    const current = getSettings();
    const merged = deepMerge(current, newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    applySettingsToPage();
    return merged;
  }

  function resetSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    applySettingsToPage();
  }

  function addActivityLog(action, details = "") {
    const settings = getSettings();
    const now = new Date();

    settings.activityLogs.unshift({
      action,
      details,
      timestamp: now.toISOString()
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function formatDateByPattern(date, pattern) {
    const day = String(date.getDate()).padStart(2, "0");
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    const shortMonths = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const longMonths = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    switch (pattern) {
      case "dd MMM yyyy":
        return `${day} ${shortMonths[monthIndex]} ${year}`;
      case "dd MMMM yyyy":
        return `${day} ${longMonths[monthIndex]} ${year}`;
      case "yyyy-MM-dd":
        return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${day}`;
      case "MM/dd/yyyy":
        return `${String(monthIndex + 1).padStart(2, "0")}/${day}/${year}`;
      default:
        return `${day} ${shortMonths[monthIndex]} ${year}`;
    }
  }

  function formatTimeByPattern(date, timeFormat) {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");

    if (timeFormat === "24h") {
      return `${String(hours).padStart(2, "0")}:${minutes}`;
    }

    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  function getCurrentDateTimeText() {
    const settings = getSettings();
    const now = new Date();

    const dateText = formatDateByPattern(now, settings.dateFormat);
    const timeText = formatTimeByPattern(now, settings.timeFormat);

    return `${dateText} ${timeText}`;
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    root.classList.remove("theme-blue", "theme-green", "theme-purple", "theme-orange");

    const themeMap = {
      blue: "theme-blue",
      green: "theme-green",
      purple: "theme-purple",
      orange: "theme-orange"
    };

    root.classList.add(themeMap[theme] || "theme-blue");
  }

  function applyNightMode(enabled) {
    document.documentElement.classList.toggle("dark-mode", !!enabled);
  }

  function applySystemName(name) {
    document.title = name;

    const titleTargets = document.querySelectorAll("[data-system-name]");
    titleTargets.forEach((el) => {
      el.textContent = name;
    });
  }

  function applyDateTime() {
    const dateEl = document.getElementById("currentDateTime");
    if (!dateEl) {
      return;
    }
    dateEl.textContent = getCurrentDateTimeText();
  }

  function applySidebarState() {
    const settings = getSettings();
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) {
      return;
    }

    sidebar.classList.toggle("collapsed", !!settings.sidebarCollapsed);
  }

  function applySettingsToPage() {
    const settings = getSettings();
    applyTheme(settings.theme);
    applyNightMode(settings.nightMode);
    applySystemName(settings.systemName);
    applyDateTime();
    applySidebarState();
  }

  function startGlobalClock() {
    applyDateTime();
    setInterval(applyDateTime, 1000);
  }

  function wireSidebarToggle() {
    const btn = document.getElementById("toggleSidebar");
    if (!btn) {
      return;
    }

    btn.addEventListener("click", function () {
      const settings = getSettings();
      const newState = !settings.sidebarCollapsed;
      saveSettings({ sidebarCollapsed: newState });
    });
  }

  function registerStorageSync() {
    window.addEventListener("storage", function (event) {
      if (event.key === STORAGE_KEY) {
        applySettingsToPage();
      }
    });
  }

  function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (typeof XLSX === "undefined") {
      alert("Excel library is not loaded on this page. Please make sure xlsx.full.min.js is included.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        
        let sheetName = workbook.SheetNames.find(name => name.toLowerCase().includes("student")) || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
          alert("Could not find a valid worksheet in the Excel file.");
          return;
        }

        const excelRows = XLSX.utils.sheet_to_json(worksheet);
        if (excelRows.length === 0) {
          alert("The selected worksheet is empty.");
          return;
        }

        const studentsList = excelRows.map((row, idx) => parseStudentFromRow(row, idx));
        const collegesList = deriveColleges(studentsList);
        const guidesList = deriveGuides(studentsList);
        const deptsList = deriveDepartments(studentsList, guidesList);

        localStorage.setItem("studentManagementData", JSON.stringify(studentsList));
        localStorage.setItem("collegeData", JSON.stringify(collegesList));
        localStorage.setItem("guideManagementData", JSON.stringify(guidesList));
        localStorage.setItem("departmentData", JSON.stringify(deptsList));
        localStorage.setItem("studentManagementExcelData", JSON.stringify(excelRows));

        addActivityLog("Import Excel Database", `Imported ${studentsList.length} students from ${file.name}`);

        alert("Excel Database Loaded Successfully!\n\nImported:\n- " + studentsList.length + " Students\n- " + collegesList.length + " Colleges\n- " + guidesList.length + " Guides\n- " + deptsList.length + " Departments");
        
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert("Failed to parse Excel file. Error: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function parseStudentFromRow(row, index) {
    const normalized = {};
    for (let key in row) {
      const normKey = key.toLowerCase().replace(/[\s_-]/g, "");
      normalized[normKey] = row[key];
    }

    const id = normalized["studentid"] || normalized["student_id"] || ("STU" + (1259 + index));
    const name = normalized["studentname"] || normalized["name"] || "Unknown";
    
    let rawGender = String(normalized["gender"] || "Male").trim().toLowerCase();
    let gender = "Male";
    if (rawGender === "female" || rawGender === "f") gender = "Female";
    else if (rawGender === "male" || rawGender === "m") gender = "Male";

    const dob = normalized["dob"] || "";
    const college = normalized["college"] || "Unknown College";
    const branch = normalized["branch"] || normalized["department"] || "General";
    const guide = normalized["guide"] || "No Guide";
    const project = normalized["project"] || "";
    const batch = normalized["batch"] || "Batch-2 2026";
    const semester = normalized["semester"] || normalized["year"] || "1st Year";
    const phone = normalized["phone"] || "";
    const email = normalized["email"] || "";
    const address = (normalized["district"] ? normalized["district"] + ", " : "") + (normalized["state"] || "");
    const cgpa = normalized["cgpa"] || "";
    
    const collegeType = normalized["collegetype"] || normalized["type"] || "Private";
    const district = normalized["district"] || "";
    const state = normalized["state"] || "Odisha";
    const guideStatus = normalized["guidestatus"] || "Active";

    return {
      id: String(id),
      name: String(name),
      gender: String(gender),
      dob: String(dob),
      college: String(college),
      department: String(branch),
      branch: String(branch),
      semester: String(semester),
      guide: String(guide),
      project: String(project),
      batch: String(batch),
      phone: String(phone),
      email: String(email),
      address: String(address),
      cgpa: String(cgpa),
      collegeType: String(collegeType),
      district: String(district),
      state: String(state),
      guideStatus: String(guideStatus)
    };
  }

  function deriveColleges(studentsList) {
    const collegeMap = {};
    studentsList.forEach(student => {
      const name = student.college;
      if (!collegeMap[name]) {
        let cType = String(student.collegeType || "Private").trim();
        if (cType.toLowerCase().includes("gov")) cType = "Government";
        else if (cType.toLowerCase().includes("auto")) cType = "Autonomous";
        else cType = "Private";

        collegeMap[name] = {
          id: "COL" + String(Object.keys(collegeMap).length + 1).padStart(3, "0"),
          name: name,
          type: cType,
          district: student.district || student.address.split(",")[0] || "",
          state: student.state || student.address.split(",")[1] || "Odisha",
          university: "BPUT",
          students: 0,
          guides: new Set(),
          departments: new Set()
        };
      }
      collegeMap[name].students++;
      if (student.guide) collegeMap[name].guides.add(student.guide);
      if (student.department) collegeMap[name].departments.add(student.department);
    });

    return Object.values(collegeMap).map(col => ({
      ...col,
      guides: col.guides.size,
      departments: col.departments.size
    }));
  }

  function deriveGuides(studentsList) {
    const guideMap = {};
    studentsList.forEach(student => {
      const name = student.guide;
      if (!guideMap[name]) {
        let gStatus = String(student.guideStatus || "Active").trim();
        if (gStatus.toLowerCase().includes("in") || gStatus.toLowerCase().startsWith("d")) gStatus = "Inactive";
        else gStatus = "Active";

        guideMap[name] = {
          id: "GUI" + String(Object.keys(guideMap).length + 1).padStart(3, "0"),
          name: name,
          department: student.department,
          designation: "Professor",
          students: 0,
          projects: new Set(),
          email: name.toLowerCase().replace(/[^a-z]/g, "") + "@college.edu",
          phone: "98765" + String(Math.floor(10000 + Math.random() * 90000)),
          status: gStatus
        };
      }
      guideMap[name].students++;
      if (student.project) guideMap[name].projects.add(student.project);
    });

    return Object.values(guideMap).map(g => ({
      ...g,
      projects: g.projects.size
    }));
  }

  function deriveDepartments(studentsList, guidesList) {
    const deptMap = {};
    studentsList.forEach(student => {
      const name = student.department;
      if (!deptMap[name]) {
        deptMap[name] = {
          id: "DEP" + String(Object.keys(deptMap).length + 1).padStart(3, "0"),
          name: name,
          faculty: 0,
          students: 0,
          courses: Math.floor(4 + Math.random() * 5),
          status: "Active"
        };
      }
      deptMap[name].students++;
    });

    guidesList.forEach(guide => {
      const name = guide.department;
      if (deptMap[name]) {
        deptMap[name].faculty++;
      }
    });

    return Object.values(deptMap);
  }

  window.DashboardSettings = {
    getSettings,
    saveSettings,
    resetSettings,
    addActivityLog,
    applySettingsToPage,
    getCurrentDateTimeText
  };

  document.addEventListener("DOMContentLoaded", function () {
    applySettingsToPage();
    startGlobalClock();
    wireSidebarToggle();
    registerStorageSync();

    // Run an automatic one-time migration to fix derived lists from raw Excel data if present
    const excelRawStr = localStorage.getItem("studentManagementExcelData");
    const migrationDone = localStorage.getItem("excelMigrationDone_v3");
    if (excelRawStr && !migrationDone) {
      try {
        const excelRows = JSON.parse(excelRawStr);
        if (excelRows && excelRows.length > 0) {
          const studentsList = excelRows.map((row, idx) => parseStudentFromRow(row, idx));
          const collegesList = deriveColleges(studentsList);
          const guidesList = deriveGuides(studentsList);
          const deptsList = deriveDepartments(studentsList, guidesList);

          localStorage.setItem("studentManagementData", JSON.stringify(studentsList));
          localStorage.setItem("collegeData", JSON.stringify(collegesList));
          localStorage.setItem("guideManagementData", JSON.stringify(guidesList));
          localStorage.setItem("departmentData", JSON.stringify(deptsList));
          localStorage.setItem("excelMigrationDone_v3", "true");
          console.log("Database migration successful: re-derived colleges, guides, and departments.");
          window.location.reload();
          return;
        }
      } catch (e) {
        console.error("Migration failed:", e);
      }
    }

    // Bind Excel file change listener
    const excelInput = document.getElementById("excelFile");
    if (excelInput) {
      excelInput.addEventListener("change", handleExcelUpload);
    }
  });

})();