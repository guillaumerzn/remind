#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include <LiquidCrystal_I2C.h>
#include <Wire.h>

// WiFi credentials
const char* ssid = "iphone";
const char* password = "5tcoapd68f8zh";

// Supabase API details
const char* supabaseUrl = "https://ugebdrgjhzsqgvtdlgqw.supabase.co/rest/v1/rpc/get_user_rdvs";
const char* apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWJkcmdqaHpzcWd2dGRsZ3F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNDYyNjgsImV4cCI6MjA2MjcyMjI2OH0.1HRJ95rqhx7A9ERGDW2Ra0wVNkV66wwtC6s1xl3qa8w";
const char* userId = "2f5e4f4e-4600-4291-a778-0521e2b7a4a6";

// Time between Supabase API requests
unsigned long lastRequestTime = 0;
const unsigned long requestInterval = 10000;  // 10 seconds

// LCD Configuration
#define I2C_SDA 21
#define I2C_SCL 22
#define LCD_ADDRESS 0x27
#define LCD_COLS 20
#define LCD_ROWS 4

// LCD object
LiquidCrystal_I2C lcd(LCD_ADDRESS, LCD_COLS, LCD_ROWS);

// Display mode variables
unsigned long displayModeStartTime = 0;
bool showingTime = false;
const unsigned long TIME_DISPLAY_DURATION = 10000;    // 10 seconds
const unsigned long NORMAL_DISPLAY_DURATION = 10000;  // 10 seconds

// Current user info
String currentUserName = "";
String currentDateTime = "";

// Next RDV info
String nextRdvDate = "";
String nextRdvTime = "";
String nextRdvTitle = "";
String nextRdvContent = "";

// Pin definitions
#define RED_LED_R 25
#define RED_LED_G 26
#define RED_LED_B 27

#define BLUE_LED_R 14
#define BLUE_LED_G 12
#define BLUE_LED_B 13

#define GREEN_LED_R 19
#define GREEN_LED_G 18
#define GREEN_LED_B 5

#define PIN_BUZZER 32

// Star Wars Theme Notes
#define NOTE_A4 440
#define NOTE_E5 659
#define NOTE_F5 698
#define NOTE_C5 523
#define NOTE_D5 587
#define NOTE_B4 494
#define NOTE_G4 392
#define NOTE_G5 784

