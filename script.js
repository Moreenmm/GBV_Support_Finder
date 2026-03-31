// SEARCH FUNCTION
async function searchServices() {
  const location = document.getElementById("locationInput").value;

  try {
    const res = await fetch(`http://127.0.0.1:5000/api/centers?location=${location}`);
    const data = await res.json();

    let html = "";

    data.forEach(c => {
      html += `
        <div style="border:1px solid #ccc; margin:10px; padding:10px;">
          <h3>${c.name}</h3>
          <p>${c.location}</p>
          <p>${c.type}</p>
          <p>${c.phone}</p>
        </div>
      `;
    });

    document.getElementById("results").innerHTML = html;

  } catch (err) {
    document.getElementById("errorState").style.display = "block";
  }
}


// GEOLOCATION API
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition, showError);
  } else {
    alert("Geolocation is not supported by this browser.");
  }
}

function showPosition(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  console.log("Location:", lat, lon);

  // Simple demo mapping
  document.getElementById("locationInput").value = "Nairobi";

  searchServices();
}

function showError() {
  alert("Unable to retrieve your location.");
}
