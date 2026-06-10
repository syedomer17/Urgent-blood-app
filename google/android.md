# LifeLink Android Project Setup Guide

This document provides instructions on how to set up and run the **LifeLink** (Urgent Blood App) Android project using Android Studio.

## 1. Prerequisites

Before you begin, ensure you have the following installed and configured:

### 1.1 Android Studio
- **Version:** Android Studio **Ladybug (2024.2.1)** or newer is recommended.
- The project uses **Android Gradle Plugin (AGP) 9.1.1** and **Kotlin 2.2.10**, which require a very recent version of Android Studio.

### 1.2 Java Development Kit (JDK)
- **Required Version:** **JDK 11** or newer.
- Ensure that Android Studio is configured to use JDK 11 for Gradle builds (Settings > Build, Execution, Deployment > Build Tools > Gradle > Gradle JDK).

### 1.3 Android SDK
- **Compile SDK:** 36
- **Target SDK:** 36
- **Minimum SDK:** 24 (Android 7.0 Nougat)
- Ensure you have the **Android 15+ (API 36)** SDK platforms and tools installed via the SDK Manager.

---

## 2. Getting Started

### 2.1 Opening the Project
1.  Open Android Studio.
2.  Select **Open** and navigate to the `google` folder in your project directory.
3.  Wait for Android Studio to index the files and initialize the project.

### 2.2 Environment Configuration (Secrets)
The project uses the `secrets-gradle-plugin` to manage sensitive information like API keys.

1.  In the root of the `google` folder, look for `.env.example`.
2.  Create a new file named **`.env`** in the same directory.
3.  Copy the contents of `.env.example` into `.env`.
4.  Replace the placeholder values with your actual keys:
    ```env
    GEMINI_API_KEY=your_actual_api_key_here
    ```
    *Note: The `GEMINI_API_KEY` is required for AI-powered features within the app.*

### 2.3 Gradle Sync
1.  Once you've created the `.env` file, click on **Sync Project with Gradle Files** (usually an elephant icon in the top right or a bar at the top).
2.  Wait for the sync to complete. If there are errors, ensure you have an active internet connection to download dependencies.

---

## 3. Project Structure & Tech Stack

- **UI Framework:** [Jetpack Compose](https://developer.android.com/jetpack/compose) for a modern, declarative UI.
- **Architecture:** MVVM (Model-View-ViewModel) with a central `MainViewModel`.
- **Navigation:** State-based navigation handled in `MainActivity.kt` via `MainViewModel`.
- **Networking:** [Retrofit](https://square.github.io/retrofit/) & [OkHttp](https://square.github.io/okhttp/) for API calls.
- **JSON Parsing:** [Moshi](https://github.com/square/moshi) with Kotlin Codegen.
- **Local Database:** [Room](https://developer.android.com/training/data-storage/room) for local persistence.
- **Asynchronous Work:** [Kotlin Coroutines](https://kotlinlang.org/docs/coroutines-overview.html) & [Flow](https://kotlinlang.org/docs/flow.html).
- **Dependency Versioning:** Managed via `gradle/libs.versions.toml` (Version Catalog).

---

## 4. Running the App

1.  Connect an Android device via USB or start an Android Emulator (API 24+).
2.  In Android Studio, select the **app** configuration in the top toolbar.
3.  Click the **Run** button (green play icon).

---

## 5. Troubleshooting

- **SDK API 36 Not Found:** Go to `Tools > SDK Manager` and ensure "Android 15.0 (VanillaIceCream)" or the latest available SDK is installed. If API 36 is not yet available in your region/version, you might need to use a Preview channel of Android Studio.
- **Secrets Plugin Errors:** Ensure the `.env` file exists in the correct directory. If it still fails, try `Build > Clean Project` then `Rebuild Project`.
- **JDK Mismatch:** Go to `File > Project Structure > SDK Location` and ensure the Gradle JDK is set to at least version 11.

---

## 6. Development Tips

- **Theme:** The app uses a custom theme with frosted glass effects. See `ui/theme/` for color and style definitions.
- **Screens:** All screens are located in `ui/screens/` (Auth, Dashboard, etc.).
- **Data Layer:** API definitions are in `data/api/` and data models in `data/model/`.
