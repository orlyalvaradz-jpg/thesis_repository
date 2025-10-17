// Backend endpoint (update IP to your gateway ESP32)
const API_URL = "http://10.165.223.197:5000/api/data";

// Fetch and update dashboard
async function fetchData() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    if (Array.isArray(data.nodes)) {
      data.nodes.forEach(node => {
        const id = node.node_id;
        if (!id) return;

        document.getElementById(`distance${id}`).textContent = node.distance_cm?.toFixed(1) ?? "--";
        document.getElementById(`rainVal${id}`).textContent = node.rain_sensor_val ?? "--";
        document.getElementById(`predicted${id}`).textContent = node.predicted_distance_cm?.toFixed(1) ?? "--";
        document.getElementById(`risk${id}`).textContent = node.overflow_risk ? "YES" : "NO";
        document.getElementById(`risk${id}`).className = node.overflow_risk ? "risk-yes" : "risk-no";
        document.getElementById(`hoursFlood${id}`).textContent =
          node.hours_to_flood !== undefined ? node.hours_to_flood.toFixed(1) : "--";
      });
    }

    if (data.forecast) {
      document.getElementById("rainTotal").textContent = data.forecast.total_rain_mm?.toFixed(1) ?? "--";
      document.getElementById("rainRate").textContent = data.forecast.max_rate_mmhr?.toFixed(1) ?? "--";
      document.getElementById("weatherDesc").textContent = data.forecast.desc ?? "--";
    }

    if (data.history) {
      updateChart(data.history);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

// Chart.js setup
let chart;
function initChart() {
  const ctx = document.getElementById("waterLevelChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { label: "Node 1", data: [], borderColor: "#34699a", backgroundColor: "rgba(52,105,154,0.3)", fill: true, tension: 0.3 },
        { label: "Node 2", data: [], borderColor: "#ff5733", backgroundColor: "rgba(255,87,51,0.3)", fill: true, tension: 0.3 },
        { label: "Node 3", data: [], borderColor: "#28a745", backgroundColor: "rgba(40,167,69,0.3)", fill: true, tension: 0.3 },
        { label: "Node 4", data: [], borderColor: "#ffc107", backgroundColor: "rgba(255,193,7,0.3)", fill: true, tension: 0.3 }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: false, title: { display: true, text: "Distance (cm)" } },
        x: { title: { display: true, text: "Timestamp" } }
      }
    }
  });
}

function updateChart(history) {
  const labels = [...new Set(history.map(d => d.timestamp))];
  chart.data.labels = labels;

  for (let i = 1; i <= 4; i++) {
    const nodeHistory = history.filter(d => d.node_id === i);
    chart.data.datasets[i - 1].data = labels.map(ts => {
      const entry = nodeHistory.find(d => d.timestamp === ts);
      return entry ? entry.distance_cm : null;
    });
  }
  chart.update();
}

// Initialize after DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  initChart();
  fetchData();
  setInterval(fetchData, 10000); // refresh every 10s

  // ✅ Logout button listener
  const logoutButton = document.querySelector('.logout');
  if (logoutButton) {
    logoutButton.addEventListener('click', function() {
      const confirmLogout = confirm("Are you sure you want to log out?");
      if (confirmLogout) {
        window.location.href = "http://127.0.0.1:5500/thesis.html";
      }
    });
  } else {
    console.warn("Logout button not found!");
  }
});
