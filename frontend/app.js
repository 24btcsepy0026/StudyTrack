/**
 * StudyTrack — Dashboard Application Script
 * Communicates with FastAPI backend endpoints using native fetch and async/await.
 */

const API_BASE = ""; // Relative path for single-process run mode

let appState = {
    students: [],
    courses: []
};

// --- Error and Success Banner Utilities ---
function showError(message) {
    const banner = document.getElementById("error-banner");
    banner.textContent = message;
    banner.classList.remove("hidden");

    // Hide success banner if active
    const successBanner = document.getElementById("success-banner");
    if (successBanner) successBanner.classList.add("hidden");
}

function hideError() {
    const banner = document.getElementById("error-banner");
    banner.classList.add("hidden");
}

function showSuccess(message) {
    hideError();
    const banner = document.getElementById("success-banner");
    if (!banner) return;
    banner.textContent = message;
    banner.classList.remove("hidden");

    if (window.successTimeout) clearTimeout(window.successTimeout);
    window.successTimeout = setTimeout(() => {
        banner.classList.add("hidden");
    }, 4000);
}

// --- Live Stats Counter ---
function updateStats() {
    const studentCount = appState.students.length;
    const courseCount = appState.courses.length;
    const totalCredits = appState.courses.reduce((sum, c) => sum + (c.credits || 0), 0);

    const sEl = document.getElementById("stat-students");
    const cEl = document.getElementById("stat-courses");
    const crEl = document.getElementById("stat-credits");

    if (sEl) sEl.textContent = studentCount;
    if (cEl) cEl.textContent = courseCount;
    if (crEl) crEl.textContent = totalCredits;
}

// --- Populate Student Selection Dropdowns ---
function populateStudentDropdowns() {
    const courseStudentSelect = document.getElementById("course-student-id");
    const filterStudentSelect = document.getElementById("filter-course-student");

    if (courseStudentSelect) {
        const selectedVal = courseStudentSelect.value;
        courseStudentSelect.innerHTML = '<option value="">-- Select Student --</option>';
        appState.students.forEach((s) => {
            const opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = `${s.name} (ID: ${s.id})`;
            courseStudentSelect.appendChild(opt);
        });
        courseStudentSelect.value = selectedVal;
    }

    if (filterStudentSelect) {
        const selectedVal = filterStudentSelect.value;
        filterStudentSelect.innerHTML = '<option value="">All Students (Show All)</option>';
        appState.students.forEach((s) => {
            const opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = `${s.name} (ID: ${s.id})`;
            filterStudentSelect.appendChild(opt);
        });
        filterStudentSelect.value = selectedVal;
    }
}

// --- Create Student Card Element (document.createElement) ---
function createStudentCard(student) {
    const card = document.createElement("div");
    card.className = "student-card";
    card.dataset.id = student.id;

    // Student Name
    const nameEl = document.createElement("h3");
    nameEl.textContent = student.name;

    // Email
    const emailEl = document.createElement("p");
    emailEl.className = "student-email";
    emailEl.textContent = student.email;

    // Displayed Age Text
    const ageEl = document.createElement("p");
    ageEl.className = "student-age";
    ageEl.textContent = `Age: ${student.age}`;

    // Enrolled Courses Chips
    const coursesBox = document.createElement("div");
    coursesBox.className = "student-courses-box";
    
    const coursesBoxTitle = document.createElement("div");
    coursesBoxTitle.className = "student-courses-box-title";
    coursesBoxTitle.textContent = "Enrolled Courses";
    coursesBox.appendChild(coursesBoxTitle);

    const chipsWrap = document.createElement("div");
    chipsWrap.className = "course-chips-wrap";

    const enrolled = appState.courses.filter((c) => c.student_id === student.id);
    if (enrolled.length > 0) {
        enrolled.forEach((c) => {
            const chip = document.createElement("span");
            chip.className = "course-chip";
            chip.innerHTML = `${c.course_name} <span class="cr-badge">${c.credits} Cr</span>`;
            chipsWrap.appendChild(chip);
        });
    } else {
        const noCourses = document.createElement("span");
        noCourses.className = "no-courses-lbl";
        noCourses.textContent = "No courses enrolled";
        chipsWrap.appendChild(noCourses);
    }
    coursesBox.appendChild(chipsWrap);

    // Card Actions (Age Input + Save Age Button + Delete Button)
    const actions = document.createElement("div");
    actions.className = "card-actions";

    const ageInput = document.createElement("input");
    ageInput.type = "number";
    ageInput.min = "1";
    ageInput.max = "120";
    ageInput.value = student.age;
    ageInput.className = "age-input";
    ageInput.setAttribute("aria-label", `Edit age for ${student.name}`);

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "save-age-btn";
    saveBtn.textContent = "Save Age";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";

    actions.appendChild(ageInput);
    actions.appendChild(saveBtn);
    actions.appendChild(deleteBtn);

    // Assemble Card
    card.appendChild(nameEl);
    card.appendChild(emailEl);
    card.appendChild(ageEl);
    card.appendChild(coursesBox);
    card.appendChild(actions);

    return card;
}