void setup() {
  Serial.begin(115200);
  delay(2000);

  setenv("TZ", "UTC", 1);  // ENSURE mktime() is UTC
  tzset();

  Serial.println("ESP32 Notification System Starting...");

  // Initialize I2C for LCD
  Wire.begin(I2C_SDA, I2C_SCL);

  // Initialize LCD
  lcd.init();
  lcd.backlight();

  // Display startup message
  lcd.setCursor(0, 0);
  lcd.print(" ESP32 Starting...");
  lcd.setCursor(0, 1);
  lcd.print(" Initializing...");
  lcd.setCursor(0, 2);
  lcd.print(" System Ready");
  lcd.setCursor(0, 3);
  lcd.print(" Please Wait...");

  Serial.println("LCD initialized.");

  // Initialize LEDs as outputs
  pinMode(RED_LED_R, OUTPUT);
  pinMode(RED_LED_G, OUTPUT);
  pinMode(RED_LED_B, OUTPUT);
  pinMode(BLUE_LED_R, OUTPUT);
  pinMode(BLUE_LED_G, OUTPUT);
  pinMode(BLUE_LED_B, OUTPUT);
  pinMode(GREEN_LED_R, OUTPUT);
  pinMode(GREEN_LED_G, OUTPUT);
  pinMode(GREEN_LED_B, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  setAllLedsOff();

  Serial.println("LEDs and buzzer initialized.");

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");

  lcd.setCursor(0, 0);
  lcd.print(" Connecting WiFi...");
  lcd.setCursor(0, 1);
  lcd.print("                    ");
  lcd.setCursor(0, 2);
  lcd.print("                    ");
  lcd.setCursor(0, 3);
  lcd.print("                    ");

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("");
    Serial.println("WiFi connected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());

    lcd.setCursor(0, 0);
    lcd.print(" WiFi Connected!");
    lcd.setCursor(0, 1);
    lcd.print(" IP: ");
    lcd.setCursor(0, 2);
    lcd.print(" ");
    lcd.print(WiFi.localIP());
    lcd.setCursor(0, 3);
    lcd.print("                    ");

    // Configure time (removed time shift - now using UTC)
    configTime(0, 0, "pool.ntp.org");  // UTC time without offset
    Serial.println("Time configured");
    waitForNTP();
  } else {
    Serial.println("WiFi connection failed. Check credentials.");
    lcd.setCursor(0, 0);
    lcd.print(" WiFi Failed!");
    lcd.setCursor(0, 1);
    lcd.print(" Check Credentials");
    lcd.setCursor(0, 2);
    lcd.print("                    ");
    lcd.setCursor(0, 3);
    lcd.print("                    ");
  }

  delay(2000);

  // Test all LEDs and buzzer at startup
  Serial.println("Testing components...");
  testComponents();

  // Initialize display mode
  displayModeStartTime = millis();
  showingTime = false;

  lcd.setCursor(0, 0);
  lcd.print(" System Ready");
  lcd.setCursor(0, 1);
  lcd.print(" Monitoring RDVs...");
  lcd.setCursor(0, 2);
  lcd.print("                    ");
  lcd.setCursor(0, 3);
  lcd.print("                    ");

  Serial.println("Setup complete. System is now monitoring for appointments.");
}

void loop() {
  unsigned long currentMillis = millis();

  // Handle display mode switching (time display every 10 seconds)
  handleDisplayMode();

  // Check if it's time to make a request to Supabase
  if (currentMillis - lastRequestTime >= requestInterval) {
    lastRequestTime = currentMillis;
    fetchDataFromSupabase();
  }
}

// Function to remove French accents
String removeFrenchAccents(String text) {
  String result = text;

  // Replace common French accents
  result.replace("é", "e");
  result.replace("è", "e");
  result.replace("ê", "e");
  result.replace("ë", "e");
  result.replace("à", "a");
  result.replace("â", "a");
  result.replace("ä", "a");
  result.replace("ù", "u");
  result.replace("û", "u");
  result.replace("ü", "u");
  result.replace("ï", "i");
  result.replace("î", "i");
  result.replace("ô", "o");
  result.replace("ö", "o");
  result.replace("ç", "c");
  result.replace("ÿ", "y");

  // Uppercase versions
  result.replace("É", "E");
  result.replace("È", "E");
  result.replace("Ê", "E");
  result.replace("Ë", "E");
  result.replace("À", "A");
  result.replace("Â", "A");
  result.replace("Ä", "A");
  result.replace("Ù", "U");
  result.replace("Û", "U");
  result.replace("Ü", "U");
  result.replace("Ï", "I");
  result.replace("Î", "I");
  result.replace("Ô", "O");
  result.replace("Ö", "O");
  result.replace("Ç", "C");
  result.replace("Ÿ", "Y");

  return result;
}

// Function to convert date from YYYY-MM-DD to DD/MM/YYYY format
String formatDateForDisplay(String isoDate) {
  if (isoDate.length() >= 10) {
    String year = isoDate.substring(0, 4);
    String month = isoDate.substring(5, 7);
    String day = isoDate.substring(8, 10);
    return day + "/" + month + "/" + year;
  }
  return isoDate;  // Return original if format is unexpected
}

// Handle display mode switching between normal content and time
void handleDisplayMode() {
  unsigned long currentMillis = millis();
  unsigned long elapsedTime = currentMillis - displayModeStartTime;

  if (!showingTime && elapsedTime >= NORMAL_DISPLAY_DURATION) {
    // Switch to time display
    showingTime = true;
    displayModeStartTime = currentMillis;
    displayLargeTime();
  } else if (showingTime && elapsedTime >= TIME_DISPLAY_DURATION) {
    // Switch back to normal display
    showingTime = false;
    displayModeStartTime = currentMillis;
    displayNormalContent();
  }
}

// Display large time across the LCD
void displayLargeTime() {
  lcd.clear();
  if (currentDateTime.length() > 0) {
    // currentDateTime = "10/06/2025 17:59:27"
    int spacePos = currentDateTime.indexOf(' ');
    String dateStr = currentDateTime.substring(0, spacePos);
    String timeStr = currentDateTime.substring(spacePos + 1);
    lcd.setCursor(8, 1);
    lcd.print(timeStr.substring(0, 5));  // "HH:MM"
    lcd.setCursor(8, 0);
    lcd.print("Heure");
    lcd.setCursor(6, 2);
    lcd.print("---------");
    lcd.setCursor(5, 3);
    lcd.print(dateStr);
  } else {
    lcd.setCursor(4, 1);
    lcd.print("NO TIME DATA");
  }
}

// Display normal content (user info and next rdv)
void displayNormalContent() {
  lcd.clear();

  // Display next RDV info
  if (nextRdvDate.length() > 0) {
    // Line 0: Date and time (format date properly)
    lcd.setCursor(0, 0);
    lcd.print("RDV le ");
    lcd.print(formatDateForDisplay(nextRdvDate));

    // Line 1: Time and title
    lcd.setCursor(0, 1);
    lcd.print("A ");
    lcd.print(nextRdvTime.substring(0, 5));
    if (nextRdvTitle.length() > 0) {
      lcd.print(", ");
      lcd.print(removeFrenchAccents(nextRdvTitle).substring(0, 12));
    }

    // Line 2 & 3: Content
    if (nextRdvContent.length() > 0) {
      String cleanContent = removeFrenchAccents(nextRdvContent);
      lcd.setCursor(0, 2);
      lcd.print("                    ");  // Clear line
      lcd.setCursor(0, 2);
      if (cleanContent.length() <= 20) {
        lcd.print(cleanContent);
      } else {
        lcd.print(cleanContent.substring(0, 20));
        lcd.setCursor(0, 3);
        lcd.print("                    ");  // Clear line
        lcd.setCursor(0, 3);
        if (cleanContent.length() > 20) {
          lcd.print(cleanContent.substring(20, min(40, (int)cleanContent.length())));
        }
      }
    } else {
      lcd.setCursor(0, 2);
      lcd.print("                    ");
      lcd.setCursor(0, 3);
      lcd.print("                    ");
    }
  } else {
    lcd.setCursor(0, 0);
    lcd.print("Aucun RDV trouve");
    lcd.setCursor(0, 1);
    lcd.print("                    ");
    lcd.setCursor(0, 2);
    lcd.print("                    ");
    lcd.setCursor(0, 3);
    lcd.print("                    ");
  }
}

void fetchDataFromSupabase() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    http.begin(supabaseUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", apiKey);
    http.addHeader("Prefer", "return=representation");

    String payload = "{\"user_id\": \"";
    payload += userId;
    payload += "\"}";

    int httpCode = http.POST(payload);

    if (httpCode > 0) {
      if (httpCode == HTTP_CODE_OK) {
        String response = http.getString();
        Serial.println("Response: " + response);  // Debug print
        processResponse(response);
      }
    }

    http.end();
  } else {
    reconnectWiFi();
  }
}

