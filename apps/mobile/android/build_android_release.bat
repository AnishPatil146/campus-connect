@echo off
REM Release build script for Campus Connect Android app

set "JAVA_HOME=C:\Users\USER\.gradle\jdks\eclipse_adoptium-17-amd64-windows.2"
set "ANDROID_HOME=C:\Users\USER\AppData\Local\Android\Sdk"
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"

cd /d "C:\Users\USER\OneDrive\Desktop\campus-connect\apps\mobile\android"
echo Starting release build...
call gradlew.bat assembleRelease --info --stacktrace 2>&1