// --- Create Course Card Element ---
function createCourseCard(course) {
    const card = document.createElement("div");
    card.className = "course-card";
    card.dataset.id = course.id;

    const student = appState.students.find((s) => s.id === course.student_id);
    const studentName = student ? student.name : `Student ID: ${course.student_id}`;

    const titleEl = document.createElement("h3");
    titleEl.textContent = course.course_name;

    const creditsEl = document.createElement("p");
    creditsEl.className = "course-credits-text";
    creditsEl.textContent = `Accredited Credits: ${course.credits}`;

    const studentEl = document.createElement("p");
    studentEl.className = "course-student-text";
    studentEl.textContent = `Enrolled: ${studentName}`;

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const deleteCourseBtn = document.createElement("button");
    deleteCourseBtn.type = "button";
    deleteCourseBtn.className = "delete-btn delete-course-btn";
    deleteCourseBtn.textContent = "Delete Course";

    actions.appendChild(deleteCourseBtn);

    card.appendChild(titleEl);
    card.appendChild(creditsEl);
    card.appendChild(studentEl);
    card.appendChild(actions);

    return card;
}

// --- Load Students from Backend ---
async function loadStudents(minAge = null) {
    try {
        hideError();
        let url = `${API_BASE}/students/`;
        if (minAge !== null && minAge !== "") {
            url += `?min_age=${encodeURIComponent(minAge)}`;
        }

        const [studentsRes, coursesRes] = await Promise.all([
            fetch(url),
            fetch(`${API_BASE}/courses/`)
        ]);

        if (!studentsRes.ok) {
            showError("Could not load the student roster. The server returned an error.");
            return;
        }

        if (coursesRes.ok) {
            appState.courses = await coursesRes.json();
        }

        const students = await studentsRes.json();
        appState.students = students;
        updateStats();
        populateStudentDropdowns();

        const container = document.getElementById("cards-container");
        container.innerHTML = "";

        if (students.length === 0) {
            container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #64748b;">No students found.</p>';
            return;
        }

        students.forEach((student) => {
            container.appendChild(createStudentCard(student));
        });
    } catch (err) {
        showError("Could not reach the StudyTrack backend. Make sure the server is running.");
    }
}

