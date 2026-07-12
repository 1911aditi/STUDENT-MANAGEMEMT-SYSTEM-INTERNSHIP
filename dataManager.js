const STORAGE_KEY = "studentManagementExcelData";

function saveExcelData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getExcelData() {
    try {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "/api/students", false); // Synchronous
        xhr.send(null);
        if (xhr.status === 200) {
            return JSON.parse(xhr.responseText);
        }
    } catch (err) {
        console.error("Error fetching getExcelData synchronously:", err);
    }
    return [];
}

function clearExcelData() {
    localStorage.removeItem(STORAGE_KEY);
}

function hasExcelData() {
    return getExcelData().length > 0;
}