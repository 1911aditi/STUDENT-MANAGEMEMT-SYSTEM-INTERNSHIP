// =========================
// Sidebar Toggle
// =========================

const toggleBtn = document.getElementById("toggleSidebar");

if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
        document.querySelector(".sidebar").classList.toggle("collapsed");
    });
}

// =========================
// Live Date & Time
// =========================

function updateDateTime() {
    const now = new Date();

    const dateTime = document.getElementById("currentDateTime");

    if (dateTime) {
        dateTime.textContent = now.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }
}

updateDateTime();
setInterval(updateDateTime, 1000);

// =========================
// Contact Support Popup
// =========================

const modal = document.getElementById("contactModal");
const contactBtn = document.getElementById("contactBtn");
const closeBtn = document.querySelector(".close-btn");
const cancelBtn = document.getElementById("cancelBtn");
const contactForm = document.getElementById("contactForm");

// Open Popup

if (contactBtn && modal) {
    contactBtn.addEventListener("click", () => {
        modal.classList.add("show");
    });
}

// Close Popup

if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
        modal.classList.remove("show");
    });
}

// Cancel Button

if (cancelBtn && modal) {
    cancelBtn.addEventListener("click", () => {
        modal.classList.remove("show");
    });
}

// Click Outside

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.remove("show");
    }
});

// ESC Key

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal) {
        modal.classList.remove("show");
    }
});

// =========================
// Success Popup
// =========================

const successModal = document.getElementById("successModal");
const successOk = document.getElementById("successOk");

// Form Submit

if (contactForm) {

    contactForm.addEventListener("submit", (e) => {

        e.preventDefault();

        // Close Contact Popup
        modal.classList.remove("show");

        // Reset Form
        contactForm.reset();

        // Show Success Popup
        if (successModal) {
            successModal.classList.add("show");
        }

    });

}

// Close Success Popup

if (successOk && successModal) {

    successOk.addEventListener("click", () => {

        successModal.classList.remove("show");

    });

}

// Close Success Popup by clicking outside

window.addEventListener("click", (e) => {

    if (e.target === successModal) {

        successModal.classList.remove("show");

    }

});

// ESC closes Success Popup

document.addEventListener("keydown", (e) => {

    if (e.key === "Escape" && successModal) {

        successModal.classList.remove("show");

    }

});