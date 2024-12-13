const socket = io();

// Xử lý điều khiển LED
document.getElementById('led1-on').addEventListener('click', () => {
    socket.emit('controlLed', { ledId: 1, action: 'on' });
});
document.getElementById('led1-off').addEventListener('click', () => {
    socket.emit('controlLed', { ledId: 1, action: 'off' });
});
document.getElementById('led2-on').addEventListener('click', () => {
    socket.emit('controlLed', { ledId: 2, action: 'on' });
});
document.getElementById('led2-off').addEventListener('click', () => {
    socket.emit('controlLed', { ledId: 2, action: 'off' });
});
document.getElementById('led3-on').addEventListener('click', () => {
    socket.emit('controlLed', { ledId: 3, action: 'on' });
});
document.getElementById('led3-off').addEventListener('click', () => {
    socket.emit('controlLed', { ledId: 3, action: 'off' });
});

// Cập nhật trạng thái LED từ backend
socket.on('ledStatusUpdate', (data) => {
    document.getElementById(`led${data.ledId}-status`).textContent = `LED ${data.ledId}: ${data.action}`;
});

// Cập nhật dữ liệu cảm biến
socket.on('sensorData', (data) => {
    updateChart(data);
});

// Cập nhật bảng log thiết bị
function updateDeviceLog() {
    fetch('/getDeviceData')
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector('#device-log tbody');
            tbody.innerHTML = '';
            data.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${row.Device}</td><td>${row.Action}</td><td>${row.Time}</td>`;
                tbody.appendChild(tr);
            });
        });
}

// Cập nhật biểu đồ cảm biến
let chart = new Chart(document.getElementById('sensorChart'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Temperature (°C)',
                data: [],
                borderColor: 'red',
                fill: false
            },
            {
                label: 'Humidity (%)',
                data: [],
                borderColor: 'blue',
                fill: false
            },
            {
                label: 'Light (lux)',
                data: [],
                borderColor: 'green',
                fill: false
            }
        ]
    },
    options: {
        scales: {
            x: {
                type: 'linear',
                position: 'bottom'
            }
        }
    }
});

function updateChart(data) {
    chart.data.labels.push(new Date(data.time).toLocaleTimeString());
    chart.data.datasets[0].data.push(data.temp);
    chart.data.datasets[1].data.push(data.humidity);
    chart.data.datasets[2].data.push(data.light);
    chart.update();
}

setInterval(updateDeviceLog, 5000); // Cập nhật bảng log mỗi 5 giây
