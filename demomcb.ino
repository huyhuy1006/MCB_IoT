
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"
#include <time.h>  // Them thu vien time.h de lay thoi gian

// Cau hinh WiFi va MQTT
const char* ssid = "LAPTOP-LC";
const char* password = "10062003";
const char* mqtt_server = "172.20.10.14";  // Dia chi IP Mosquitto MQTT Broker

// Cau hinh cam bien DHT
#define DPIN 4        // GPIO ket noi cam bien DHT (D2)
#define DTYPE DHT11   // Xac dinh loai cam bien DHT 11 hoac DHT22

DHT dht(DPIN, DTYPE);

// Cau hinh cam bien
#define ANALOG_INPUT_PIN A0  // Chan analog (A0 tren ESP8266)
#define DIGITAL_INPUT_PIN 5  // Chan digital (D1 tren ESP8266 tuong ung voi GPIO5)

// Cau hinh chan LED
#define LED_PIN_1 16  // Chan D0 (GPIO 16)
#define LED_PIN_2 14  // Chan D5 (GPIO 14)
#define LED_PIN_3 12  // Chan D6 (GPIO 12)

// Cau hinh MQTT client
WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastMsg = 0;
#define MSG_BUFFER_SIZE (100)
char msg[MSG_BUFFER_SIZE];

// Cau hinh mui gio va server NTP
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 7 * 3600;  // GMT+7 (Chinh sua theo mui gio cua ban)
const int daylightOffset_sec = 0;

// Ham lay thoi gian hien tai
String getFormattedTime() {
  time_t now = time(nullptr);
  if (now < 0) { // Kiểm tra thời gian hợp lệ
    return "N/A"; // Trả về N/A nếu thời gian chưa được đồng bộ
  }
  
  struct tm timeinfo;
  localtime_r(&now, &timeinfo);  
  char buffer[30];
  strftime(buffer, 30, "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(buffer);
}

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  // Cau hinh NTP de lay thoi gian
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("Waiting for time sync...");
  
  // Thêm thời gian chờ cho đến khi có thời gian hợp lệ
  for (int i = 0; i < 10; i++) {
    if (time(nullptr) > 0) {
      break; // Thoát nếu thời gian hợp lệ
    }
    delay(1000);
    Serial.print(".");
  }
  
  Serial.println("\nTime synchronized");
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  
  // Chuyen payload thanh chuoi
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.println(message);

  // Bat tat LED tuong ung voi tin nhan
  if (message == "LED1_ON") {
    digitalWrite(LED_PIN_1, HIGH);  // Bat LED 1
  } else if (message == "LED1_OFF") {
    digitalWrite(LED_PIN_1, LOW);   // Tat LED 1
  } else if (message == "LED2_ON") {
    digitalWrite(LED_PIN_2, HIGH);  // Bat LED 2
  } else if (message == "LED2_OFF") {
    digitalWrite(LED_PIN_2, LOW);   // Tat LED 2
  } else if (message == "LED3_ON") {
    digitalWrite(LED_PIN_3, HIGH);  // Bat LED 3
  } else if (message == "LED3_OFF") {
    digitalWrite(LED_PIN_3, LOW);   // Tat LED 3
  } else if (message == "ON_ALL") {
    digitalWrite(LED_PIN_1, HIGH);
    digitalWrite(LED_PIN_2, HIGH);
    digitalWrite(LED_PIN_3, HIGH);
  } else if (message == "OFF_ALL") {
    digitalWrite(LED_PIN_1, LOW);
    digitalWrite(LED_PIN_2, LOW);
    digitalWrite(LED_PIN_3, LOW);
  }
}


void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP8266Client-";
    clientId += String(random(0xffff), HEX);
    // Thuc hien ket noi voi ten nguoi dung va mat khau
    if (client.connect(clientId.c_str(), "huy", "123")) {
      Serial.println("connected");
      client.subscribe("inTopic");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  pinMode(BUILTIN_LED, OUTPUT);  // Khoi tao chan LED
  pinMode(DIGITAL_INPUT_PIN, INPUT);  // Khoi tao chan digital
  pinMode(LED_PIN_1, OUTPUT);  // Khoi tao chan LED 1
  pinMode(LED_PIN_2, OUTPUT);  // Khoi tao chan LED 2
  pinMode(LED_PIN_3, OUTPUT);  // Khoi tao chan LED 3
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, 1006);
  client.setCallback(callback);
  dht.begin();
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > 10000) {  // Chu ky phat 10 giay
    lastMsg = now;

    // Doc du lieu tu cam bien DHT
    float tc = dht.readTemperature(false);  // Doc nhiet do (°C)
    float hu = dht.readHumidity();          // Doc do am

    // Doc gia tri tu cac chan analog va digital
    int analogValue = analogRead(ANALOG_INPUT_PIN); // Doc gia tri tu chan A0 (cam bien anh sang)
    int digitalValue = digitalRead(DIGITAL_INPUT_PIN); // Doc gia tri tu GPIO5 (chan digital)

    // Sinh du lieu cam bien ao (Wind)
    int windSpeed = random(0, 100); // Gia tri ngau nhien tu 0-100 (tuy chinh theo muc do mong muon)

    // Kiem tra loi doc cam bien DHT
    if (isnan(tc) || isnan(hu)) {
      Serial.println("Failed to read from DHT sensor!");
      return;
    }

    // Lay thoi gian thuc tu NTP
    String currentTime = getFormattedTime();

    // Phat du lieu nhiet do, do am, cam bien, wind va thoi gian
    snprintf(msg, MSG_BUFFER_SIZE, "Time: %s, Temp: %.2f C, Hum: %.0f%%, Light: %d Lux, Wind: %d km/h", 
             currentTime.c_str(), tc, hu, analogValue, windSpeed);
    Serial.print("Publish message: ");
    Serial.println(msg);
    client.publish("outTopic", msg);
  }
}
