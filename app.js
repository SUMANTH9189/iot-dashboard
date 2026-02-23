let tempChart, humChart;

function initCharts() {
  const makeConfig = (label, color) => ({
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: label,
        data: [],
        borderColor: color,
        backgroundColor: color + "18",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5,
        fill: true
      }]
    },
    options: {
      responsive: true,
      animation: false,
      scales: {
        x: {
          ticks: { maxTicksLimit: 8, maxRotation: 40, color: "#8b949e", font: { size: 11 } },
          grid: { color: "#21262d" }
        },
        y: {
          ticks: { color: "#8b949e", font: { size: 11 } },
          grid: { color: "#21262d" }
        }
      },
      plugins: { legend: { labels: { color: "#e6edf3", font: { size: 12 } } } }
    }
  });

  tempChart = new Chart(document.getElementById("tempChart"), makeConfig("Temperature (°C)", "#f85149"));
  humChart  = new Chart(document.getElementById("humChart"),  makeConfig("Humidity (%)", "#58a6ff"));
}

async function fetchData() {
  const range = document.getElementById("rangeSelect").value;
  const dot = document.getElementById("statusDot");
  const errorBox = document.getElementById("errorBox");

  document.getElementById("lastUpdated").textContent = "Loading...";
  dot.className = "status-dot";
  errorBox.style.display = "none";

  try {
    const response = await fetch(`/api/telemetry?range=${range}`);
    if (!response.ok) throw new Error(`Server returned ${response.status}`);

    const json = await response.json();
    if (!json.success || !json.data || json.data.length === 0) {
      throw new Error("No data returned. Check your time range or ESP32 connection.");
    }

    const data = json.data;
    const labels = data.map(d => {
      const dt = new Date(d.time);
      if (range === "7d" || range === "1d") {
        return dt.toLocaleDateString([], { month: "short", day: "numeric" })
               + " " + dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    });

    const temps = data.map(d => d.temp !== null ? parseFloat(d.temp.toFixed(1)) : null);
    const hums  = data.map(d => d.hum  !== null ? parseFloat(d.hum.toFixed(1))  : null);

    tempChart.data.labels = labels;
    tempChart.data.datasets[0].data = temps;
    tempChart.update();

    humChart.data.labels = labels;
    humChart.data.datasets[0].data = hums;
    humChart.update();

    const latest = data[data.length - 1];
    const validTemps = temps.filter(t => t !== null);
    const validHums  = hums.filter(h => h !== null);

    document.getElementById("currentTemp").textContent = latest.temp?.toFixed(1) ?? "--";
    document.getElementById("currentHum").textContent  = latest.hum?.toFixed(1)  ?? "--";
    document.getElementById("maxTemp").textContent     = Math.max(...validTemps).toFixed(1);
    document.getElementById("minTemp").textContent     = Math.min(...validTemps).toFixed(1);
    document.getElementById("dataPoints").textContent  = data.length;

    dot.className = "status-dot green";
    document.getElementById("lastUpdated").textContent = "Updated: " + new Date().toLocaleTimeString();

  } catch (err) {
    console.error(err);
    dot.className = "status-dot red";
    document.getElementById("lastUpdated").textContent = "Failed to load";
    errorBox.style.display = "block";
    errorBox.textContent = "⚠️ Error: " + err.message;
  }
}

initCharts();
fetchData();
setInterval(fetchData, 30000);