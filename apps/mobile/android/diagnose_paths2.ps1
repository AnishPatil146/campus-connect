$base = "C:\Users\USER\OneDrive\Desktop\campus-connect\node_modules\.pnpm\expo-modules-core@3.0.30_react-native@0.81.5_@babel+core@7.29.7_@react-native-community+cli@1_a2otg36iinjkdjbnvddxa5b2aa\node_modules\expo-modules-core\android"

$paths = @{
    "1. pnpm android base"                = $base
    "2. .cxx build dir (B flag)"          = $base + "\.cxx\Debug\150424o2\arm64-v8a"
    "3. prefab_command.bat in .cxx"       = $base + "\.cxx\Debug\150424o2\arm64-v8a\prefab_command.bat"
    "4. CMAKE_LIBRARY_OUTPUT_DIRECTORY"   = $base + "\build\intermediates\cxx\Debug\150424o2\obj\arm64-v8a"
    "5. CMAKE_FIND_ROOT_PATH (prefab)"    = $base + "\.cxx\Debug\150424o2\prefab\arm64-v8a\prefab"
    "6. build/intermediates/cxx/Debug"    = $base + "\build\intermediates\cxx\Debug\150424o2"
}

Write-Host "=== Path Length Analysis (MAX_PATH = 260) ==="
Write-Host ""
foreach ($name in $paths.Keys | Sort-Object) {
    $path = $paths[$name]
    $len = $path.Length
    $over = if ($len -gt 260) { "*** OVER 260 ***" } else { "OK" }
    Write-Host "[$over] $name - $len chars"
    Write-Host "  $path"
    Write-Host ""
}

# Check actual filesystem existence for the .cxx directory
Write-Host "=== .cxx directory actual existence ==="
$cxxDir = $base + "\.cxx\Debug\150424o2\arm64-v8a"
if (Test-Path $cxxDir) {
    Write-Host "EXISTS: $cxxDir"
    Get-ChildItem $cxxDir | Format-Table Name, Length
} else {
    Write-Host "NOT FOUND: $cxxDir"
}

# Check for prefab_command.bat
$prefabBat = $cxxDir + "\prefab_command.bat"
Write-Host ""
Write-Host "=== prefab_command.bat ==="
if (Test-Path $prefabBat) {
    Write-Host "EXISTS ($($prefabBat.Length) chars path): $prefabBat"
    Get-Content $prefabBat
} else {
    Write-Host "DOES NOT EXIST: $prefabBat"
    Write-Host "Path length: $($prefabBat.Length) chars"
}