void processResponse(String response) {
  DynamicJsonDocument doc(4096);

  DeserializationError error = deserializeJson(doc, response);

  if (error) {
    Serial.println("JSON parsing failed");
    return;
  }

  // Extract user info and current time from Supabase
  const char* dateStr = doc["date"];
  const char* timeStr = doc["time"];
  const char* prenom = doc["prenom"];
  const char* nom = doc["nom"];

  // Store user info for display
  if (prenom != nullptr) {
    currentUserName = removeFrenchAccents(String(prenom));
  }

  if (dateStr != nullptr && timeStr != nullptr) {
    currentDateTime = String(dateStr) + " " + String(timeStr);
  }

  JsonArray rdvs = doc["rdvs"];

  // Clear previous RDV info
  nextRdvDate = "";
  nextRdvTime = "";
  nextRdvTitle = "";
  nextRdvContent = "";

  if (rdvs.size() > 0) {
    // Get the first (next) RDV
    JsonObject nextRdv = rdvs[0];
    const char* rdvDate = nextRdv["date"];
    const char* titre = nextRdv["titre"];
    const char* contenu = nextRdv["contenu"];

    if (rdvDate != nullptr) {
      // Parse the ISO date format (2025-05-13T17:30:00+00:00)
      String fullDateTime = String(rdvDate);

      // Find the 'T' separator between date and time
      int tIndex = fullDateTime.indexOf('T');
      if (tIndex > 0) {
        nextRdvDate = fullDateTime.substring(0, tIndex);

        // Extract time part (everything after T until + or Z)
        String timePart = fullDateTime.substring(tIndex + 1);
        int plusIndex = timePart.indexOf('+');
        int zIndex = timePart.indexOf('Z');

        if (plusIndex > 0) {
          nextRdvTime = timePart.substring(0, plusIndex);
        } else if (zIndex > 0) {
          nextRdvTime = timePart.substring(0, zIndex);
        } else {
          nextRdvTime = timePart;
        }
      } else {
        nextRdvDate = fullDateTime;
      }

      Serial.println("Parsed date: " + nextRdvDate);
      Serial.println("Parsed time: " + nextRdvTime);
    }

    if (titre != nullptr) {
      nextRdvTitle = String(titre);
      Serial.println("Title: " + nextRdvTitle);
    }

    if (contenu != nullptr) {
      nextRdvContent = String(contenu);
      Serial.println("Content: " + nextRdvContent);
    }

    // Check for time alerts
    if (rdvDate != nullptr && strlen(rdvDate) > 0) {
      time_t appointmentTime = parseDateTime(rdvDate);

      if (appointmentTime == -1) {
        appointmentTime = parseDateTimeFrench(rdvDate);
      }

      if (appointmentTime != -1) {
        String apiDateStr = doc["date"];                        // "10/06/2025"
        String apiTimeStr = doc["time"];                        // "18:09:42"
        String serverDateTime = apiDateStr + " " + apiTimeStr;  // "10/06/2025 18:09:42"
        time_t serverTime = parseDateTimeFrench(serverDateTime.c_str());

        int diffMinutes = (appointmentTime - serverTime) / 60;

        // Debug print
        Serial.println("----- TIME DEBUG -----");
        Serial.print("appointmentTime (epoch): ");
        Serial.println(appointmentTime);
        Serial.print("serverTime (epoch): ");
        Serial.println(serverTime);

        char buf1[30], buf2[30];
        struct tm* tm1 = gmtime(&appointmentTime);
        struct tm* tm2 = gmtime(&serverTime);
        strftime(buf1, sizeof(buf1), "%Y-%m-%d %H:%M:%S UTC", tm1);
        strftime(buf2, sizeof(buf2), "%Y-%m-%d %H:%M:%S UTC", tm2);
        Serial.print("appointmentTime: ");
        Serial.println(buf1);
        Serial.print("serverTime: ");
        Serial.println(buf2);
        Serial.print("diffMinutes = ");
        Serial.println(diffMinutes);
        Serial.println("----------------------");

        checkTimeAndTriggerAlerts(diffMinutes, String(titre));
      }
    }
  }

  // Update display if not showing time
  if (!showingTime) {
    displayNormalContent();
  }
}

