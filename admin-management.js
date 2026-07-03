let administrators = [];
let filteredAdministrators = [];
let editAdminId = null;

const defaultAdministrators = [
  {
    AdminID: "ADM001",
    FullName: "Super Administrator",
    Username: "superadmin",
    Password: "super123",
    Email: "superadmin@college.local",
    Phone: "9876543210",
    Role: "Super Administrator",
    Status: "Active",
    LastLogin: "-"
  },
  {
    AdminID: "ADM002",
    FullName: "Admin User",
    Username: "admin1",
    Password: "admin123",
    Email: "admin1@college.local",
    Phone: "9876500001",
    Role: "Administrator",
    Status: "Active",
    LastLogin: "-"
  },
  {
    AdminID: "ADM003",
    FullName: "College Admin",
    Username: "admin2",
    Password: "admin234",
    Email: "admin2@college.local",
    Phone: "9876500002",
    Role: "Administrator",
    Status: "Inactive",
    LastLogin: "-"
  }
];

function requirePageAccess() {

    const user = getLoggedInUser();

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    if (user.Role !== "Super Administrator") {

        alert("Access Denied!\n\nOnly Super Administrator can access this page.");

        window.location.replace("index.html");

        return;
    }

}

function getAdministrators() {
  const storedAdmins = localStorage.getItem("administrators");

  if (!storedAdmins) {
    localStorage.setItem("administrators", JSON.stringify(defaultAdministrators));
    return [...defaultAdministrators];
  }

  return JSON.parse(storedAdmins);
}

function saveAdministrators() {
  localStorage.setItem("administrators", JSON.stringify(administrators));
}

function getPasswordResetRequests() {
  return JSON.parse(localStorage.getItem("passwordResetRequests")) || [];
}