// --- Load Courses from Backend ---
async function loadCourses(studentId = null) {
    try {
        hideError();
        let url = `${API_BASE}/courses/`;
        if (studentId) {
            url += `?student_id=${encodeURIComponent(studentId)}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            showError("Could not load course list from the backend.");
            return;
        }

        const courses = await response.json();
        if (!studentId) {
            appState.courses = courses;
            updateStats();
        }

        const container = document.getElementById("courses-container");
        container.innerHTML = "";

        if (courses.length === 0) {
            container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #64748b;">No courses found.</p>';
            return;
        }

        courses.forEach((course) => {
            container.appendChild(createCourseCard(course));
        });
    } catch (err) {
        showError("Could not reach the StudyTrack backend. Make sure the server is running.");
    }
}

// --- ONE Event Listener on #roster-list (Event Delegation) ---
document.getElementById("roster-list").addEventListener("click", async (event) => {
    const target = event.target;
    const card = target.closest(".student-card");
    if (!card) return;

    const studentId = card.dataset.id;

    // Action 1: Save Age
    if (target.classList.contains("save-age-btn")) {
        const ageInput = card.querySelector(".age-input");
        const newAge = parseInt(ageInput.value, 10);

        try {
            hideError();
            const response = await fetch(`${API_BASE}/students/${studentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ age: newAge }),
            });

            if (!response.ok) {
                showError("Failed to update student age. Please try again.");
                return;
            }

            const updated = await response.json();
            card.querySelector(".student-age").textContent = `Age: ${updated.age}`;
            showSuccess(`Updated age for student ID #${studentId} to ${updated.age}.`);
        } catch (err) {
            showError("Could not reach the StudyTrack backend. Make sure the server is running.");
        }
    }

    // Action 2: Delete Student
    if (target.classList.contains("delete-btn")) {
        try {
            hideError();
            const response = await fetch(`${API_BASE}/students/${studentId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                showError("Failed to delete student. Please try again.");
                return;
            }

            card.remove();
            appState.students = appState.students.filter(s => String(s.id) !== String(studentId));
            updateStats();
            populateStudentDropdowns();
            showSuccess(`Student record #${studentId} deleted successfully.`);
        } catch (err) {
            showError("Could not reach the StudyTrack backend. Make sure the server is running.");
        }
    }
});

// --- Add Student Form Submit Handler ---
document.getElementById("student-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const age = parseInt(document.getElementById("age").value, 10);

    try {
        hideError();
        const response = await fetch(`${API_BASE}/students/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, age }),
        });

        if (!response.ok) {
            let errorDetail = "Failed to add student. Check that the email is valid and unique.";
            try {
                const errData = await response.json();
                if (errData && errData.detail) {
                    errorDetail = typeof errData.detail === "string" ? errData.detail : JSON.stringify(errData.detail);
                }
            } catch (e) {}
            showError(errorDetail);
            return;
        }

        const newStudent = await response.json();
        appState.students.push(newStudent);
        updateStats();
        populateStudentDropdowns();

        // Create and append student card dynamically using document.createElement
        const container = document.getElementById("cards-container");
        container.appendChild(createStudentCard(newStudent));

        event.target.reset();
        showSuccess(`Student "${newStudent.name}" registered successfully!`);
    } catch (err) {
        showError("Could not reach the StudyTrack backend. Make sure the server is running.");
    }
});

// --- Add Course Form Submit Handler ---
document.getElementById("course-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const course_name = document.getElementById("course-name").value.trim();
    const credits = parseInt(document.getElementById("course-credits").value, 10);
    const student_id = parseInt(document.getElementById("course-student-id").value, 10);

    if (!student_id) {
        showError("Please select a student to assign the course to.");
        return;
    }

    try {
        hideError();
        const response = await fetch(`${API_BASE}/courses/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ course_name, credits, student_id }),
        });

        if (!response.ok) {
            showError("Failed to create course. Ensure credits are between 1 and 6.");
            return;
        }

        const newCourse = await response.json();
        appState.courses.push(newCourse);
        updateStats();

        // Refresh courses container and student cards
        await Promise.all([loadCourses(), loadStudents()]);

        event.target.reset();
        document.getElementById("course-credits").value = "3";
        showSuccess(`Course "${newCourse.course_name}" (${newCourse.credits} Cr) enrolled successfully!`);
    } catch (err) {
        showError("Could not reach the StudyTrack backend. Make sure the server is running.");
    }
});

