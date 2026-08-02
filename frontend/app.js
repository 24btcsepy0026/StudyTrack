const API_BASE = "";

function showError(message) {
    const banner = document.getElementById("error-banner");
    banner.textContent = message;
    banner.classList.remove("hidden");
}

function hideError() {
    const banner = document.getElementById("error-banner");
    banner.classList.add("hidden");
}

function createStudentCard(student) {
    const card = document.createElement("div");
    card.className = "student-card";
    card.dataset.id = student.id;

    const nameEl = document.createElement("h3");
    nameEl.textContent = student.name;

    const emailEl = document.createElement("p");
    emailEl.className = "student-email";
    emailEl.textContent = student.email;

    const ageEl = document.createElement("p");
    ageEl.className = "student-age";
    ageEl.textContent = `Age: ${student.age}`;

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const ageInput = document.createElement("input");
    ageInput.type = "number";
    ageInput.min = "1";
    ageInput.value = student.age;
    ageInput.className = "age-input";

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

    card.appendChild(nameEl);
    card.appendChild(emailEl);
    card.appendChild(ageEl);
    card.appendChild(actions);

    return card;
}

async function loadStudents() {
    try {
        hideError();
        const response = await fetch(`${API_BASE}/students/`);
        if (!response.ok) {
            showError("Could not load the student roster. The server returned an error.");
            return;
        }
        const students = await response.json();
        const container = document.getElementById("cards-container");
        container.innerHTML = "";
        students.forEach((student) => {
            container.appendChild(createStudentCard(student));
        });
    } catch (err) {
        showError("Could not reach the StudyTrack backend. Make sure the server is running.");
    }
}

document.getElementById("roster-list").addEventListener("click", async (event) => {
    const target = event.target;
    const card = target.closest(".student-card");
    if (!card) return;

    const studentId = card.dataset.id;

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
        } catch (err) {
            showError("Could not reach the StudyTrack backend. Make sure the server is running.");
        }
    }

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
        } catch (err) {
            showError("Could not reach the StudyTrack backend. Make sure the server is running.");
        }
    }
});

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
            showError("Failed to add student. Check that the email is valid and unique.");
            return;
        }
        const newStudent = await response.json();
        document.getElementById("cards-container").appendChild(createStudentCard(newStudent));
        event.target.reset();
    } catch (err) {
        showError("Could not reach the StudyTrack backend. Make sure the server is running.");
    }
});

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
        diffEl.innerHTML = `<strong>Difficulty:</strong> ${data.difficulty}`;

        const kpTitle = document.createElement("p");
        kpTitle.innerHTML = "<strong>Key Points:</strong>";

        const kpList = document.createElement("ul");
        data.key_points.forEach((point) => {
            const li = document.createElement("li");
            li.textContent = point;
            kpList.appendChild(li);
        });

        resultBox.appendChild(topicEl);
        resultBox.appendChild(diffEl);
        resultBox.appendChild(kpTitle);
        resultBox.appendChild(kpList);
    } catch (err) {
        showError("Could not reach the StudyTrack backend. Make sure the server is running.");
    }
});

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

        results.forEach((note) => {
            const item = document.createElement("div");
            item.className = "search-result-item";

            const scoreEl = document.createElement("p");
            scoreEl.innerHTML = `<strong>Score:</strong> ${note.score}`;

            const textEl = document.createElement("p");
            textEl.textContent = note.text;

            item.appendChild(scoreEl);
            item.appendChild(textEl);
            resultsBox.appendChild(item);
        });
    } catch (err) {
        showError("Could not reach the StudyTrack backend. Make sure the server is running.");
    }
});

loadStudents();
