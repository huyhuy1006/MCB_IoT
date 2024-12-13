// Hiển thị tốc độ gió
let windSpeed = 0;
setInterval(() => {
  // Giả lập giá trị tốc độ gió (0 - 10 m/s)
  windSpeed = (Math.random() * 10).toFixed(2);
  document.getElementById("wind-speed").innerText = `${windSpeed} m/s`;
}, 1000);

// Cấu hình biểu đồ (Chart.js)
const ctx = document.getElementById("chart").getContext("2d");
const chart = new Chart(ctx, {
  type: "line",
  data: {
    labels: ["1", "2", "3", "4", "5", "6"], // Thời gian
    datasets: [
      {
        label: "Giá trị đo",
        data: [10, 15, 20, 18, 25, 30], // Dữ liệu mẫu
        borderColor: "#0077b6",
        backgroundColor: "rgba(0, 119, 182, 0.2)",
        borderWidth: 2,
        pointBackgroundColor: "#0077b6",
        pointRadius: 4,
        tension: 0.4,
      },
    ],
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false }, // Ẩn nhãn dataset
    },
    scales: {
      x: {
        title: { display: true, text: "Thời Gian", color: "#555" },
        grid: { display: false },
      },
      y: {
        title: { display: true, text: "Giá Trị", color: "#555" },
        grid: { color: "#e0e0e0" },
      },
    },
  },
});

// Điều khiển LED
function toggleLED(state) {
  // Thực hiện các hành động khi bật/tắt LED
  if (state === "on") {
    alert("LED đã được bật");
    console.log("LED ON");
    // Thực hiện các thao tác với backend nếu có
  } else {
    alert("LED đã được tắt");
    console.log("LED OFF");
    // Thực hiện các thao tác với backend nếu có
  }
}