// --- Delete Course Event Delegation ---
document.getElementById("courses-container").addEventListener("click", async (event) => {
    const target = event.target;
    if (!target.classList.contains("delete-course-btn")) return;

    const card = target.closest(".course-card");
    if (!card) return;

    const courseId = card.dataset.id;

    try {
        hideError();
        const response = await fetch(`${API_BASE}/courses/${courseId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            showError("Failed to delete course.");
            return;
        }

        card.remove();
        appState.courses = appState.courses.filter(c => String(c.id) !== String(courseId));
        updateStats();
        await loadStudents(); // Refresh chips
        showSuccess("Course removed successfully.");
    } catch (err) {
        showError("Could not reach the StudyTrack backend. Make sure the server is running.");
    }
});

// --- Course Filter by Student ---
document.getElementById("filter-course-student").addEventListener("change", (e) => {
    loadCourses(e.target.value);
});

// --- Student Filter by Minimum Age ---
document.getElementById("apply-filter-btn").addEventListener("click", () => {
    const minAge = document.getElementById("min-age-filter").value;
    loadStudents(minAge);
});

document.getElementById("reset-filter-btn").addEventListener("click", () => {
    document.getElementById("min-age-filter").value = "";
    loadStudents();
});

// --- Part 2: Integrated Algorithms Engine ---

// 1. Insertion Sort
document.getElementById("sort-btn").addEventListener("click", async () => {
    const by = document.getElementById("sort-by").value;
    const resultBox = document.getElementById("sort-results");

    try {
        hideError();
        const response = await fetch(`${API_BASE}/students/sorted?by=${encodeURIComponent(by)}`);
        if (!response.ok) {
            showError("Failed to execute Insertion Sort.");
            return;
        }

        const sortedData = await response.json();
        resultBox.classList.remove("hidden");
        resultBox.innerHTML = `
            <h4>Insertion Sort Results (Sorted Ascending by ${by.toUpperCase()}):</h4>
            <pre>${JSON.stringify(sortedData, null, 2)}</pre>
        `;
        showSuccess(`Insertion Sort completed ascending by ${by}!`);
    } catch (err) {
        showError("Could not reach the StudyTrack backend. Make sure the server is running.");
    }
});

// 2. Binary Search by Name
document.getElementById("binary-search-btn").addEventListener("click", async () => {
    const name = document.getElementById("binary-search-input").value.trim();
    const resultBox = document.getElementById("binary-search-results");

    if (!name) {
        showError("Please enter an exact student name to binary search.");
        return;
    }

    try {
        hideError();
        const response = await fetch(`${API_BASE}/students/search?name=${encodeURIComponent(name)}`);
        if (!response.ok) {
            if (response.status === 404) {
                resultBox.classList.remove("hidden");
                resultBox.innerHTML = `<p style="color: #ef4444; font-weight: 600;">No student found with name "${name}". (404 Not Found)</p>`;
                return;
            }
            showError("Binary search request failed.");
            return;
        }

        const matchedStudent = await response.json();
        resultBox.classList.remove("hidden");
        resultBox.innerHTML = `
            <div style="background: #ecfdf5; border: 1px solid #6ee7b7; padding: 0.85rem; border-radius: 4px;">
                <h4 style="color: #065f46; margin-bottom: 0.35rem;">Binary Search Match Found:</h4>
                <p><strong>ID:</strong> #${matchedStudent.id}</p>
                <p><strong>Name:</strong> ${matchedStudent.name}</p>
                <p><strong>Email:</strong> ${matchedStudent.email}</p>
                <p><strong>Age:</strong> ${matchedStudent.age}</p>
            </div>
        `;
        showSuccess(`Binary Search found record for "${matchedStudent.name}".`);
    } catch (err) {
        showError("Could not reach the StudyTrack backend. Make sure the server is running.");
    }
});

// 3. Roster Summary Report
document.getElementById("report-btn").addEventListener("click", async () => {
    const minAge = parseInt(document.getElementById("report-min-age").value, 10) || 21;
    const resultBox = document.getElementById("report-results");

    try {
        hideError();
        const response = await fetch(`${API_BASE}/students/report?min_age=${minAge}`);
        if (!response.ok) {
            showError("Failed to generate roster report.");
            return;
        }

        const reportData = await response.json();
        resultBox.classList.remove("hidden");
        resultBox.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h4>Formatted Roster Report</h4>
                <span class="stat-badge highlight">Students &ge; ${minAge} yrs: <strong>${reportData.count_meeting_min_age}</strong></span>
            </div>
            <pre>${reportData.report || "No students registered."}</pre>
        `;
        showSuccess("Roster summary report generated successfully.");
    } catch (err) {
        showError("Could not reach the StudyTrack backend. Make sure the server is running.");
    }
});

// --- Part 3: Integrated AI Assistant ---

// 1. Summarize Notes
document.getElementById("summarize-btn").addEventListener("click", async () => {
    const text = document.getElementById("notes-input").value;
    const resultBox = document.getElementById("summary-result");

    try {
        hideError();
        const response = await fetch(`${API_BASE}/assistant/summarize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            showError("Failed to summarize notes. Please try again.");
            return;
        }

        const data = await response.json();
        resultBox.innerHTML = "";
        resultBox.classList.remove("hidden");

        const topicEl = document.createElement("p");
        topicEl.innerHTML = `<strong>Topic:</strong> ${data.topic}`;

        const diffEl = document.createElement("p");
        diffEl.innerHTML = `<strong>Difficulty:</strong> <span style="text-transform: uppercase; font-weight: 700; color: #7e22ce;">${data.difficulty}</span>`;

        const kpTitle = document.createElement("p");
        kpTitle.innerHTML = "<strong>Key Points:</strong>";

        const kpList = document.createElement("ul");
        kpList.style.marginLeft = "1.5rem";
        if (data.key_points && data.key_points.length > 0) {
            data.key_points.forEach((point) => {
                const li = document.createElement("li");
                li.textContent = point;
                kpList.appendChild(li);
            });
        } else {
            const li = document.createElement("li");
            li.textContent = "(No key points extracted)";
            kpList.appendChild(li);
        }

        resultBox.appendChild(topicEl);
        resultBox.appendChild(diffEl);
        resultBox.appendChild(kpTitle);
        resultBox.appendChild(kpList);

        showSuccess("AI Summary generated successfully.");
    } catch (err) {
        showError("Could not reach the StudyTrack backend. Make sure the server is running.");
    }
});

// Sample Buttons for Summarizer
document.querySelectorAll(".sample-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.getElementById("notes-input").value = btn.dataset.text;
    });
});

// 2. Semantic Search Notes
document.getElementById("search-btn").addEventListener("click", async () => {
    const query = document.getElementById("search-input").value;
    const resultsBox = document.getElementById("search-results");

    try {
        hideError();
        const response = await fetch(
            `${API_BASE}/assistant/search?query=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
            showError("Failed to search notes. Please try again.");
            return;
        }

        const results = await response.json();
        resultsBox.innerHTML = "";
        resultsBox.classList.remove("hidden");

        if (results.length === 0) {
            resultsBox.innerHTML = "<p>No notes available.</p>";
            return;
        }

        results.forEach((note) => {
            const item = document.createElement("div");
            item.className = "search-result-item";

            const scoreEl = document.createElement("p");
            scoreEl.innerHTML = `<strong>Note #${note.id}</strong> &bull; <span class="score-tag">Cosine Score: ${note.score}</span>`;

            const textEl = document.createElement("p");
            textEl.textContent = note.text;
            textEl.style.fontSize = "0.9rem";
            textEl.style.color = "#334155";
            textEl.style.marginTop = "0.2rem";

            item.appendChild(scoreEl);
            item.appendChild(textEl);
            resultsBox.appendChild(item);
        });

        showSuccess("Semantic search ranking completed.");
    } catch (err) {
        showError("Could not reach the StudyTrack backend. Make sure the server is running.");
    }
});

// Sample Query Buttons for Search
document.querySelectorAll(".sample-query-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.getElementById("search-input").value = btn.dataset.q;
    });
});

// --- Initial Page Load ---
document.addEventListener("DOMContentLoaded", () => {
    loadStudents();
    loadCourses();
});
