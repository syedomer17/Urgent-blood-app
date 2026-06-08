# Android Development & Build Guide

This guide explains how to take the React Native (Expo) mobile project, open it in Android Studio, run it on an emulator or physical device, and generate a standalone `.apk` or `.aab` file for distribution.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
1. **Node.js** (v18 or newer) and **pnpm** (or npm/yarn).
2. **Java Development Kit (JDK)**: Java 17 is recommended for modern React Native/Expo apps.
3. **Android Studio**: Download and install from [developer.android.com/studio](https://developer.android.com/studio).
4. **Android SDK**: During Android Studio installation, ensure the Android SDK, Android SDK Platform, and Android Virtual Device (AVD) are installed.

---

## Step 1: Prepare the Project

Since this is an Expo project, the native `android` folder is not tracked in version control by default. You need to generate it.

1. Open your terminal and navigate to the mobile folder:
   ```bash
   cd mobile
   ```
2. Install dependencies (if you haven't already):
   ```bash
   pnpm install
   ```
3. Generate the native Android project folder (`prebuild`):
   ```bash
   npx expo prebuild --platform android
   ```
   *This command creates an `android/` directory inside your `mobile/` folder containing the native Java/Kotlin and Gradle files.*

---

## Step 2: Open and Run in Android Studio

Now that the `android` folder exists, you can open it as a standard native Android project.

1. Launch **Android Studio**.
2. Click **Open** (or File > Open).
3. Navigate to your project directory and select the newly created **`Urgent-blood-app/mobile/android`** folder (do *not* select the root `mobile` folder, select the `android` folder inside it).
4. **Wait for Gradle Sync**: Android Studio will automatically download Gradle and configure the project. This may take a few minutes. Watch the progress bar at the bottom right.
5. **Set up an Emulator**:
   * Open the **Device Manager** (Tools > Device Manager).
   * Click **Create Device**, select a phone (e.g., Pixel 6), and download a system image (API 33 or 34 recommended).
   * Launch the emulator by clicking the Play icon next to your new device.
6. **Run the App**:
   * In Android Studio, ensure your emulator (or connected physical device) is selected in the top toolbar dropdown.
   * Click the green **Run** button (Shift + F10).
   * Android Studio will compile the app and launch it on the device.

*(Alternatively, you can run the app from your terminal without opening Android Studio by running `pnpm android` inside the `mobile` folder).*

---

## Step 3: Build an APK for Testing (Locally)

If you want to create an `.apk` file to install on physical devices for testing, you can generate it directly from Android Studio or the command line.

### Option A: Using Android Studio
1. In Android Studio, go to the top menu and select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
2. Wait for the build to complete.
3. A notification will appear in the bottom right corner. Click **locate** to open the folder containing your `app-debug.apk`.
4. You can transfer this file to your phone and install it.

### Option B: Using Command Line (Gradle)
1. Open your terminal and navigate to the generated `android` folder:
   ```bash
   cd mobile/android
   ```
2. Run the assemble command:
   ```bash
   # On macOS/Linux:
   ./gradlew assembleDebug
   
   # On Windows:
   gradlew assembleDebug
   ```
3. Once finished, your APK will be located at:
   `mobile/android/app/build/outputs/apk/debug/app-debug.apk`

---

## Step 4: Build a Production Release (APK or AAB)

When you are ready to publish your app to the Google Play Store, you need a signed release build.

### Option A: EAS Build (Recommended for Expo)
Expo Application Services (EAS) can build the app for you in the cloud, handling signing keys automatically.
1. Install EAS CLI: `npm install -g eas-cli`
2. Login to Expo: `eas login`
3. Configure the project: `eas build:configure`
4. Build the APK (for direct install): `eas build -p android --profile preview`
5. Build the AAB (for Google Play): `eas build -p android --profile production`

### Option B: Local Android Studio Build
If you prefer to build locally for production:
1. In Android Studio, go to **Build > Generate Signed Bundle / APK...**
2. Choose **APK** (for direct sharing) or **Android App Bundle** (required for Google Play).
3. Under **Key store path**, click **Create new...** to generate a new signing key (save the password and key alias in a secure place!).
4. Select the `release` build variant and click **Finish**.
5. The signed release file will be generated in `mobile/android/app/release/`.