(function () {
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
  });
})();