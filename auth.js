function getLoggedInUser() {
  return JSON.parse(localStorage.getItem("loggedInUser"));
}

function requireLogin() {
  const user = getLoggedInUser();

  if (!user) {
    window.location.href = "login.html";
    return null;
  }

  return user;
}

function requireSuperAdmin() {
  const user = requireLogin();

  if (!user) {
    return null;
  }

  if (user.Role !== "Super Administrator") {
    alert("Access denied. Only Super Administrator can access this page.");
    window.location.href = "index.html";
    return null;
  }

  return user;
}

function logout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "login.html";
}

function applyRoleBasedUI() {
  const user = getLoggedInUser();

  if (!user) {
    return;
  }


  const adminName = document.querySelector(".admin-name");
  const adminRole = document.querySelector(".admin-role");

  if (adminName) {
    adminName.textContent = user.FullName;
  }

  if (adminRole) {
    adminRole.textContent = user.Role;
  }
}

function initAuth() {
  requireLogin();
  applyRoleBasedUI();
}

document.addEventListener("DOMContentLoaded", initAuth);
