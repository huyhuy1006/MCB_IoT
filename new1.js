const express = require('express');
const mqtt = require('mqtt');
const mysql = require('mysql');
const path = require('path');

const app = express();
const port = 4000;

const mqttServer = 'mqtt://localhost:1006';
const mqttOptions = {
    username: 'huy',
    password: '123',
};
// Thiết lập kết nối MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',       // Thay bằng username của MySQL
    password: '1234', // Thay bằng password của MySQL
    database: 'esp8266_data', // Thay bằng tên database
});

// Kết nối tới MySQL
db.connect((err) => {
    if (err) {
        console.error('Không thể kết nối tới MySQL:', err);
        process.exit(1); // Thoát nếu kết nối thất bại
    }
    console.log('Đã kết nối MySQL');
});

const client = mqtt.connect(mqttServer, mqttOptions);

client.on('connect', () => {
    console.log('Connected to MQTT broker');
});

const controlLedTopic = 'inTopic';
//API DK LED
app.get('/led/:state', (req, res) => {
    const { state } = req.params;
    
    console.log(`Received LED state: ${state}`);

    if (state === 'on') {
        client.publish(controlLedTopic, 'LED1_ON', (err) => {
            if (err) console.error('Failed to send LED1_ON');
        });
    } else if (state === 'off') {
        client.publish(controlLedTopic, 'LED1_OFF', (err) => {
            if (err) console.error('Failed to send LED1_OFF');
        });
    }

    res.json({ message: `LED ${state}` });
});

// API lấy 6 dữ liệu mới nhất từ MySQL
app.get('/data', (req, res) => {
    const query = `
        SELECT Temp, Hum, Light, Wind, Time 
        FROM sensor_data 
        ORDER BY Time DESC 
        LIMIT 6
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Lỗi truy vấn MySQL:', err);
            return res.status(500).json({ message: 'Lỗi máy chủ' });
        }

        if (results.length > 0) {
            res.json(results);
        } else {
            res.status(404).json({ message: 'Không có dữ liệu' });
        }
    });
});	
//API lấy dữ liệu wind
app.get('/wind', (req, res) => {
    const query = 'SELECT Wind FROM sensor_data ORDER BY Time DESC LIMIT 1';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Lỗi truy vấn MySQL:', err);
            return res.status(500).json({ message: 'Lỗi máy chủ' });
        }
        if (results.length > 0) {
            res.json({ wind: results[0].Wind });
        } else {
            res.json({ wind: 'Không có dữ liệu' });
        }
    });
});

//kiểm tra gió và nhấp nháy LED
app.get('/check-wind', (req, res) => {
    const query = 'SELECT Wind FROM sensor_data ORDER BY Time DESC LIMIT 1';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Lỗi MySQL:', err);
            return res.status(500).json({ message: 'Lỗi server' });
        }

        if (results.length > 0) {
            const wind = results[0].Wind;

            if (wind > 50) {
                const blinkLed = (count) => {
                    if (count > 0) {
                        client.publish(controlLedTopic, 'LED1_ON', (err) => {
                            if (err) console.error('Không thể gửi lệnh LED1_ON');
                        });
                        setTimeout(() => {
                            client.publish(controlLedTopic, 'LED1_OFF', (err) => {
                                if (err) console.error('Không thể gửi lệnh LED1_OFF');
                            });
                            setTimeout(() => blinkLed(count - 1), 500);
                        }, 500);
                    }
                };

                blinkLed(3);
                return res.json({ wind, message: `Wind > 50, LED và biểu tượng nhấp nháy 3 lần!` });
            } else {
                return res.json({ wind, message: 'Gió nhỏ hơn hoặc bằng 50, không nhấp nháy LED' });
            }
        } else {
            return res.json({ wind: 0, message: 'Không có dữ liệu gió' });
        }
    });
});

// Endpoint để lấy tất cả dữ liệu từ bảng sensor_data
app.get('/api/sensor_data/all', (req, res) => {
    const query = `
        SELECT ID, Time, Temp, Hum, Light, Wind
        FROM sensor_data 
        ORDER BY Time DESC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi khi truy vấn sensor_data' });
        }
        res.json(results); // Trả về tất cả dữ liệu từ bảng sensor_data
    });
});
// Endpoint để lấy tất cả dữ liệu từ bảng devices
app.get('/api/devices/all', (req, res) => {
    const query = `
        SELECT * 
        FROM devices 
        ORDER BY Time DESC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi khi truy vấn devices' });
        }
        res.json(results); // Trả về tất cả dữ liệu từ bảng devices
    });
});


// Phục vụ giao diện frontend từ thư mục public
app.use(express.static(path.join(__dirname, 'public')));

// Nếu không tìm thấy route, trả về file index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
