const defaultAdmins = [
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
  }
];

function getAdmins() {
  const storedAdmins = localStorage.getItem("administrators");

  if (!storedAdmins) {
    localStorage.setItem("administrators", JSON.stringify(defaultAdmins));
    return defaultAdmins;
  }

  return JSON.parse(storedAdmins);
}

function saveAdmins(admins) {
  localStorage.setItem("administrators", JSON.stringify(admins));
}

function openModal(id) {
  document.getElementById(id).classList.add("show");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("show");
}

function formatLoginDateTime() {
  return new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;

  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(async res => {
    const contentType = res.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { error: text || 'Server returned an error' };
    }

    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    return data;
  })
  .then(user => {
    if (user.Role !== role) {
      throw new Error('Role mismatch. Please select the correct role.');
    }
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    window.location.href = "index.html";
  })
  .catch(err => {
    alert(err.message);
  });
});

document.getElementById("forgotPasswordBtn").addEventListener("click", function () {
  openModal("forgotModal");
});

document.getElementById("forgotPasswordForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("forgotUsername").value.trim();
  const reason = document.getElementById("resetReason").value.trim();

  if (!username || !reason) {
    alert("Please enter username and reason.");
    return;
  }

  const requests = JSON.parse(localStorage.getItem("passwordResetRequests")) || [];

  requests.unshift({
    RequestID: "REQ" + Date.now(),
    Username: username,
    Reason: reason,
    Status: "Pending",
    RequestedOn: formatLoginDateTime()
  });

  localStorage.setItem("passwordResetRequests", JSON.stringify(requests));

  closeModal("forgotModal");
  document.getElementById("forgotPasswordForm").reset();
  openModal("forgotSuccessModal");
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

getAdmins();
