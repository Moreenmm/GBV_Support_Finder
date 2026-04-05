async function searchServices() {
    const location = document.getElementById("locationInput").value;

    try {
        const response = await fetch(`http://127.0.0.1:5000/api/centers?location=${location}`);
        const data = await response.json();

        const resultsDiv = document.getElementById("results");
        resultsDiv.innerHTML = "";

        if (data.length === 0) {
            resultsDiv.innerHTML = "<p>No centers found.</p>";
            return;
        }

        data.forEach(center => {
            const div = document.createElement("div");
            div.classList.add("facility-card");

            div.innerHTML = `
                <h3>${center.name}</h3>
                <p><strong>Location:</strong> ${center.location}</p>
                <p><strong>Type:</strong> ${center.type}</p>
                <p><strong>Contact:</strong> ${center.phone}</p>
            `;

            resultsDiv.appendChild(div);
        });

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}
