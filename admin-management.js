let administrators = [];
let filteredAdministrators = [];
let editAdminId = null;
let currentRequestID = "";

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

async function loadAdministrators() {
  try {
    const res = await fetch('/api/admins');
    if (!res.ok) throw new Error('Failed to load administrators.');
    administrators = await res.json();
    filteredAdministrators = [...administrators];
    renderAll();
  } catch (err) {
    console.error(err);
  }
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

document.getElementById("adminForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = getAdminFormData();

  if (!validateAdminForm(formData)) {
    return;
  }

  try {
    if (editAdminId) {
      // Find original admin to preserve password/lastlogin if not modifying
      const originalAdmin = administrators.find((admin) => admin.AdminID === editAdminId);
      const res = await fetch(`/api/admins/${editAdminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...originalAdmin, ...formData })
      });
      if (!res.ok) throw new Error('Failed to update administrator.');
      alert("Administrator updated successfully.");
      editAdminId = null;
    } else {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to add administrator.');
      alert("Administrator added successfully.");
    }

    await loadAdministrators();
    closeModal("adminModal");
    resetAdminForm();
  } catch (err) {
    alert(err.message);
  }
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
function openResetRequest(username, requestID) {

    currentRequestID = requestID;

    const admin = administrators.find(a => a.Username === username);

    if (!admin) {
        alert("Administrator not found.");
        return;
    }

    openResetPassword(admin.AdminID);
}

document.getElementById("resetPasswordForm").addEventListener("submit", async function (e) {
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

  const admin = administrators.find((a) => a.AdminID === adminId);
  if (!admin) {
    alert("Administrator not found.");
    return;
  }

  try {
    const res = await fetch(`/api/admins/${adminId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...admin, Password: newPassword })
    });
    if (!res.ok) throw new Error('Failed to reset password.');

    const requests = getPasswordResetRequests();
    const request = requests.find(r => r.RequestID === currentRequestID);
    if (request) {
      request.Status = "Completed";
      localStorage.setItem("passwordResetRequests", JSON.stringify(requests));
    }

    alert("Password reset successfully.\n\nPlease tell the Administrator the new password personally.");
    renderPasswordRequests();
    closeModal("resetPasswordModal");
    await loadAdministrators();
  } catch (err) {
    alert(err.message);
  }
});

async function toggleAdministratorStatus(adminId) {
  const admin = administrators.find((item) => item.AdminID === adminId);

  if (!admin) {
    alert("Administrator not found.");
    return;
  }

  if (admin.Role === "Super Administrator") {
    alert("Super Administrator account cannot be disabled.");
    return;
  }

  const newStatus = admin.Status === "Active" ? "Inactive" : "Active";
  try {
    const res = await fetch(`/api/admins/${adminId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...admin, Status: newStatus })
    });
    if (!res.ok) throw new Error('Failed to update status.');
    await loadAdministrators();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteAdministrator(adminId) {
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

  try {
    const res = await fetch(`/api/admins/${adminId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete administrator.');
    alert("Administrator deleted successfully.");
    await loadAdministrators();
  } catch (err) {
    alert(err.message);
  }
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
function renderPasswordRequests() {

    const tbody = document.getElementById("passwordRequestTable");

    const requests = getPasswordResetRequests();

    tbody.innerHTML = "";

    requests.forEach(request => {

        tbody.innerHTML += `

        <tr>

            <td>${request.RequestID}</td>
            <td>${request.Username}</td>
            <td>${request.Reason}</td>
            <td>${request.RequestedOn}</td>
            <td>${request.Status}</td>

            <td>

                ${request.Status === "Pending"

                ? `<button class="primary-btn"
                    onclick="openResetRequest('${request.Username}','${request.RequestID}')">

                    Reset Password

                   </button>`

                : "Completed"}

            </td>

        </tr>

        `;

    });

}

async function init() {
  requirePageAccess();

  await loadAdministrators();

  updateDateTime();
  setInterval(updateDateTime, 60000);

  renderPasswordRequests();
}

init();
