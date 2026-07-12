// ----------------------------------------------------
// TREND & STATISTICAL ANALYSIS MODULE FRONTEND CONTROLLER
// ----------------------------------------------------

let yearWiseChart = null;
let appliedSelectedChart = null;
let branchPieChart = null;
let selectionDoughnutChart = null;
let universityBarChart = null;
let collegeRankingChart = null;
let collegePerformanceChart = null;
let paretoChart = null;
let correlationHeatmapChart = null;
let forecastChart = null;

// Initialize Date/Time and page filters on load
async function init() {
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Set administrator details in sidebar
    document.querySelector('.admin-name').textContent = user.username;
    document.querySelector('.admin-role').textContent = user.role === 'superadmin' ? 'Super Administrator' : 'Administrator';

    // Fetch and populate filter options
    await fetchFilterOptions();

    // Load all statistical data and render visual components
    await loadStatisticalDashboard();

    // Bind event listeners
    document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
    document.getElementById('resetFiltersBtn').addEventListener('click', resetFilters);
    document.getElementById('printReportBtn').addEventListener('click', printReport);
    document.getElementById('exportPdfBtn').addEventListener('click', exportPdf);
    document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);
    document.getElementById('toggleSidebar').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('collapsed');
    });
}

function updateDateTime() {
    const now = new Date();
    document.getElementById("currentDateTime").textContent = now.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// 1. Fetch filter items from database and fill selectors
async function fetchFilterOptions() {
    const source = window.getActiveDataSource();
    if (source === "Excel") {
        const students = getExcelData();
        const mockTrends = generateMockTrends(students);
        
        const years = [...new Set(mockTrends.map(r => r.Year))].sort((a,b) => b-a);
        const universities = [...new Set(mockTrends.map(r => r.University))].sort();
        const colleges = [...new Set(mockTrends.map(r => r.College))].sort();
        const branches = [...new Set(mockTrends.map(r => r.Branch))].sort();
        const states = [...new Set(mockTrends.map(r => r.State))].sort();
        const durations = [...new Set(mockTrends.map(r => r.Duration))].sort((a,b) => a-b);

        populateSelector('filterYear', years, 'All Years');
        populateSelector('filterUniversity', universities, 'All Universities');
        populateSelector('filterCollege', colleges, 'All Colleges');
        populateSelector('filterBranch', branches, 'All Branches');
        populateSelector('filterState', states, 'All States');
        populateSelector('filterDuration', durations, 'All Durations');
    } else {
        try {
            const response = await fetch('/api/trends/filters');
            if (!response.ok) throw new Error('Failed to load filter items.');
            const data = await response.json();

            populateSelector('filterYear', data.years, 'All Years');
            populateSelector('filterUniversity', data.universities, 'All Universities');
            populateSelector('filterCollege', data.colleges, 'All Colleges');
            populateSelector('filterBranch', data.branches, 'All Branches');
            populateSelector('filterState', data.states, 'All States');
            populateSelector('filterDuration', data.durations, 'All Durations');
        } catch (err) {
            console.error(err);
        }
    }
}

function populateSelector(id, list, defaultText) {
    const select = document.getElementById(id);
    select.innerHTML = `<option>${defaultText}</option>`;
    list.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item;
        opt.textContent = item;
        select.appendChild(opt);
    });
}

// 2. Fetch all data and update cards, charts, regression, correlations, and forecasts
async function loadStatisticalDashboard() {
    const source = window.getActiveDataSource();
    if (source === "Excel") {
        await loadExcelStatisticalDashboard();
    } else {
        await loadAccessStatisticalDashboard();
    }
}