function formatDateTime() {
  return new Date().toLocaleString("en-IN", {
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

function generateAdminId() {
  let max = 0;

  administrators.forEach((admin) => {
    const number = parseInt(admin.AdminID.replace("ADM", ""), 10);

    if (number > max) {
      max = number;
    }
  });

  return "ADM" + String(max + 1).padStart(3, "0");
}

function renderStats() {
  const totalAdmins = administrators.length;
  const activeAdmins = administrators.filter((admin) => admin.Status === "Active").length;
  const disabledAdmins = administrators.filter((admin) => admin.Status === "Inactive").length;
  const resetRequests = getPasswordResetRequests().filter((request) => request.Status === "Pending").length;

  document.getElementById("totalAdmins").textContent = totalAdmins;
  document.getElementById("activeAdmins").textContent = activeAdmins;
  document.getElementById("disabledAdmins").textContent = disabledAdmins;
  document.getElementById("resetRequests").textContent = resetRequests;
}

function getStatusBadge(status) {
  const statusClass = status === "Active" ? "status-active" : "status-inactive";
  return `<span class="status-badge ${statusClass}">${status}</span>`;
}

function renderAdminTable(data = filteredAdministrators) {
  const tbody = document.getElementById("adminTableBody");
  tbody.innerHTML = "";

  data.forEach((admin) => {
    const isSuperAdmin = admin.Role === "Super Administrator";
    const toggleText = admin.Status === "Active" ? "Disable" : "Enable";
    const toggleClass = admin.Status === "Active" ? "disable-btn" : "enable-btn";

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${admin.AdminID}</td>
      <td>${admin.FullName}</td>
      <td>${admin.Username}</td>
      <td>${admin.Email || "-"}</td>
      <td>${admin.Phone || "-"}</td>
      <td>${admin.Role}</td>
      <td>${getStatusBadge(admin.Status)}</td>
      <td>${admin.LastLogin || "-"}</td>
      <td>
        <div class="admin-action-cell">
          <button class="table-action-btn edit-btn" title="Edit" onclick="editAdministrator('${admin.AdminID}')">✎</button>
          <button class="table-action-btn reset-btn" title="Reset Password" onclick="openResetPassword('${admin.AdminID}')" ${isSuperAdmin ? "disabled" : ""}>🔐</button>
          <button class="table-action-btn ${toggleClass}" title="${toggleText}" onclick="toggleAdministratorStatus('${admin.AdminID}')" ${isSuperAdmin ? "disabled" : ""}>${admin.Status === "Active" ? "⛔" : "✓"}</button>
          <button class="table-action-btn delete-btn" title="Delete" onclick="deleteAdministrator('${admin.AdminID}')" ${isSuperAdmin ? "disabled" : ""}>🗑</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  document.getElementById("tableInfo").textContent =
    `Showing ${data.length} of ${data.length} entries`;
}

function openModal(id) {
  document.getElementById(id).classList.add("show");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("show");
}

function resetAdminForm() {
  document.getElementById("adminForm").reset();
  document.getElementById("adminId").value = "";
  document.getElementById("adminModalTitle").textContent = "Add Administrator";
  document.getElementById("adminUsername").disabled = false;

  document.querySelectorAll(".password-field").forEach((field) => {
    field.style.display = "flex";
  });

  editAdminId = null;
  document.getElementById("adminRole").innerHTML =
    `<option value="Administrator">Administrator</option>`;
     document.getElementById("adminRole").disabled = false;

}

function getAdminFormData() {
  return {
    AdminID: document.getElementById("adminId").value || generateAdminId(),
    FullName: document.getElementById("fullName").value.trim(),
    Username: document.getElementById("adminUsername").value.trim(),
    Password: document.getElementById("adminPassword").value.trim(),
    ConfirmPassword: document.getElementById("confirmPassword").value.trim(),
    Email: document.getElementById("adminEmail").value.trim(),
    Phone: document.getElementById("adminPhone").value.trim(),
    Role: document.getElementById("adminRole").value,
    Status: document.getElementById("adminStatus").value,
    LastLogin: "-"
  };
}

function validateAdminForm(admin) {
  if (!admin.FullName || !admin.Username || !admin.Role || !admin.Status) {
    alert("Please fill all required fields.");
    return false;
  }

  if (!editAdminId && (!admin.Password || !admin.ConfirmPassword)) {
    alert("Please enter password and confirm password.");
    return false;
  }

  if (!editAdminId && admin.Password !== admin.ConfirmPassword) {
    alert("Password and confirm password do not match.");
    return false;
  }

  const usernameExists = administrators.some((item) => {
    return item.Username === admin.Username && item.AdminID !== editAdminId;
  });

  if (usernameExists) {
    alert("Username already exists.");
    return false;
  }

  return true;
}

document.getElementById("addAdminBtn").addEventListener("click", function () {
  resetAdminForm();
  openModal("adminModal");
});

document.getElementById("adminForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const formData = getAdminFormData();

  if (!validateAdminForm(formData)) {
    return;
  }

  if (editAdminId) {
    const index = administrators.findIndex((admin) => admin.AdminID === editAdminId);

    if (index === -1) {
      alert("Administrator not found.");
      return;
    }

    const existingPassword = administrators[index].Password;
    const existingLastLogin = administrators[index].LastLogin;

    administrators[index] = {
      AdminID: formData.AdminID,
      FullName: formData.FullName,
      Username: formData.Username,
      Password: existingPassword,
      Email: formData.Email,
      Phone: formData.Phone,
      Role: formData.Role,
      Status: formData.Status,
      LastLogin: existingLastLogin
    };

    alert("Administrator updated successfully.");
  } else {
    administrators.push({
      AdminID: formData.AdminID,
      FullName: formData.FullName,
      Username: formData.Username,
      Password: formData.Password,
      Email: formData.Email,
      Phone: formData.Phone,
      Role: formData.Role,
      Status: formData.Status,
      LastLogin: "-"
    });

    alert("Administrator added successfully.");
  }

  saveAdministrators();
  filteredAdministrators = [...administrators];
  renderAll();
  closeModal("adminModal");
  resetAdminForm();
});

function editAdministrator(adminId) {
  const admin = administrators.find((item) => item.AdminID === adminId);

  if (!admin) {
    alert("Administrator not found.");
    return;
  }

  editAdminId = admin.AdminID;

  document.getElementById("adminModalTitle").textContent = "Edit Administrator";
  document.getElementById("adminId").value = admin.AdminID;
  document.getElementById("fullName").value = admin.FullName;
  document.getElementById("adminUsername").value = admin.Username;
  document.getElementById("adminEmail").value = admin.Email;
  document.getElementById("adminPhone").value = admin.Phone;
  if (admin.Role === "Super Administrator") {
  document.getElementById("adminRole").innerHTML =
    `<option value="Super Administrator">Super Administrator</option>`;
  document.getElementById("adminRole").disabled = true;
} else {
  document.getElementById("adminRole").innerHTML =
    `<option value="Administrator">Administrator</option>`;
  document.getElementById("adminRole").disabled = false;
}

document.getElementById("adminRole").value = admin.Role;

  document.getElementById("adminStatus").value = admin.Status;

  document.getElementById("adminUsername").disabled = admin.Role === "Super Administrator";

  document.querySelectorAll(".password-field").forEach((field) => {
    field.style.display = "none";
  });

  openModal("adminModal");
}

function openResetPassword(adminId) {
  const admin = administrators.find((item) => item.AdminID === adminId);

  if (!admin) {
    alert("Administrator not found.");
    return;
  }

  if (admin.Role === "Super Administrator") {
    alert("Super Administrator password cannot be reset from this page.");
    return;
  }

  document.getElementById("resetAdminId").value = admin.AdminID;
  document.getElementById("resetAdminName").value = admin.FullName;
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmNewPassword").value = "";

  openModal("resetPasswordModal");
}

document.getElementById("resetPasswordForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const adminId = document.getElementById("resetAdminId").value;
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmNewPassword = document.getElementById("confirmNewPassword").value.trim();

  if (!newPassword || !confirmNewPassword) {
    alert("Please enter and confirm new password.");
    return;
  }

  if (newPassword !== confirmNewPassword) {
    alert("New password and confirm password do not match.");
    return;
  }

  const index = administrators.findIndex((admin) => admin.AdminID === adminId);

  if (index === -1) {
    alert("Administrator not found.");
    return;
  }

  administrators[index].Password = newPassword;
  saveAdministrators();

  alert("Password reset successfully.");
  closeModal("resetPasswordModal");
});

function toggleAdministratorStatus(adminId) {
  const admin = administrators.find((item) => item.AdminID === adminId);

  if (!admin) {
    alert("Administrator not found.");
    return;
  }

  if (admin.Role === "Super Administrator") {
    alert("Super Administrator account cannot be disabled.");
    return;
  }

  admin.Status = admin.Status === "Active" ? "Inactive" : "Active";

  saveAdministrators();
  filteredAdministrators = [...administrators];
  renderAll();
}

function deleteAdministrator(adminId) {
  const admin = administrators.find((item) => item.AdminID === adminId);

  if (!admin) {
    alert("Administrator not found.");
    return;
  }

  if (admin.Role === "Super Administrator") {
    alert("Super Administrator cannot be deleted.");
    return;
  }

  const confirmed = confirm("Are you sure you want to delete this administrator?");

  if (!confirmed) {
    return;
  }

  administrators = administrators.filter((item) => item.AdminID !== adminId);
  filteredAdministrators = [...administrators];

  saveAdministrators();
  renderAll();
}

document.getElementById("adminSearchForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("searchName").value.trim().toLowerCase();
  const username = document.getElementById("searchUsername").value.trim().toLowerCase();
  const status = document.getElementById("searchStatus").value;

  filteredAdministrators = administrators.filter((admin) => {
    const matchName = !name || admin.FullName.toLowerCase().includes(name);
    const matchUsername = !username || admin.Username.toLowerCase().includes(username);
    const matchStatus = !status || admin.Status === status;

    return matchName && matchUsername && matchStatus;
  });

  renderAdminTable(filteredAdministrators);
});

document.getElementById("resetSearch").addEventListener("click", function () {
  document.getElementById("adminSearchForm").reset();
  filteredAdministrators = [...administrators];
  renderAdminTable(filteredAdministrators);
});

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", function () {
    closeModal(this.dataset.close);
  });
});

window.addEventListener("click", function (e) {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("show");
  }
});

document.getElementById("toggleSidebar").addEventListener("click", function () {
  document.querySelector(".sidebar").classList.toggle("collapsed");
});

function renderAll() {
  renderStats();
  renderAdminTable(filteredAdministrators);
}

function init() {
  requirePageAccess();

  administrators = getAdministrators();

  const superAdmins = administrators.filter((admin) => admin.Role === "Super Administrator");

  if (superAdmins.length === 0) {
    administrators.unshift(defaultAdministrators[0]);
    saveAdministrators();
  }

  filteredAdministrators = [...administrators];

  updateDateTime();
  setInterval(updateDateTime, 60000);

  renderAll();
}

init();
