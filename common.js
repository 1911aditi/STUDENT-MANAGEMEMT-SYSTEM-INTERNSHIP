window.getActiveDataSource = function() {
  let source = sessionStorage.getItem("serverActiveDataSource");
  if (!source) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", "/api/datasource/active", false); // Synchronous block
      xhr.send(null);
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        source = res.activeDataSource || "Excel";
        sessionStorage.setItem("serverActiveDataSource", source);
      }
    } catch (err) {
      console.error("Error fetching active data source synchronously:", err);
    }
  }
  return source || localStorage.getItem("activeDataSource") || "Excel";
};

// Intercept localStorage.setItem to propagate derived changes back to student records in Excel mode
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  if (key === "collegeData_Excel") {
    const newColleges = JSON.parse(value || "[]");
    const oldColleges = JSON.parse(localStorage.getItem("collegeData_Excel") || "[]");
    const students = JSON.parse(localStorage.getItem("studentManagementData_Excel") || "[]");
    let updated = false;

    oldColleges.forEach(oldC => {
      const match = newColleges.find(newC => newC.id === oldC.id);
      if (match && match.name !== oldC.name) {
        students.forEach(s => {
          if (s.college === oldC.name) {
            s.college = match.name;
            updated = true;
          }
        });
      }
    });

    if (newColleges.length < oldColleges.length) {
      const newNames = new Set(newColleges.map(c => c.name));
      const deletedNames = oldColleges.filter(c => !newNames.has(c.name)).map(c => c.name);
      if (deletedNames.length > 0) {
        const filteredStudents = students.filter(s => !deletedNames.includes(s.college));
        if (filteredStudents.length !== students.length) {
          originalSetItem.call(localStorage, "studentManagementData_Excel", JSON.stringify(filteredStudents));
        }
      }
    }

    if (updated) {
      originalSetItem.call(localStorage, "studentManagementData_Excel", JSON.stringify(students));
    }
  }

  if (key === "departmentData_Excel") {
    const newDepts = JSON.parse(value || "[]");
    const oldDepts = JSON.parse(localStorage.getItem("departmentData_Excel") || "[]");
    const students = JSON.parse(localStorage.getItem("studentManagementData_Excel") || "[]");
    let updated = false;

    oldDepts.forEach(oldD => {
      const match = newDepts.find(newD => newD.id === oldD.id);
      if (match && match.name !== oldD.name) {
        students.forEach(s => {
          if (s.branch === oldD.name || s.department === oldD.name) {
            s.branch = match.name;
            s.department = match.name;
            updated = true;
          }
        });
      }
    });

    if (newDepts.length < oldDepts.length) {
      const newNames = new Set(newDepts.map(d => d.name));
      const deletedNames = oldDepts.filter(d => !newNames.has(d.name)).map(d => d.name);
      if (deletedNames.length > 0) {
        const filteredStudents = students.filter(s => !deletedNames.includes(s.branch) && !deletedNames.includes(s.department));
        if (filteredStudents.length !== students.length) {
          originalSetItem.call(localStorage, "studentManagementData_Excel", JSON.stringify(filteredStudents));
        }
      }
    }

    if (updated) {
      originalSetItem.call(localStorage, "studentManagementData_Excel", JSON.stringify(students));
    }
  }

  if (key === "guideManagementData_Excel") {
    const newGuides = JSON.parse(value || "[]");
    const oldGuides = JSON.parse(localStorage.getItem("guideManagementData_Excel") || "[]");
    const students = JSON.parse(localStorage.getItem("studentManagementData_Excel") || "[]");
    let updated = false;

    oldGuides.forEach(oldG => {
      const match = newGuides.find(newG => newG.id === oldG.id);
      if (match && match.name !== oldG.name) {
        students.forEach(s => {
          if (s.guide === oldG.name) {
            s.guide = match.name;
            updated = true;
          }
        });
      }
    });

    if (newGuides.length < oldGuides.length) {
      const newNames = new Set(newGuides.map(g => g.name));
      const deletedNames = oldGuides.filter(g => !newNames.has(g.name)).map(g => g.name);
      if (deletedNames.length > 0) {
        const filteredStudents = students.filter(s => !deletedNames.includes(s.guide));
        if (filteredStudents.length !== students.length) {
          originalSetItem.call(localStorage, "studentManagementData_Excel", JSON.stringify(filteredStudents));
        }
      }
    }

    if (updated) {
      originalSetItem.call(localStorage, "studentManagementData_Excel", JSON.stringify(students));
    }
  }

  originalSetItem.call(localStorage, key, value);
};