async function loadExcelStatisticalDashboard() {
    const students = getExcelData();
    const mockTrends = generateMockTrends(students);
    const filteredRows = filterMockTrends(mockTrends);

    // A. Update Metrics Cards
    let totalApplied = 0, totalSelected = 0, totalSeats = 0;
    const uniqueColleges = new Set();
    const uniqueUniversities = new Set();
    filteredRows.forEach(r => {
        totalApplied += r.StudentsApplied;
        totalSelected += r.StudentsSelected;
        totalSeats += r.InternshipSeats;
        if (r.College) uniqueColleges.add(r.College);
        if (r.University) uniqueUniversities.add(r.University);
    });
    const selectionRate = totalApplied === 0 ? 0 : parseFloat(((totalSelected / totalApplied) * 100).toFixed(1));

    document.getElementById('statApplied').textContent = totalApplied;
    document.getElementById('statSelected').textContent = totalSelected;
    document.getElementById('statSeats').textContent = totalSeats;
    document.getElementById('statRate').textContent = selectionRate + '%';
    document.getElementById('statColleges').textContent = `${uniqueColleges.size} (${uniqueUniversities.size} Univ)`;

    // B. Group by Year to build analysis/trend chart inputs
    const yearly = {};
    filteredRows.forEach(r => {
        const yr = r.Year;
        if (!yearly[yr]) {
            yearly[yr] = { 
                year: yr, 
                colleges: new Set(), 
                universities: new Set(), 
                branches: new Set(), 
                seats: 0, 
                applied: 0, 
                selected: 0,
                durationSum: 0,
                durationCount: 0
            };
        }
        if (r.College) yearly[yr].colleges.add(r.College);
        if (r.University) yearly[yr].universities.add(r.University);
        if (r.Branch) yearly[yr].branches.add(r.Branch);
        yearly[yr].seats += r.InternshipSeats || 0;
        yearly[yr].applied += r.StudentsApplied || 0;
        yearly[yr].selected += r.StudentsSelected || 0;
        yearly[yr].durationSum += r.Duration || 0;
        yearly[yr].durationCount++;
    });

    const list = Object.values(yearly).sort((a,b) => a.year - b.year);
    renderTrendVisualizations(filteredRows);

    // C. Update Pearson Correlations
    const Y = list.map(item => item.applied);
    const variables = {
        colleges: list.map(item => item.colleges.size),
        universities: list.map(item => item.universities.size),
        branches: list.map(item => item.branches.size),
        seats: list.map(item => item.seats),
        selectionRate: list.map(item => item.applied === 0 ? 0 : item.selected / item.applied),
        duration: list.map(item => item.durationCount === 0 ? 0 : item.durationSum / item.durationCount),
        year: list.map(item => item.year)
    };

    const correlations = {};
    for (const [key, X] of Object.entries(variables)) {
        correlations[key] = parseFloat(localStatsHelper.calculateCorrelation(X, Y).toFixed(4));
    }

    const interpretations = {};
    for (const [key, val] of Object.entries(correlations)) {
        const absVal = Math.abs(val);
        let strength = 'Weak';
        if (absVal >= 0.7) strength = 'Strong';
        else if (absVal >= 0.4) strength = 'Moderate';
        
        const direction = val >= 0 ? 'positive' : 'negative';
        interpretations[key] = `${strength} ${direction} correlation (${val}).`;
    }
    renderCorrelationModule({ correlations, interpretations });

    // D. Update Linear Regression
    if (list.length < 3) {
        document.getElementById('regressionTableBody').innerHTML = `<tr><td colspan="4" style="color: red; text-align: center;">At least 3 years of historical records are required to perform regression.</td></tr>`;
        document.getElementById('regR2').textContent = '-';
        document.getElementById('regAdjR2').textContent = '-';
        document.getElementById('regError').textContent = '-';
        document.getElementById('regressionImpactsList').innerHTML = '<li>Insufficient years of historical records after filtering to run regression.</li>';
    } else {
        const X_matrix = list.map(item => [
            item.colleges.size,
            item.universities.size,
            item.branches.size,
            item.seats,
            item.applied === 0 ? 0 : item.selected / item.applied,
            item.durationCount === 0 ? 0 : item.durationSum / item.durationCount,
            item.year
        ]);
        const Y_vector = list.map(item => item.applied);
        const result = localStatsHelper.runMultipleRegression(X_matrix, Y_vector);
        if (!result.success) {
            document.getElementById('regressionTableBody').innerHTML = `<tr><td colspan="4" style="color: red; text-align: center;">${result.error || 'Failed to solve regression model.'}</td></tr>`;
        } else {
            const labels = ['Intercept', 'Participating Colleges', 'Universities', 'Branches', 'Internship Seats', 'Selection Rate', 'Internship Duration', 'Year'];
            const impacts = [];
            for (let i = 1; i < result.coefficients.length; i++) {
                const coef = result.coefficients[i];
                const direction = coef >= 0 ? 'increases' : 'decreases';
                impacts.push(`Each additional ${labels[i]} ${direction} the applicants by approximately ${Math.abs(Math.round(coef))} students.`);
            }
            renderRegressionModule({
                coefficients: result.coefficients,
                pValues: result.pValues,
                r2: parseFloat(result.r2.toFixed(4)),
                adjustedR2: parseFloat(result.adjustedR2.toFixed(4)),
                rmse: parseFloat(result.rmse.toFixed(2)),
                mae: parseFloat(result.mae.toFixed(2)),
                impacts,
                labels
            });
        }
    }

    // E. Forecasting Module
    const years = list.map(item => item.year);
    const applicants = list.map(item => item.applied);
    if (years.length < 3) {
        document.getElementById('forecastComparisonBody').innerHTML = `<tr><td colspan="3" style="color: red; text-align: center;">At least 3 years of historical records are required to generate forecasts.</td></tr>`;
        document.getElementById('bestModelBanner').textContent = 'Cannot project forecast.';
        document.getElementById('forecastValuesBody').innerHTML = `<tr><td colspan="5" style="text-align: center;">Choose broader filters to run model.</td></tr>`;
    } else {
        const forecast = localStatsHelper.forecastModels(years, applicants);
        renderForecastingModule(forecast, list);
    }

    // F. Update Report Table
    renderReportTable(filteredRows);
}

