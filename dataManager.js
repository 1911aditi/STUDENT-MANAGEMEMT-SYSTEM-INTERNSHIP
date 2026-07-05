const STORAGE_KEY = "studentManagementExcelData";

function saveExcelData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getExcelData() {
    // Return active students database if it exists to keep other pages synchronized
    const active = localStorage.getItem("studentManagementData");
    if (active) {
        try {
            return JSON.parse(active);
        } catch (e) {
            console.error("Invalid stored active student data", e);
        }
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error("Invalid stored Excel data", e);
        return [];
    }
}

function clearExcelData() {
    localStorage.removeItem(STORAGE_KEY);
}

function hasExcelData() {
    return getExcelData().length > 0;
}