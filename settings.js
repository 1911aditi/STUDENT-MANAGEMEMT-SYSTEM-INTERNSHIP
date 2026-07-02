document.addEventListener("DOMContentLoaded", function () {
  const settings = DashboardSettings.getSettings();

  function loadGeneralSettings() {
    document.getElementById("systemName").value = settings.systemName;
    document.getElementById("systemEmail").value = settings.systemEmail;
    document.getElementById("timezone").value = settings.timezone;
    document.getElementById("dateFormat").value = settings.dateFormat;
    document.getElementById("timeFormat").value = settings.timeFormat;

    document.getElementById("nightMode").checked = settings.nightMode;
    document.getElementById("autoSave").checked = settings.systemPreferences.autoSave;
    document.getElementById("showWelcomeBanner").checked = settings.systemPreferences.showWelcomeBanner;

    document.getElementById("emailAlerts").checked = settings.notifications.emailAlerts;
    document.getElementById("activityAlerts").checked = settings.notifications.activityAlerts;
    document.getElementById("backupAlerts").checked = settings.notifications.backupAlerts;
  }

  function renderUsers() {
    const userList = document.getElementById("userList");
    const users = DashboardSettings.getSettings().userManagement;

    if (!users.length) {
      userList.innerHTML = `<p>No users added yet.</p>`;
      return;
    }

    userList.innerHTML = users
      .map(
        (user, index) => `
          <div class="user-row">
            <div>
              <strong>${user.name}</strong><br>
              <small>${user.email} - ${user.role}</small>
            </div>
            <button class="danger-btn" onclick="deleteUser(${index})">Delete</button>
          </div>
        `
      )
      .join("");
  }

  function renderRoles() {
    const roles = DashboardSettings.getSettings().rolesPermissions;
    const rolesList = document.getElementById("rolesList");

    rolesList.innerHTML = roles
      .map(
        (item) => `
          <div class="user-row">
            <div>
              <strong>${item.role}</strong><br>
              <small>${item.permissions.join(", ")}</small>
            </div>
          </div>
        `
      )
      .join("");
  }

  function renderLogs() {
    const logs = DashboardSettings.getSettings().activityLogs;
    const activityLogList = document.getElementById("activityLogList");

    if (!logs.length) {
      activityLogList.innerHTML = `<p>No activity logs yet.</p>`;
      return;
    }

    activityLogList.innerHTML = logs
      .map(
        (log) => `
          <div class="user-row">
            <div>
              <strong>${log.action}</strong><br>
              <small>${log.details}</small><br>
              <small>${new Date(log.timestamp).toLocaleString()}</small>
            </div>
          </div>
        `
      )
      .join("");
  }

  function renderAllSections() {
    loadGeneralSettings();
    renderUsers();
    renderRoles();
    renderLogs();
  }

  document.getElementById("generalSettingsForm").addEventListener("submit", function (e) {
    e.preventDefault();

    DashboardSettings.saveSettings({
      systemName: document.getElementById("systemName").value.trim(),
      systemEmail: document.getElementById("systemEmail").value.trim(),
      timezone: document.getElementById("timezone").value,
      dateFormat: document.getElementById("dateFormat").value,
      timeFormat: document.getElementById("timeFormat").value
    });

    DashboardSettings.addActivityLog("Updated General Settings", "System info changed.");
    alert("Settings saved successfully.");
  });

  document.getElementById("resetSettingsBtn").addEventListener("click", function () {
    DashboardSettings.resetSettings();
    DashboardSettings.addActivityLog("Reset Settings", "All settings restored to default.");
    renderAllSections();
    alert("Settings reset successfully.");
  });

  document.getElementById("nightMode").addEventListener("change", function () {
    DashboardSettings.saveSettings({
      nightMode: this.checked
    });
    DashboardSettings.addActivityLog("Night Mode Changed", this.checked ? "Enabled" : "Disabled");
  });

  document.getElementById("autoSave").addEventListener("change", function () {
    DashboardSettings.saveSettings({
      systemPreferences: {
        autoSave: this.checked
      }
    });
  });

  document.getElementById("showWelcomeBanner").addEventListener("change", function () {
    DashboardSettings.saveSettings({
      systemPreferences: {
        showWelcomeBanner: this.checked
      }
    });
  });

  document.getElementById("emailAlerts").addEventListener("change", function () {
    DashboardSettings.saveSettings({
      notifications: {
        emailAlerts: this.checked
      }
    });
  });

  document.getElementById("activityAlerts").addEventListener("change", function () {
    DashboardSettings.saveSettings({
      notifications: {
        activityAlerts: this.checked
      }
    });
  });

  document.getElementById("backupAlerts").addEventListener("change", function () {
    DashboardSettings.saveSettings({
      notifications: {
        backupAlerts: this.checked
      }
    });
  });

  document.querySelectorAll(".theme-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const theme = this.dataset.theme;
      DashboardSettings.saveSettings({ theme });
      DashboardSettings.addActivityLog("Theme Changed", `Theme changed to ${theme}.`);
    });
  });

  document.querySelectorAll(".settings-tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".settings-tab").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".settings-panel").forEach((item) => item.classList.remove("active"));

      this.classList.add("active");
      document.getElementById(`tab-${this.dataset.tab}`).classList.add("active");
    });
  });

  document.getElementById("addUserBtn").addEventListener("click", function () {
    const name = prompt("Enter user name:");
    if (!name) {
      return;
    }

    const email = prompt("Enter user email:");
    if (!email) {
      return;
    }

    const role = prompt("Enter role:");
    if (!role) {
      return;
    }

    const current = DashboardSettings.getSettings();
    current.userManagement.push({ name, email, role });
    DashboardSettings.saveSettings({ userManagement: current.userManagement });
    DashboardSettings.addActivityLog("User Added", `${name} added as ${role}.`);
    renderUsers();
  });

  window.deleteUser = function (index) {
    const current = DashboardSettings.getSettings();
    const removed = current.userManagement[index];

    current.userManagement.splice(index, 1);
    DashboardSettings.saveSettings({ userManagement: current.userManagement });
    DashboardSettings.addActivityLog("User Deleted", `${removed.name} removed.`);
    renderUsers();
  };

  renderAllSections();
});