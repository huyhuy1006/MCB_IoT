// Hàm lấy dữ liệu từ API và vẽ biểu đồ
async function fetchAndRenderChart() {
    try {
        // Gửi yêu cầu tới API
        const response = await fetch('/data');
        if (!response.ok) {
            throw new Error('Không thể lấy dữ liệu từ API');
        }

        // Nhận dữ liệu JSON
        const data = await response.json();

        // Chuẩn bị dữ liệu để vẽ biểu đồ
        const labels = data.map(item => new Date(item.Time).toLocaleString()); // Xử lý cột Time
        const tempData = data.map(item => item.Temp);
        const humData = data.map(item => item.Hum);
        const lightData = data.map(item => item.Light);
        const windData = data.map(item => item.Wind);

        // Gọi hàm vẽ biểu đồ
        renderChart(labels, tempData, humData, lightData, windData);
    } catch (error) {
        console.error('Lỗi:', error);
    }
}

// Hàm vẽ biểu đồ sử dụng Chart.js
function renderChart(labels, tempData, humData, lightData, windData) {
    const ctx = document.getElementById('canvas').getContext('2d');
    new Chart(ctx, {
        type: 'line', // Biểu đồ dạng đường
        data: {
            labels: labels, // Các thời điểm
            datasets: [
                {
                    label: 'Nhiệt độ (°C)',
                    data: tempData,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    fill: true,
                },
                {
                    label: 'Độ ẩm (%)',
                    data: humData,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: true,
                },
                {
                    label: 'Ánh sáng (lux)',
                    data: lightData,
                    borderColor: 'rgba(255, 206, 86, 1)',
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    fill: true,
                },
                {
                    label: 'Gió (m/s)',
                    data: windData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                },
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Thời gian',
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Giá trị',
                    }
                }
            }
        }
    });
}

// Gọi hàm khi tải trang
fetchAndRenderChart();