void checkTimeAndTriggerAlerts(int diffMinutes, String message) {
  message = removeFrenchAccents(message);

  if (abs(diffMinutes) <= 1) {
    if (!showingTime) {
      lcd.setCursor(0, 0);
      lcd.print("ALERTE! 1 MIN!");
      for (int i = 14; i < 20; i++) lcd.print(" ");
      lcd.setCursor(0, 1);
      lcd.print(message.substring(0, 19));
    }
    setRedLed(true);
    playPhoneRing();       // <- phone ring instead of star wars
    setRedLed(false);
  } else if (abs(diffMinutes) == 2) {
    if (!showingTime) {
      lcd.setCursor(0, 0);
      lcd.print("ALERTE! 2 MIN!");
      for (int i = 14; i < 20; i++) lcd.print(" ");
      lcd.setCursor(0, 1);
      lcd.print(message.substring(0, 19));
    }
    setBlueLed(true);
    playTwoMelody();
    setBlueLed(false);
  } else if (abs(diffMinutes) == 5) {
    if (!showingTime) {
      lcd.setCursor(0, 0);
      lcd.print("ALERTE! 5 MIN!");
      for (int i = 14; i < 20; i++) lcd.print(" ");
      lcd.setCursor(0, 1);
      lcd.print(message.substring(0, 19));
    }
    setGreenLed(true);
    playThreeMelody();
    setGreenLed(false);
  }
}

