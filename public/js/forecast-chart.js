/**
 * forecast-chart.js (runs in the browser)
 * ---------------------------------------
 * Draws the hourly UV forecast as a bar chart with Chart.js.
 * Each bar is coloured by its WHO level. The data comes from the JSON block
 * that results.ejs writes into the page (id="forecast-data").
 */
(function () {
  const dataElement = document.getElementById('forecast-data');
  const canvas = document.getElementById('forecast-chart');
  if (!dataElement || !canvas) return; // no forecast on this page

  // If the Chart.js CDN failed to load, the table below the chart still works.
  if (typeof window.Chart === 'undefined') {
    console.error('Chart.js did not load - showing the table only.');
    canvas.parentElement.hidden = true;
    const details = document.querySelector('.forecast-table-wrap');
    if (details) details.open = true;
    return;
  }

  let hours = [];
  try {
    hours = JSON.parse(dataElement.textContent);
  } catch (error) {
    console.error('Could not read forecast data:', error);
    return;
  }

  // eslint-disable-next-line no-new
  new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels: hours.map((hour) => hour.time),
      datasets: [
        {
          label: 'UV index',
          data: hours.map((hour) => hour.uv),
          backgroundColor: hours.map((hour) => hour.color),
          borderRadius: 6,
          maxBarThickness: 36,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // fill the .chart-wrap height set in CSS
      plugins: {
        legend: { display: false }, // our own WHO legend sits above the chart
        tooltip: {
          callbacks: {
            // e.g. "UV 6.4 · High"
            label: (context) => `UV ${context.parsed.y.toFixed(1)} · ${hours[context.dataIndex].level}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 8,
          title: { display: true, text: 'UV index' },
          grid: { color: 'rgba(31, 42, 55, 0.08)' },
        },
        x: {
          grid: { display: false },
          ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
        },
      },
    },
  });
})();
