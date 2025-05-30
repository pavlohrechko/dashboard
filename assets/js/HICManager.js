// HICManager.js

$(document).ready(function () {
  const MAX_WINDOW_MS = 15; // 15 ms max window
  let buffer = []; // rolling buffer of {t, a}
  let hicMax = 0; // track peak HIC

  // set up Chart.js line for live HIC
  const ctx = document.getElementById("hicChart");
  const hicChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "HIC",
          data: [],
          borderColor: "#FFA500",
          borderWidth: 1,
          fill: false,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: { display: false },
        y: {
          beginAtZero: true,
          title: { display: true, text: "HIC" },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });

  // subscribe to IMU (accelerometer) data
  openEarable.sensorManager.subscribeOnSensorDataReceived((sensorData) => {
    if (sensorData.sensorId !== SENSOR_ID.IMU) return;

    const t = sensorData.timestamp; // ms
    const ax = sensorData.ACC.X,
      ay = sensorData.ACC.Y,
      az = sensorData.ACC.Z;
    const a = Math.sqrt(ax * ax + ay * ay + az * az);

    // push and trim buffer to last MAX_WINDOW_MS
    buffer.push({ t, a });
    while (buffer.length > 1 && t - buffer[0].t > MAX_WINDOW_MS) {
      buffer.shift();
    }

    // compute HIC over this window
    const dtSec = (buffer[buffer.length - 1].t - buffer[0].t) / 1000;
    if (dtSec > 0) {
      const sumA = buffer.reduce((s, p) => s + p.a, 0);
      const avgA = sumA / buffer.length;
      const hic = dtSec * Math.pow(avgA, 2.5);

      // update peak HIC display
      if (hic > hicMax) {
        hicMax = hic;
        $("#hicValue").text(hicMax.toFixed(2));
      }

      // push to chart (keep last 150 points)
      hicChart.data.labels.push("");
      hicChart.data.datasets[0].data.push(hic);
      if (hicChart.data.datasets[0].data.length > 150) {
        hicChart.data.labels.shift();
        hicChart.data.datasets[0].data.shift();
      }
      hicChart.update("none");
    }
  });
});