void reconnectWiFi() {
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    attempts++;
  }
}

time_t parseDateTime(const char* dateTimeStr) {
  struct tm tm = { 0 };
  int year, month, day, hour, minute, second;

  char dateCopy[30];
  strncpy(dateCopy, dateTimeStr, sizeof(dateCopy) - 1);
  dateCopy[sizeof(dateCopy) - 1] = '\0';

  for (int i = 0; dateCopy[i] != '\0'; i++) {
    if (dateCopy[i] == 'T') dateCopy[i] = ' ';
  }

  if (sscanf(dateCopy, "%d-%d-%d %d:%d:%d",
             &year, &month, &day, &hour, &minute, &second)
      != 6) {
    return -1;
  }

  tm.tm_year = year - 1900;
  tm.tm_mon = month - 1;
  tm.tm_mday = day;
  tm.tm_hour = hour;
  tm.tm_min = minute;
  tm.tm_sec = second;

  return mktime(&tm);
}

time_t parseDateTimeFrench(const char* dateTimeStr) {
  struct tm tm = { 0 };
  int day, month, year, hour, minute, second;

  if (sscanf(dateTimeStr, "%d/%d/%d %d:%d:%d",
             &day, &month, &year, &hour, &minute, &second)
      != 6) {
    return -1;
  }

  tm.tm_year = year - 1900;
  tm.tm_mon = month - 1;
  tm.tm_mday = day;
  tm.tm_hour = hour;
  tm.tm_min = minute;
  tm.tm_sec = second;

  return mktime(&tm);
}

void setRedLed(bool state) {
  digitalWrite(RED_LED_R, state ? HIGH : LOW);
  digitalWrite(RED_LED_G, LOW);
  digitalWrite(RED_LED_B, LOW);
}

void setBlueLed(bool state) {
  digitalWrite(BLUE_LED_R, LOW);
  digitalWrite(BLUE_LED_G, LOW);
  digitalWrite(BLUE_LED_B, state ? HIGH : LOW);
}

void setGreenLed(bool state) {
  digitalWrite(GREEN_LED_R, LOW);
  digitalWrite(GREEN_LED_G, state ? HIGH : LOW);
  digitalWrite(GREEN_LED_B, LOW);
}

void setAllLedsOff() {
  digitalWrite(RED_LED_R, LOW);
  digitalWrite(RED_LED_G, LOW);
  digitalWrite(RED_LED_B, LOW);
  digitalWrite(BLUE_LED_R, LOW);
  digitalWrite(BLUE_LED_G, LOW);
  digitalWrite(BLUE_LED_B, LOW);
  digitalWrite(GREEN_LED_R, LOW);
  digitalWrite(GREEN_LED_G, LOW);
  digitalWrite(GREEN_LED_B, LOW);
}