window.fetchData = async function(apiPath, localStorageKey) {
  const res = await window.fetch(apiPath);
  if (!res.ok) throw new Error(`Failed to fetch from ${apiPath}`);
  return await res.json();
};

(function () {

  // Global buffering spinner utility
  window.showBuffering = function(show = true) {
    let loader = document.getElementById('global-buffering-indicator');
    if (show) {
      if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-buffering-indicator';
        loader.style.position = 'fixed';
        loader.style.top = '0';
        loader.style.left = '0';
        loader.style.width = '100vw';
        loader.style.height = '100vh';
        loader.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        loader.style.backdropFilter = 'blur(4px)';
        loader.style.display = 'flex';
        loader.style.flexDirection = 'column';
        loader.style.alignItems = 'center';
        loader.style.justifyContent = 'center';
        loader.style.zIndex = '999999';
        loader.style.transition = 'all 0.3s ease';
        
        if (!document.getElementById('spinner-style')) {
          const style = document.createElement('style');
          style.id = 'spinner-style';
          style.innerHTML = `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `;
          document.head.appendChild(style);
        }
        
        loader.innerHTML = `
          <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"></div>
          <div style="margin-top: 15px; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: #1e3a8a; letter-spacing: 0.5px;">Loading Database Records...</div>
        `;
        document.body.appendChild(loader);
      }
      loader.style.opacity = '1';
      loader.style.pointerEvents = 'auto';
    } else {
      if (loader) {
        loader.style.opacity = '0';
        loader.style.pointerEvents = 'none';
        setTimeout(() => { if (loader) loader.remove(); }, 300);
      }
    }
  };

  // Intercept all API calls to trigger buffering screen
  let activeRequests = 0;
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const url = args[0];
    const isApiCall = typeof url === 'string' && url.includes('/api/') && !url.includes('/api/database/active');
    
    if (isApiCall) {
      activeRequests++;
      if (activeRequests === 1) {
        window.showBuffering(true);
      }
    }
    
    try {
      return await originalFetch(...args);
    } finally {
      if (isApiCall) {
        activeRequests--;
        if (activeRequests <= 0) {
          activeRequests = 0;
          window.showBuffering(false);
        }
      }
    }
  };

  // Inject dynamic active database status box in the sidebar (with persistent localStorage admin mode check)
  document.addEventListener("DOMContentLoaded", function() {
    // Parse and persist admin mode with password verification
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('admin')) {
      const val = urlParams.get('admin');
      if (val === 'true') {
        // If not already in admin mode, prompt for password
        if (localStorage.getItem('isAdminMode') !== 'true') {
          const password = prompt("Enter Admin Password to enable Developer Mode:");
          if (password) {
            // Verify password synchronously using XMLHttpRequest
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/api/admin/verify", false);
            xhr.setRequestHeader("Content-Type", "application/json");
            try {
              xhr.send(JSON.stringify({ password }));
              if (xhr.status === 200) {
                localStorage.setItem('isAdminMode', 'true');
                alert("Developer Mode Activated!");
              } else {
                localStorage.removeItem('isAdminMode');
                alert("Access Denied: Incorrect Password!");
              }
            } catch (e) {
              console.error(e);
              alert("Error connecting to admin verification API.");
            }
          }
        }
        // Redirect to remove ?admin=true parameter from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('admin');
        window.location.href = url.toString();
        return;
      } else {
        localStorage.removeItem('isAdminMode');
        const url = new URL(window.location.href);
        url.searchParams.delete('admin');
        window.location.href = url.toString();
        return;
      }
    }
    const isAdmin = localStorage.getItem('isAdminMode') === 'true';

    const excelBox = document.querySelector(".excel-upload-box");
    if (excelBox) {
      const currentSource = window.getActiveDataSource();

      if (isAdmin) {
        // Developer/Admin mode: Show file uploads
        excelBox.style.display = currentSource === "Excel" ? "block" : "none";
        
        const dbBox = document.createElement("div");
        dbBox.className = "excel-upload-box";
        dbBox.style.marginTop = "10px";
        dbBox.innerHTML = `
          <label for="accdbFile" class="excel-upload-label" style="background-color: #7c2d12; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 6px; color: white; font-weight: bold; transition: background 0.2s;">
            <i class="fa-solid fa-database"></i> <span id="accdbFileLabel">Select Access DB</span>
          </label>
          <input type="file" id="accdbFile" accept=".accdb" style="display: none;">
        `;
        excelBox.parentNode.insertBefore(dbBox, excelBox.nextSibling);
        dbBox.style.display = currentSource === "Access" ? "block" : "none";

        const label = dbBox.querySelector("#accdbFileLabel");
        fetch('/api/database/active')
          .then(res => res.json())
          .then(data => {
            if (data && data.filename) {
              label.innerText = `DB: ${data.filename}`;
            }
          });

        const accdbInput = dbBox.querySelector("#accdbFile");
        accdbInput.addEventListener("change", async function(e) {
          const file = e.target.files[0];
          if (!file) return;
          label.innerText = "Connecting...";
          try {
            const res = await fetch(`/api/database/upload?name=${encodeURIComponent(file.name)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/octet-stream' },
              body: file
            });
            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || 'Failed to connect database.');
            }
            alert(`Successfully connected to database file: ${file.name}`);
            sessionStorage.removeItem("serverActiveDataSource");
            window.location.reload();
          } catch (err) {
            alert(`Database Connection Error: ${err.message}`);
            label.innerText = "Select Access DB";
          }
        });
      } else {
        // Locked/Client mode: Hide file uploads, show status badge
        excelBox.style.display = "none";
        const statusBox = document.createElement("div");
        statusBox.className = "excel-upload-box";
        statusBox.style.marginTop = "10px";
        statusBox.style.background = "rgba(59, 130, 246, 0.1)";
        statusBox.style.border = "1px solid rgba(59, 130, 246, 0.2)";
        statusBox.style.padding = "10px";
        statusBox.style.borderRadius = "6px";
        statusBox.style.color = "#2563eb";
        statusBox.style.textAlign = "center";
        statusBox.style.fontSize = "12px";
        statusBox.style.fontWeight = "bold";

        if (currentSource === "Excel") {
          statusBox.innerHTML = `<i class="fa-solid fa-file-excel"></i> Active Source: Excel`;
        } else {
          statusBox.innerHTML = `<i class="fa-solid fa-database"></i> Active Source: Access`;
          fetch('/api/database/active')
            .then(res => res.json())
            .then(data => {
              if (data && data.filename) {
                statusBox.innerHTML = `<i class="fa-solid fa-database"></i> Active: ${data.filename}`;
              }
            })
            .catch(err => console.error("Error fetching active DB in status box:", err));
        }
        excelBox.parentNode.insertBefore(statusBox, excelBox.nextSibling);
      }
    }
  });

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

        // Clear all duplicate keys to free up space
        localStorage.removeItem("studentManagementExcelData");
        localStorage.removeItem("studentManagementData");
        localStorage.removeItem("collegeData");
        localStorage.removeItem("guideManagementData");
        localStorage.removeItem("departmentData");
        localStorage.removeItem("studentManagementData_Access");
        localStorage.removeItem("studentManagementExcelData_Access");

        localStorage.setItem("studentManagementData_Excel", JSON.stringify(studentsList));
        localStorage.setItem("collegeData_Excel", JSON.stringify(collegesList));
        localStorage.setItem("guideManagementData_Excel", JSON.stringify(guidesList));
        localStorage.setItem("departmentData_Excel", JSON.stringify(deptsList));
        localStorage.setItem("activeDataSource", "Excel");

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
      const name = student.college || "Unknown College";
      if (!collegeMap[name]) {
        let cType = String(student.collegeType || "Private").trim();
        if (cType.toLowerCase().includes("gov")) cType = "Government";
        else if (cType.toLowerCase().includes("auto")) cType = "Autonomous";
        else cType = "Private";

        collegeMap[name] = {
          id: "COL" + String(Object.keys(collegeMap).length + 1).padStart(3, "0"),
          name: name,
          type: cType,
          district: student.district || student.address.split(",")[0] || "Khordha",
          state: student.state || student.address.split(",")[1] || "Odisha",
          university: student.university || "BPUT",
          students: 0,
          guides: new Set(),
          departments: new Set()
        };
      }
      collegeMap[name].students++;
      if (student.guide) collegeMap[name].guides.add(student.guide);
      if (student.branch || student.department) collegeMap[name].departments.add(student.branch || student.department);
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
      const name = student.guide || "Unknown Guide";
      if (!guideMap[name]) {
        let gStatus = String(student.guideStatus || "Active").trim();
        if (gStatus.toLowerCase().includes("in") || gStatus.toLowerCase().startsWith("d")) gStatus = "Inactive";
        else gStatus = "Active";

        guideMap[name] = {
          id: "GUI" + String(Object.keys(guideMap).length + 1).padStart(3, "0"),
          name: name,
          department: student.branch || student.department || "General",
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
      const name = student.branch || student.department || "General";
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

    // Inject data source selector dropdown next to the toggle button
    const topbarLeft = document.querySelector(".topbar-left");
    if (topbarLeft) {
      const sourceSelectContainer = document.createElement("div");
      sourceSelectContainer.id = "global-data-source-container";
      sourceSelectContainer.style.display = "flex";
      sourceSelectContainer.style.alignItems = "center";
      sourceSelectContainer.style.gap = "8px";
      sourceSelectContainer.style.background = "rgba(59, 130, 246, 0.1)";
      sourceSelectContainer.style.border = "1px solid rgba(59, 130, 246, 0.2)";
      sourceSelectContainer.style.padding = "6px 14px";
      sourceSelectContainer.style.borderRadius = "20px";
      sourceSelectContainer.style.fontSize = "12px";
      sourceSelectContainer.style.fontWeight = "500";
      sourceSelectContainer.style.color = "#2563eb";
      sourceSelectContainer.style.marginLeft = "15px";
      sourceSelectContainer.style.boxShadow = "0 2px 5px rgba(0,0,0,0.05)";

      const currentSource = window.getActiveDataSource();

      const isAdmin = localStorage.getItem('isAdminMode') === 'true';

      if (!isAdmin) {
        // Locked mode: static display
        sourceSelectContainer.innerHTML = `
          <i class="fa-solid fa-server" style="color: #2563eb;"></i>
          <span style="color: #6b7280; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Data Source:</span>
          <span style="color: #1e3a8a; font-weight: 700; font-family: inherit; font-size: 12px; margin-left: 5px;">${currentSource === 'Excel' ? 'Excel Sheet' : 'Access Database'}</span>
        `;
        topbarLeft.appendChild(sourceSelectContainer);
      } else {
        // Admin mode: dropdown select
        sourceSelectContainer.innerHTML = `
          <i class="fa-solid fa-server" style="color: #2563eb;"></i>
          <span style="color: #6b7280; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Data Source:</span>
          <select id="globalDataSourceSelect" style="background: transparent; border: none; color: #1e3a8a; font-weight: 700; font-family: inherit; font-size: 12px; outline: none; cursor: pointer; padding-right: 5px;">
            <option value="Excel" ${currentSource === "Excel" ? "selected" : ""}>Excel Sheet</option>
            <option value="Access" ${currentSource === "Access" ? "selected" : ""}>Access Database</option>
          </select>
        `;
        topbarLeft.appendChild(sourceSelectContainer);

        const selectEl = sourceSelectContainer.querySelector("#globalDataSourceSelect");
        selectEl.addEventListener("change", async function(e) {
          const val = e.target.value;
          try {
            const res = await fetch('/api/datasource/active', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ source: val })
            });
            if (res.ok) {
              sessionStorage.removeItem("serverActiveDataSource");
              localStorage.setItem("activeDataSource", val);
              alert(`Data source switched centrally on server to: ${val === 'Excel' ? 'Excel Sheet' : 'Access Database'}`);
              const url = new URL(window.location.href);
              url.searchParams.set('admin', 'true');
              window.location.href = url.toString();
            } else {
              alert('Failed to update data source on server.');
            }
          } catch (err) {
            console.error(err);
            alert('Error updating server data source.');
          }
        });
      }
    }



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

          localStorage.removeItem("studentManagementExcelData");
          localStorage.removeItem("studentManagementData");
          localStorage.removeItem("collegeData");
          localStorage.removeItem("guideManagementData");
          localStorage.removeItem("departmentData");
          localStorage.removeItem("studentManagementData_Access");
          localStorage.removeItem("studentManagementExcelData_Access");

          localStorage.setItem("studentManagementData_Excel", JSON.stringify(studentsList));
          localStorage.setItem("collegeData_Excel", JSON.stringify(collegesList));
          localStorage.setItem("guideManagementData_Excel", JSON.stringify(guidesList));
          localStorage.setItem("departmentData_Excel", JSON.stringify(deptsList));
          localStorage.setItem("activeDataSource", "Excel");
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