async function loadAccessStatisticalDashboard() {
    const query = getFilterQueryParams();

    try {
        // A. Update Metrics Cards
        const statsRes = await fetch(`/api/trends/stats?${query}`);
        if (!statsRes.ok) throw new Error('Error loading metrics stats.');
        const stats = await statsRes.json();
        
        document.getElementById('statApplied').textContent = stats.totalApplied;
        document.getElementById('statSelected').textContent = stats.totalSelected;
        document.getElementById('statSeats').textContent = stats.totalSeats;
        document.getElementById('statRate').textContent = stats.selectionRate + '%';
        document.getElementById('statColleges').textContent = `${stats.collegesCount} (${stats.universitiesCount} Univ)`;

        // B. Fetch Report Data First & Update Graphs & Visuals
        const reportRes = await fetch(`/api/trends/reports?${query}`);
        if (!reportRes.ok) throw new Error('Error loading table report.');
        const reportData = await reportRes.json();
        renderTrendVisualizations(reportData);

        // C. Update Pearson Correlations
        const corrRes = await fetch(`/api/trends/correlation?${query}`);
        if (!corrRes.ok) throw new Error('Error loading correlation data.');
        const correlationData = await corrRes.json();
        renderCorrelationModule(correlationData);

        // D. Update Multiple Linear Regression Model
        const regRes = await fetch(`/api/trends/regression?${query}`);
        if (!regRes.ok) {
            // If regression fails due to insufficient historical records (need >= 3 years)
            const err = await regRes.json();
            document.getElementById('regressionTableBody').innerHTML = `<tr><td colspan="4" style="color: red; text-align: center;">${err.error}</td></tr>`;
            document.getElementById('regR2').textContent = '-';
            document.getElementById('regAdjR2').textContent = '-';
            document.getElementById('regError').textContent = '-';
            document.getElementById('regressionImpactsList').innerHTML = '<li>Insufficient years of historical records after filtering to run regression.</li>';
        } else {
            const regression = await regRes.json();
            renderRegressionModule(regression);
        }

        // E. Update 5-Year Statistical Forecast
        const forecastRes = await fetch(`/api/trends/forecast?${query}`);
        if (!forecastRes.ok) {
            const err = await forecastRes.json();
            document.getElementById('forecastComparisonBody').innerHTML = `<tr><td colspan="3" style="color: red; text-align: center;">${err.error}</td></tr>`;
            document.getElementById('bestModelBanner').textContent = 'Cannot project forecast.';
            document.getElementById('forecastValuesBody').innerHTML = `<tr><td colspan="5" style="text-align: center;">Choose broader filters to run model.</td></tr>`;
        } else {
            const forecast = await forecastRes.json();
            
            const yearly = {};
            reportData.forEach(r => {
                const yr = r.Year;
                if (!yearly[yr]) yearly[yr] = { year: yr, applied: 0 };
                yearly[yr].applied += r.StudentsApplied || 0;
            });
            const historicalList = Object.values(yearly).sort((a,b) => a.year - b.year);
            
            renderForecastingModule(forecast, historicalList);
        }

        // F. Update Report Table list
        renderReportTable(reportData);

    } catch (err) {
        console.error(err);
        alert('Statistics compilation error: ' + err.message);
    }
}

// Helper to gather selected filters
function getFilterQueryParams() {
    const params = new URLSearchParams();
    const yr = document.getElementById('filterYear').value;
    const univ = document.getElementById('filterUniversity').value;
    const coll = document.getElementById('filterCollege').value;
    const branch = document.getElementById('filterBranch').value;
    const state = document.getElementById('filterState').value;
    const dur = document.getElementById('filterDuration').value;

    if (yr && yr !== 'All Years') params.append('year', yr);
    if (univ && univ !== 'All Universities') params.append('university', univ);
    if (coll && coll !== 'All Colleges') params.append('college', coll);
    if (branch && branch !== 'All Branches') params.append('branch', branch);
    if (state && state !== 'All States') params.append('state', state);
    if (dur && dur !== 'All Durations') params.append('duration', dur);

    return params.toString();
}

function applyFilters() {
    loadStatisticalDashboard();
}

function resetFilters() {
    document.getElementById('filterYear').selectedIndex = 0;
    document.getElementById('filterUniversity').selectedIndex = 0;
    document.getElementById('filterCollege').selectedIndex = 0;
    document.getElementById('filterBranch').selectedIndex = 0;
    document.getElementById('filterState').selectedIndex = 0;
    document.getElementById('filterDuration').selectedIndex = 0;
    loadStatisticalDashboard();
}