void playStarWarsTheme() {
  tone(PIN_BUZZER, NOTE_A4);
  delay(500);
  noTone(PIN_BUZZER);
  delay(20);

  tone(PIN_BUZZER, NOTE_A4);
  delay(500);
  noTone(PIN_BUZZER);
  delay(20);

  tone(PIN_BUZZER, NOTE_A4);
  delay(500);
  noTone(PIN_BUZZER);
  delay(20);

  tone(PIN_BUZZER, NOTE_F5);
  delay(350);
  noTone(PIN_BUZZER);
  delay(20);

  tone(PIN_BUZZER, NOTE_C5);
  delay(150);
  noTone(PIN_BUZZER);
  delay(20);

  tone(PIN_BUZZER, NOTE_A4);
  delay(500);
  noTone(PIN_BUZZER);
  delay(20);

  tone(PIN_BUZZER, NOTE_F5);
  delay(350);
  noTone(PIN_BUZZER);
  delay(20);

  tone(PIN_BUZZER, NOTE_C5);
  delay(150);
  noTone(PIN_BUZZER);
  delay(20);

  tone(PIN_BUZZER, NOTE_A4);
  delay(650);
  noTone(PIN_BUZZER);
  delay(20);

  tone(PIN_BUZZER, NOTE_E5);
  delay(500);
  noTone(PIN_BUZZER);
  delay(20);

  tone(PIN_BUZZER, NOTE_E5);
  delay(500);
  noTone(PIN_BUZZER);
  delay(20);

  tone(PIN_BUZZER, NOTE_E5);
  delay(500);
  noTone(PIN_BUZZER);
  delay(20);

  tone(PIN_BUZZER, NOTE_F5);
  delay(350);
  noTone(PIN_BUZZER);
  delay(20);

  tone(PIN_BUZZER, NOTE_C5);
  delay(150);
  noTone(PIN_BUZZER);
  delay(20);

  noTone(PIN_BUZZER);
}

void playTwoMelody() {
  tone(PIN_BUZZER, 800);
  delay(400);
  tone(PIN_BUZZER, 1000);
  delay(400);
  tone(PIN_BUZZER, 1200);
  delay(400);
  noTone(PIN_BUZZER);
  delay(200);

  tone(PIN_BUZZER, 800);
  delay(400);
  tone(PIN_BUZZER, 1000);
  delay(400);
  noTone(PIN_BUZZER);
}

void playThreeMelody() {
  tone(PIN_BUZZER, 1200);
  delay(300);
  tone(PIN_BUZZER, 1000);
  delay(300);
  tone(PIN_BUZZER, 800);
  delay(300);
  tone(PIN_BUZZER, 600);
  delay(300);
  noTone(PIN_BUZZER);
  delay(300);

  tone(PIN_BUZZER, 600);
  delay(300);
  tone(PIN_BUZZER, 800);
  delay(300);
  tone(PIN_BUZZER, 1000);
  delay(300);
  tone(PIN_BUZZER, 1200);
  delay(300);
  noTone(PIN_BUZZER);
}

void testComponents() {
  lcd.setCursor(0, 0);
  lcd.print(" Testing LCD...");
  lcd.setCursor(0, 1);
  lcd.print("                    ");
  delay(1000);

  lcd.setCursor(0, 1);
  lcd.print(" Testing RED LED");
  setRedLed(true);
  delay(1000);
  setRedLed(false);

  lcd.setCursor(0, 1);
  lcd.print(" Testing BLUE LED");
  setBlueLed(true);
  delay(1000);
  setBlueLed(false);

  lcd.setCursor(0, 1);
  lcd.print(" Testing GREEN LED");
  setGreenLed(true);
  delay(1000);
  setGreenLed(false);

  lcd.setCursor(0, 1);
  lcd.print(" Testing BUZZER");
  tone(PIN_BUZZER, NOTE_A4);
  delay(200);
  tone(PIN_BUZZER, NOTE_A4);
  delay(200);
  tone(PIN_BUZZER, NOTE_A4);
  delay(200);
  tone(PIN_BUZZER, NOTE_F5);
  delay(150);
  tone(PIN_BUZZER, NOTE_C5);
  delay(150);
  noTone(PIN_BUZZER);
}

void playPhoneRing() {
  for (int j = 0; j < 3; j++) {          // 3 rings
    for (int i = 0; i < 2; i++) {        // Like "briinnng... briinnng..."
      tone(PIN_BUZZER, 1000);
      delay(200);
      tone(PIN_BUZZER, 1300);
      delay(100);
      noTone(PIN_BUZZER);
      delay(120);
    }
    delay(400); // Pause between rings
  }
}

void waitForNTP() {
  Serial.print("Waiting for NTP time sync...");
  struct tm timeinfo;
  int retry = 0;
  const int retry_count = 20;
  while (!getLocalTime(&timeinfo) && retry < retry_count) {
    Serial.print(".");
    delay(500);
    retry++;
  }
  if (!getLocalTime(&timeinfo)) {
    Serial.println(" Failed to get NTP time!");
  } else {
    Serial.println(" Time set.");
  }
}