// ------------------------------
// Students by College (Doughnut)
// ------------------------------

const collegeChart = new Chart(document.getElementById("collegeChart"), {

    type: "doughnut",

    data: {

        labels: [
            "ABC College",
            "XYZ College",
            "PQR College",
            "LMN College"
        ],

        datasets: [{

            data: [650, 520, 430, 320],

            backgroundColor: [
                "#4e73df",
                "#1cc88a",
                "#f6c23e",
                "#e74a3b"
            ]

        }]

    },

    options: {

        responsive: true,

        plugins: {

            legend: {

                position: "bottom"

            }

        }

    }

});



// ------------------------------
// Students Under Guide (Bar)
// ------------------------------

const guideChart = new Chart(document.getElementById("guideChart"), {

    type: "bar",

    data: {

        labels: [

            "Dr Sharma",
            "Dr Khan",
            "Dr Verma",
            "Dr Das",
            "Dr Singh"

        ],

        datasets: [{

            label: "Students",

            data: [120, 95, 75, 60, 40],

            backgroundColor: "#4e73df"

        }]

    },

    options: {

        responsive: true,

        scales: {

            y: {

                beginAtZero: true

            }

        }

    }

});




// ------------------------------
// Department Wise (Horizontal)
// ------------------------------

const deptChart = new Chart(document.getElementById("deptChart"), {

    type: "bar",

    data: {

        labels: [

            "CSE",
            "ECE",
            "EEE",
            "Mechanical",
            "Civil"

        ],

        datasets: [{

            label: "Students",

            data: [600, 450, 350, 300, 250],

            backgroundColor: [

                "#4e73df",
                "#1cc88a",
                "#36b9cc",
                "#f6c23e",
                "#e74a3b"

            ]

        }]

    },

    options: {

        indexAxis: "y",

        responsive: true,

        scales: {

            x: {

                beginAtZero: true

            }

        }

    }

});




// ------------------------------
// Students by Year (Pie)
// ------------------------------

const yearChart = new Chart(document.getElementById("yearChart"), {

    type: "pie",

    data: {

        labels: [

            "1st Year",
            "2nd Year",
            "3rd Year",
            "4th Year"

        ],

        datasets: [{

            data: [520, 610, 700, 528],

            backgroundColor: [

                "#4e73df",
                "#1cc88a",
                "#f6c23e",
                "#e74a3b"

            ]

        }]

    },

    options: {

        responsive: true,

        plugins: {

            legend: {

                position: "bottom"

            }

        }

    }

});