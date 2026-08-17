# miniKast Android TV & Amazon Fire TV Player

Native Android TV & Fire OS kiosk player application for **miniKast**.

---

## Features

* **Auto-Start on Boot:** Automatically launches into the menu player on TV / Fire Stick power-up.
* **24/7 Wake-Lock:** Keeps the display active, preventing TV sleep or ambient screensavers.
* **Hardware-Accelerated Web Engine:** Renders the miniKast web player (`/tv`) with GPU acceleration and full caching.
* **Auto-Reconnect Watchdog:** Automatically retries and reconnects when Wi-Fi or server connectivity drops.
* **TV Remote Control Shortcuts:**
  * **`MENU` button:** Open Server URL settings (switch between local dev and production).
  * **`PLAY/PAUSE` or `R` key:** Immediately refresh/reload the player.
  * **`BACK` button:** Shows exit confirmation to prevent accidental closure.

---

## How to Build & Install

### 1. Build the APK via Gradle / Android Studio
Open the `apps/tv-android` project in **Android Studio**, or run:
```bash
cd apps/tv-android
./gradlew assembleDebug
```
The output APK will be generated at:
`apps/tv-android/app/build/outputs/apk/debug/app-debug.apk`

---

### 2. Sideload to an Amazon Fire TV Stick

1. **Enable Developer Options on Fire TV:**
   * Go to **Settings** $\rightarrow$ **My Fire TV** $\rightarrow$ **About**.
   * Click your Fire TV device name 7 times until it says *"You are now a developer."*
   * Go back to **Developer Options** $\rightarrow$ Turn **ON** `ADB Debugging` and `Apps from Unknown Sources`.
2. **Find Fire TV IP Address:**
   * Go to **Settings** $\rightarrow$ **My Fire TV** $\rightarrow$ **About** $\rightarrow$ **Network** (e.g. `192.168.1.150`).
3. **Install via ADB over Wi-Fi:**
   ```bash
   adb connect 192.168.1.150:5555
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

---

### 3. Sideload to Google TV / Chromecast / Android TV

1. **Enable Developer Options & USB/Network Debugging:**
   * **Settings** $\rightarrow$ **System** $\rightarrow$ **About** $\rightarrow$ Click **Android TV OS build** 7 times.
   * **Settings** $\rightarrow$ **System** $\rightarrow$ **Developer options** $\rightarrow$ Enable **Network debugging**.
2. **Install via ADB:**
   ```bash
   adb connect <TV_IP_ADDRESS>:5555
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```
