@echo off
REM Build script for Campus Connect Android app
REM Sets JAVA_HOME to the Gradle-managed JDK and ANDROID_HOME correctly

set "JAVA_HOME=C:\Users\USER\.gradle\jdks\eclipse_adoptium-17-amd64-windows.2"
set "ANDROID_HOME=C:\Users\USER\AppData\Local\Android\Sdk"
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"

echo JAVA_HOME=%JAVA_HOME%
echo ANDROID_HOME=%ANDROID_HOME%
echo.
echo Java version:
"%JAVA_HOME%\bin\java.exe" -version
echo.

cd /d "C:\Users\USER\OneDrive\Desktop\campus-connect\apps\mobile\android"
echo.
echo Stopping old Gradle daemons...
call gradlew.bat --stop
echo.
echo Starting fresh debug build...
call gradlew.bat assembleDebug --info --stacktrace 2>&1