// 3. Render all Charts using Chart.js
function renderTrendVisualizations(rows) {
    if (!rows || rows.length === 0) return;

    // 1. Group by Year to build Year-wise line chart & bar chart datasets
    const yearly = {};
    rows.forEach(r => {
        const yr = r.Year;
        if (!yearly[yr]) {
            yearly[yr] = { year: yr, applied: 0, selected: 0 };
        }
        yearly[yr].applied += r.StudentsApplied || 0;
        yearly[yr].selected += r.StudentsSelected || 0;
    });
    const sortedYearsList = Object.values(yearly).sort((a,b) => a.year - b.year);
    const years = sortedYearsList.map(item => item.year);
    const applied = sortedYearsList.map(item => item.applied);
    const selected = sortedYearsList.map(item => item.selected);

    // Color definitions
    const blueColor = '#2c67f2';
    const greenColor = '#35c885';
    const purpleColor = '#8b5cf6';
    const orangeColor = '#ffb020';

    // A. Year-wise Line Chart (Applied & Selected)
    if (yearWiseChart) yearWiseChart.destroy();
    yearWiseChart = new Chart(document.getElementById('yearWiseChart'), {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Applied Students',
                    data: applied,
                    borderColor: blueColor,
                    backgroundColor: 'rgba(44, 103, 242, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Selected Students',
                    data: selected,
                    borderColor: greenColor,
                    backgroundColor: 'rgba(53, 200, 133, 0.1)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // B. Applicants vs Selected Bar Chart
    if (appliedSelectedChart) appliedSelectedChart.destroy();
    appliedSelectedChart = new Chart(document.getElementById('appliedSelectedChart'), {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Applied',
                    data: applied,
                    backgroundColor: blueColor,
                    borderRadius: 4
                },
                {
                    label: 'Selected',
                    data: selected,
                    backgroundColor: greenColor,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // C. Branch Distribution Pie Chart
    const branchMap = {};
    rows.forEach(r => {
        const br = r.Branch || "General";
        branchMap[br] = (branchMap[br] || 0) + (r.StudentsApplied || 0);
    });
    const branchList = Object.entries(branchMap).sort((a,b) => b[1] - a[1]);
    const branchLabels = branchList.map(item => item[0]);
    const branchApplied = branchList.map(item => item[1]);

    if (branchPieChart) branchPieChart.destroy();
    branchPieChart = new Chart(document.getElementById('branchPieChart'), {
        type: 'pie',
        data: {
            labels: branchLabels.length ? branchLabels : ['No Data'],
            datasets: [{
                data: branchApplied.length ? branchApplied : [0],
                backgroundColor: [blueColor, '#00d2fc', purpleColor, orangeColor, '#ffeaa7', '#ff6b6b', '#a8e6cf', '#dcedc1', '#ffd3b6', '#ff8b94']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // D. Selection Rate Doughnut
    const totalAppliedSum = applied.reduce((a,b) => a+b, 0);
    const totalSelectedSum = selected.reduce((a,b) => a+b, 0);
    const totalRejected = totalAppliedSum - totalSelectedSum;

    if (selectionDoughnutChart) selectionDoughnutChart.destroy();
    selectionDoughnutChart = new Chart(document.getElementById('selectionDoughnutChart'), {
        type: 'doughnut',
        data: {
            labels: ['Selected', 'Not Selected'],
            datasets: [{
                data: totalAppliedSum > 0 ? [totalSelectedSum, totalRejected] : [0, 1],
                backgroundColor: [greenColor, '#e2e8f0']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // E. University Distribution Chart (Top universities)
    const uniMap = {};
    rows.forEach(r => {
        const uni = r.University || "Unknown";
        uniMap[uni] = (uniMap[uni] || 0) + (r.StudentsApplied || 0);
    });
    const uniList = Object.entries(uniMap).sort((a,b) => b[1] - a[1]);
    const uniLabels = uniList.map(item => item[0]);
    const uniCounts = uniList.map(item => item[1]);

    if (universityBarChart) universityBarChart.destroy();
    universityBarChart = new Chart(document.getElementById('universityBarChart'), {
        type: 'bar',
        data: {
            labels: uniLabels,
            datasets: [{
                label: 'Applicants',
                data: uniCounts,
                backgroundColor: purpleColor,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // F. College Rankings Chart (Top 5)
    const collegeMap = {};
    rows.forEach(r => {
        const coll = r.College || "Unknown";
        collegeMap[coll] = (collegeMap[coll] || 0) + (r.StudentsApplied || 0);
    });
    const collegeList = Object.entries(collegeMap).sort((a,b) => b[1] - a[1]);
    const collegeLabels = collegeList.slice(0, 5).map(item => item[0]);
    const collegeCounts = collegeList.slice(0, 5).map(item => item[1]);

    if (collegeRankingChart) collegeRankingChart.destroy();
    collegeRankingChart = new Chart(document.getElementById('collegeRankingChart'), {
        type: 'bar',
        data: {
            labels: collegeLabels,
            datasets: [{
                label: 'Applicants',
                data: collegeCounts,
                backgroundColor: orangeColor,
                borderRadius: 5
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // F2. College Performance Comparison Chart (Applied vs Selected)
    const collegePerfMap = {};
    rows.forEach(r => {
        const coll = r.College || "Unknown";
        if (!collegePerfMap[coll]) {
            collegePerfMap[coll] = { name: coll, applied: 0, selected: 0 };
        }
        collegePerfMap[coll].applied += r.StudentsApplied || 0;
        collegePerfMap[coll].selected += r.StudentsSelected || 0;
    });
    const collegePerfList = Object.values(collegePerfMap).sort((a,b) => b.applied - a.applied).slice(0, 5);
    const collegePerfLabels = collegePerfList.map(item => item.name);
    const collegePerfApplied = collegePerfList.map(item => item.applied);
    const collegePerfSelected = collegePerfList.map(item => item.selected);

    if (collegePerformanceChart) collegePerformanceChart.destroy();
    collegePerformanceChart = new Chart(document.getElementById('collegePerformanceChart'), {
        type: 'bar',
        data: {
            labels: collegePerfLabels,
            datasets: [
                {
                    label: 'Applied',
                    data: collegePerfApplied,
                    backgroundColor: blueColor,
                    borderRadius: 4
                },
                {
                    label: 'Selected',
                    data: collegePerfSelected,
                    backgroundColor: greenColor,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // G. Pareto Chart for Branches
    const paretoData = branchApplied;
    const totalSum = paretoData.reduce((a,b) => a+b, 0);
    let cumulative = 0;
    const cumulativePercent = paretoData.map(val => {
        cumulative += val;
        return totalSum === 0 ? 0 : parseFloat(((cumulative / totalSum) * 100).toFixed(1));
    });

    if (paretoChart) paretoChart.destroy();
    paretoChart = new Chart(document.getElementById('paretoChart'), {
        type: 'bar',
        data: {
            labels: branchLabels,
            datasets: [
                {
                    type: 'bar',
                    label: 'Branch Applicants',
                    data: paretoData,
                    backgroundColor: blueColor,
                    borderRadius: 4
                },
                {
                    type: 'line',
                    label: 'Cumulative %',
                    data: cumulativePercent,
                    borderColor: '#dc2626',
                    borderWidth: 2,
                    yAxisID: 'y2',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    position: 'left'
                },
                y2: {
                    beginAtZero: true,
                    max: 100,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

// 4. Render Correlation matrix and visual Heatmap
function renderCorrelationModule(corrData) {
    const tableBody = document.getElementById('correlationTableBody');
    tableBody.innerHTML = '';

    const labelMapping = {
        colleges: 'Participating Colleges',
        universities: 'Universities',
        branches: 'Branches',
        seats: 'Internship Seats',
        selectionRate: 'Selection Rate',
        duration: 'Internship Duration',
        year: 'Year'
    };

    const variables = [];
    const values = [];

    for (const [key, val] of Object.entries(corrData.correlations)) {
        const row = document.createElement('tr');
        const absVal = Math.abs(val);
        let strengthClass = 'correlation-weak';
        let strengthText = 'Weak Correlation';

        if (absVal >= 0.7) {
            strengthClass = 'correlation-strong';
            strengthText = 'Strong Correlation';
        } else if (absVal >= 0.4) {
            strengthClass = 'correlation-moderate';
            strengthText = 'Moderate Correlation';
        }

        row.innerHTML = `
            <td>${labelMapping[key]}</td>
            <td style="font-family: monospace; font-weight: bold;">${val.toFixed(4)}</td>
            <td><span class="${strengthClass}" style="padding: 3px 8px; border-radius: 4px; font-size: 12px;">${strengthText}</span></td>
        `;
        tableBody.appendChild(row);

        variables.push(labelMapping[key]);
        values.push(val);
    }

    // Render correlation coefficients heatmap (as color-coded bar chart)
    if (correlationHeatmapChart) correlationHeatmapChart.destroy();
    correlationHeatmapChart = new Chart(document.getElementById('correlationHeatmapChart'), {
        type: 'bar',
        data: {
            labels: variables,
            datasets: [{
                label: 'Correlation Coefficient (r)',
                data: values,
                backgroundColor: values.map(v => v >= 0 ? `rgba(22, 163, 74, ${Math.max(0.2, Math.abs(v))})` : `rgba(220, 38, 38, ${Math.max(0.2, Math.abs(v))})`),
                borderColor: values.map(v => v >= 0 ? '#16a34a' : '#dc2626'),
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    min: -1,
                    max: 1
                }
            }
        }
    });
}

// 5. Render Multiple Linear Regression results
function renderRegressionModule(regression) {
    const tableBody = document.getElementById('regressionTableBody');
    tableBody.innerHTML = '';

    const labels = regression.labels;
    const coefficients = regression.coefficients;
    const pValues = regression.pValues;

    for (let i = 0; i < coefficients.length; i++) {
        const row = document.createElement('tr');
        const pVal = pValues[i];
        let sigClass = 'significance-high';
        let sigText = 'Significant (p < 0.05)';

        if (pVal > 0.05) {
            sigClass = 'significance-low';
            sigText = 'Not Significant';
        }

        row.innerHTML = `
            <td><strong>${labels[i]}</strong> ${i === 0 ? '(β0)' : `(β${i})`}</td>
            <td style="font-family: monospace; font-weight: bold;">${coefficients[i].toFixed(2)}</td>
            <td style="font-family: monospace;">${pVal.toFixed(4)}</td>
            <td><span class="${sigClass}" style="font-size: 13px;">${sigText}</span></td>
        `;
        tableBody.appendChild(row);
    }

    // Populate overall stats
    document.getElementById('regR2').textContent = regression.r2.toFixed(4);
    document.getElementById('regAdjR2').textContent = regression.adjustedR2.toFixed(4);
    document.getElementById('regError').textContent = `RMSE: ${regression.rmse} | MAE: ${regression.mae}`;

    // Poplate impacts list
    const impactsList = document.getElementById('regressionImpactsList');
    impactsList.innerHTML = '';
    regression.impacts.forEach(imp => {
        const li = document.createElement('li');
        li.textContent = imp;
        impactsList.appendChild(li);
    });
}

// 6. Render Forecasting Comparison and Projections Chart
function renderForecastingModule(forecast, historicalList) {
    const compareBody = document.getElementById('forecastComparisonBody');
    compareBody.innerHTML = '';

    const rmse = forecast.rmse;
    const best = forecast.bestModel;

    const models = {
        linear: 'Linear Regression',
        poly: 'Polynomial Regression (2nd Order)',
        exp: 'Exponential Growth',
        logistic: 'Logistic Growth'
    };

    for (const [key, val] of Object.entries(rmse)) {
        const row = document.createElement('tr');
        if (key === best) {
            row.className = 'best-model-active';
        }
        row.innerHTML = `
            <td>${models[key]}</td>
            <td style="font-family: monospace; font-weight: bold;">${val.toFixed(2)}</td>
            <td>${key === best ? '<span class="status-live" style="background-color: #22c55e; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px;">Best Accuracy</span>' : '<span style="color: #6b7280; font-size: 12px;">Candidate</span>'}</td>
        `;
        compareBody.appendChild(row);
    }

    // Set best model banner
    document.getElementById('bestModelBanner').textContent = `Optimal Forecasting Model selected: ${models[best]} (RMSE: ${rmse[best].toFixed(2)})`;

    // Projections table
    const valuesBody = document.getElementById('forecastValuesBody');
    valuesBody.innerHTML = '';

    const pred = forecast.predictions;
    for (let i = 0; i < pred.years.length; i++) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${pred.years[i]}</strong></td>
            <td>${pred.linear[i]}</td>
            <td>${pred.poly[i]}</td>
            <td>${pred.exp[i]}</td>
            <td>${pred.logistic[i]}</td>
        `;
        valuesBody.appendChild(row);
    }

    // Draw forecast projection line chart
    const histYears = historicalList.map(h => h.year);
    const histApplied = historicalList.map(h => h.applied);

    const labels = [...histYears, ...pred.years];

    // Build prediction lines padded with nulls so they align after historical line
    const padding = Array(histYears.length).fill(null);
    // Connect the last historical point with the first forecast point
    const lastHist = histApplied[histApplied.length - 1];

    if (forecastChart) forecastChart.destroy();
    forecastChart = new Chart(document.getElementById('forecastChart'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Historical Actual',
                    data: [...histApplied, ...Array(pred.years.length).fill(null)],
                    borderColor: '#4b5563',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'Linear Model',
                    data: [...padding.slice(0, padding.length - 1), lastHist, ...pred.linear],
                    borderColor: '#2c67f2',
                    borderDash: [5, 5],
                    fill: false
                },
                {
                    label: 'Polynomial Model',
                    data: [...padding.slice(0, padding.length - 1), lastHist, ...pred.poly],
                    borderColor: '#8b5cf6',
                    borderDash: [5, 5],
                    fill: false
                },
                {
                    label: 'Exponential Model',
                    data: [...padding.slice(0, padding.length - 1), lastHist, ...pred.exp],
                    borderColor: '#ff9f43',
                    borderDash: [5, 5],
                    fill: false
                },
                {
                    label: 'Logistic Model',
                    data: [...padding.slice(0, padding.length - 1), lastHist, ...pred.logistic],
                    borderColor: '#10b981',
                    borderDash: [5, 5],
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// 7. Render reports table
function renderReportTable(rows) {
    const tableBody = document.getElementById('reportTableBody');
    tableBody.innerHTML = '';

    rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.Year}</td>
            <td>${r.University}</td>
            <td>${r.College}</td>
            <td>${r.Branch}</td>
            <td>${r.StudentsApplied}</td>
            <td>${r.StudentsSelected}</td>
            <td>${r.InternshipSeats}</td>
            <td>${r.Duration}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// 8. Export to Excel using XLSX
function exportToExcel() {
    const table = document.getElementById('reportTable');
    if (!table) return;

    const wb = XLSX.utils.table_to_book(table, { sheet: "Trend Analysis Report" });
    XLSX.writeFile(wb, "Trend_Analysis_Report.xlsx");
}

// 9. Export to PDF (standard web print-to-pdf shortcut)
function exportPdf() {
    window.print();
}

function printReport() {
    window.print();
}

// ----------------------------------------------------
// EXCEL TRENDS SIMULATOR & CLIENT STATS RESOLVERS
// ----------------------------------------------------

function generateMockTrends(students) {
    if (!students || students.length === 0) return [];
    
    // Convert students into base trend records
    const baseRecords = students.map((s, idx) => {
        return {
            TrendID: "TRD" + idx,
            Year: 2026,
            University: s.university || "KIIT",
            College: s.college || "Unknown College",
            Branch: s.branch || s.department || "General",
            StudentsApplied: 1,
            StudentsSelected: 1,
            InternshipSeats: 1,
            Duration: 3,
            InternshipMonth: "June",
            Gender: s.gender || "Male",
            State: s.state || "Odisha"
        };
    });

    const mockTrends = [];
    // Add 2024, 2025, 2026 records
    [2024, 2025, 2026].forEach(yr => {
        const groups = {};
        baseRecords.forEach(r => {
            const key = `${r.College}_${r.Branch}_${r.Gender}_${r.State}`;
            if (!groups[key]) {
                groups[key] = { ...r, Year: yr, StudentsApplied: 0, StudentsSelected: 0, InternshipSeats: 0, Duration: 3 };
            }
            groups[key].StudentsApplied++;
            groups[key].StudentsSelected++;
        });

        const scale = yr === 2024 ? 0.75 : (yr === 2025 ? 0.88 : 1.0);
        Object.values(groups).forEach((g, idx) => {
            g.StudentsApplied = Math.round(g.StudentsApplied * scale) || 1;
            g.StudentsSelected = Math.round(g.StudentsSelected * scale * (0.8 + Math.random() * 0.15)) || 1;
            if (g.StudentsSelected > g.StudentsApplied) g.StudentsSelected = g.StudentsApplied;
            g.InternshipSeats = Math.round(g.StudentsApplied * 1.25) || 1;
            g.Duration = Math.round(3 + Math.random() * 3);
            g.TrendID = `TRD_${yr}_${idx}`;
            mockTrends.push(g);
        });
    });

    return mockTrends;
}

function filterMockTrends(rows) {
    const yr = document.getElementById('filterYear').value;
    const univ = document.getElementById('filterUniversity').value;
    const coll = document.getElementById('filterCollege').value;
    const branch = document.getElementById('filterBranch').value;
    const state = document.getElementById('filterState').value;
    const dur = document.getElementById('filterDuration').value;

    return rows.filter(r => {
        if (yr && yr !== 'All Years' && String(r.Year) !== yr) return false;
        if (univ && univ !== 'All Universities' && r.University !== univ) return false;
        if (coll && coll !== 'All Colleges' && r.College !== coll) return false;
        if (branch && branch !== 'All Branches' && r.Branch !== branch) return false;
        if (state && state !== 'All States' && r.State !== state) return false;
        if (dur && dur !== 'All Durations' && String(r.Duration) !== dur) return false;
        return true;
    });
}

const localStatsHelper = {
    transpose: function(A) {
        const rows = A.length, cols = A[0].length;
        const AT = [];
        for (let j = 0; j < cols; j++) {
            AT[j] = [];
            for (let i = 0; i < rows; i++) {
                AT[j][i] = A[i][j];
            }
        }
        return AT;
    },

    multiply: function(A, B) {
        const rA = A.length, cA = A[0].length, cB = B[0].length;
        const C = [];
        for (let i = 0; i < rA; i++) {
            C[i] = [];
            for (let j = 0; j < cB; j++) {
                let sum = 0;
                for (let k = 0; k < cA; k++) {
                    sum += A[i][k] * B[k][j];
                }
                C[i][j] = sum;
            }
        }
        return C;
    },

    invert: function(M) {
        const n = M.length;
        const A = [];
        for (let i = 0; i < n; i++) {
            A[i] = [];
            for (let j = 0; j < n; j++) A[i][j] = M[i][j];
            for (let j = 0; j < n; j++) A[i][j + n] = (i === j) ? 1 : 0;
        }

        for (let i = 0; i < n; i++) {
            let maxRow = i;
            for (let r = i + 1; r < n; r++) {
                if (Math.abs(A[r][i]) > Math.abs(A[maxRow][i])) maxRow = r;
            }

            const temp = A[i];
            A[i] = A[maxRow];
            A[maxRow] = temp;

            const pivot = A[i][i];
            if (Math.abs(pivot) < 1e-10) {
                throw new Error('Matrix is singular and cannot be inverted.');
            }

            for (let j = 0; j < 2 * n; j++) A[i][j] /= pivot;

            for (let r = 0; r < n; r++) {
                if (r !== i) {
                    const factor = A[r][i];
                    for (let j = 0; j < 2 * n; j++) {
                        A[r][j] -= factor * A[i][j];
                    }
                }
            }
        }

        const inv = [];
        for (let i = 0; i < n; i++) {
            inv[i] = A[i].slice(n);
        }
        return inv;
    },

    calculateCorrelation: function(X, Y) {
        const n = X.length;
        if (n === 0) return 0;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        for (let i = 0; i < n; i++) {
            sumX += X[i];
            sumY += Y[i];
            sumXY += X[i] * Y[i];
            sumX2 += X[i] * X[i];
            sumY2 += Y[i] * Y[i];
        }
        const num = n * sumXY - sumX * sumY;
        const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        return den === 0 ? 0 : num / den;
    },

    getPValue: function(t, df) {
        const absT = Math.abs(t);
        const tStat = absT;
        const lpt = 1 / (1 + 0.2316419 * tStat);
        const d = 0.3989423 * Math.exp(-tStat * tStat / 2);
        let prob = 1.0 - d * lpt * (0.3193815 + lpt * (-0.3565638 + lpt * (1.781478 + lpt * (-1.821256 + lpt * 1.330274))));
        
        let twoTail = 2.0 * (1.0 - prob);
        if (twoTail > 1.0) twoTail = 1.0;
        if (twoTail < 0.0001) twoTail = 0.0001;
        return parseFloat(twoTail.toFixed(4));
    },

    runMultipleRegression: function(X_matrix, Y_vector) {
        const N = X_matrix.length;
        const k = X_matrix[0].length;
        
        const X = [];
        for (let i = 0; i < N; i++) {
            X[i] = [1, ...X_matrix[i]];
        }
        const Y = Y_vector.map(y => [y]);

        try {
            const XT = this.transpose(X);
            const XTX = this.multiply(XT, X);
            
            const lambda = 1e-4;
            for (let i = 0; i < XTX.length; i++) {
                XTX[i][i] += lambda;
            }

            const XTX_inv = this.invert(XTX);
            const XTY = this.multiply(XT, Y);
            const beta = this.multiply(XTX_inv, XTY);

            const coefficients = beta.map(b => b[0]);

            let sumY = 0;
            for (let i = 0; i < N; i++) sumY += Y_vector[i];
            const meanY = sumY / N;

            let rss = 0;
            let tss = 0;
            let maeSum = 0;
            const Y_fitted = [];

            for (let i = 0; i < N; i++) {
                let fitted = coefficients[0];
                for (let j = 1; j <= k; j++) {
                    fitted += coefficients[j] * X_matrix[i][j - 1];
                }
                Y_fitted.push(fitted);
                
                const residual = Y_vector[i] - fitted;
                rss += residual * residual;
                tss += (Y_vector[i] - meanY) * (Y_vector[i] - meanY);
                maeSum += Math.abs(residual);
            }

            const df_res = N - k - 1;
            const s2 = df_res > 0 ? rss / df_res : 0;

            const se = [];
            const t_stats = [];
            const p_values = [];

            for (let j = 0; j <= k; j++) {
                const var_beta_j = s2 * XTX_inv[j][j];
                const se_j = Math.sqrt(var_beta_j);
                se.push(se_j);

                const t_j = se_j === 0 ? 0 : coefficients[j] / se_j;
                t_stats.push(t_j);

                const p_j = df_res > 0 ? this.getPValue(t_j, df_res) : 0.05;
                p_values.push(p_j);
            }

            const r2 = tss === 0 ? 1 : 1 - (rss / tss);
            const adj_r2 = df_res > 0 && N > 1 ? 1 - ((1 - r2) * (N - 1) / df_res) : r2;
            const rmse = Math.sqrt(rss / N);
            const mae = maeSum / N;

            return {
                success: true,
                coefficients,
                standardErrors: se,
                tStatistics: t_stats,
                pValues: p_values,
                r2,
                adjustedR2: adj_r2,
                rmse,
                mae
            };
        } catch (err) {
            console.error('OLS Regression Error:', err);
            return {
                success: false,
                error: err.message
            };
        }
    },

    forecastModels: function(years, applicants) {
        const N = years.length;
        
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (let i = 0; i < N; i++) {
            sumX += years[i];
            sumY += applicants[i];
            sumXY += years[i] * applicants[i];
            sumX2 += years[i] * years[i];
        }
        const b_linear = (N * sumXY - sumX * sumY) / (N * sumX2 - sumX * sumX);
        const a_linear = (sumY - b_linear * sumX) / N;

        let a_poly = 0, b_poly = 0, c_poly = 0;
        try {
            const X_poly = years.map(yr => [1, yr, yr * yr]);
            const Y_poly = applicants.map(y => [y]);
            const XPT = this.transpose(X_poly);
            const XPX = this.multiply(XPT, X_poly);
            const XPX_inv = this.invert(XPX);
            const XPY = this.multiply(XPT, Y_poly);
            const beta_poly = this.multiply(XPX_inv, XPY);
            a_poly = beta_poly[0][0];
            b_poly = beta_poly[1][0];
            c_poly = beta_poly[2][0];
        } catch (e) {
            a_poly = a_linear; b_poly = b_linear;
        }

        let a_exp = 0, b_exp = 0;
        let sumLnY = 0, sumXLnY = 0;
        for (let i = 0; i < N; i++) {
            const lnY = Math.log(applicants[i] || 1);
            sumLnY += lnY;
            sumXLnY += years[i] * lnY;
        }
        const b_exp_calc = (N * sumXLnY - sumX * sumLnY) / (N * sumX2 - sumX * sumX);
        const a_ln_a = (sumLnY - b_exp_calc * sumX) / N;
        a_exp = Math.exp(a_ln_a);
        b_exp = b_exp_calc;

        const L = 1.5 * Math.max(...applicants);
        let a_log = 0, b_log = 0;
        let sumTransY = 0, sumXTransY = 0;
        for (let i = 0; i < N; i++) {
            const ratio = (L - applicants[i]) / (applicants[i] || 1);
            const transY = Math.log(ratio > 0 ? ratio : 0.01);
            sumTransY += transY;
            sumXTransY += years[i] * transY;
        }
        const k_log_calc = (N * sumXTransY - sumX * sumTransY) / (N * sumX2 - sumX * sumX);
        const a_log_calc = (sumTransY - k_log_calc * sumX) / N;
        a_log = a_log_calc;
        b_log = k_log_calc;

        const errors = { linear: 0, poly: 0, exp: 0, logistic: 0 };
        for (let i = 0; i < N; i++) {
            const yr = years[i];
            const actual = applicants[i];

            const f_lin = a_linear + b_linear * yr;
            const f_poly = a_poly + b_poly * yr + c_poly * yr * yr;
            const f_exp = a_exp * Math.exp(b_exp * yr);
            const f_log = L / (1 + Math.exp(a_log + b_log * yr));

            errors.linear += (f_lin - actual) * (f_lin - actual);
            errors.poly += (f_poly - actual) * (f_poly - actual);
            errors.exp += (f_exp - actual) * (f_exp - actual);
            errors.logistic += (f_log - actual) * (f_log - actual);
        }

        const rmse = {
            linear: Math.sqrt(errors.linear / N),
            poly: Math.sqrt(errors.poly / N),
            exp: Math.sqrt(errors.exp / N),
            logistic: Math.sqrt(errors.logistic / N)
        };

        let bestModel = 'linear';
        let minRmse = rmse.linear;
        for (const model of ['poly', 'exp', 'logistic']) {
            if (rmse[model] < minRmse) {
                minRmse = rmse[model];
                bestModel = model;
            }
        }

        const forecastYears = [2027, 2028, 2029, 2030, 2031];
        const predictions = {
            years: forecastYears,
            linear: forecastYears.map(yr => Math.round(a_linear + b_linear * yr)),
            poly: forecastYears.map(yr => Math.round(a_poly + b_poly * yr + c_poly * yr * yr)),
            exp: forecastYears.map(yr => Math.round(a_exp * Math.exp(b_exp * yr))),
            logistic: forecastYears.map(yr => Math.round(L / (1 + Math.exp(a_log + b_log * yr))))
        };

        return {
            rmse,
            bestModel: bestModel.charAt(0).toUpperCase() + bestModel.slice(1),
            predictions
        };
    }
};

// Start execution
document.addEventListener("DOMContentLoaded", init);
