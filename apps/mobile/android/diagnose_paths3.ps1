$newPath = "C:\Users\USER\OneDrive\Desktop\campus-connect\node_modules\.pnpm\expo-modules-core@3.0.30_react-native@0.81.5_@babel+core@7.29.7_@react-native-community+cli@1_a2otg36iinjkdjbnvddxa5b2aa\node_modules\expo-modules-core\android\build\intermediates\cxx\Debug\v489386l\logs\arm64-v8a\prefab_command.bat"
Write-Host "New failing path length: $($newPath.Length) chars"
Write-Host "$newPath"
Write-Host ""
# Check if this is actually a "logs" vs "arm64-v8a" path difference
$oldPath = "C:\Users\USER\OneDrive\Desktop\campus-connect\node_modules\.pnpm\expo-modules-core@3.0.30_react-native@0.81.5_@babel+core@7.29.7_@react-native-community+cli@1_a2otg36iinjkdjbnvddxa5b2aa\node_modules\expo-modules-core\android\.cxx\Debug\150424o2\arm64-v8a\prefab_command.bat"
Write-Host "Old failing path length: $($oldPath.Length) chars"
Write-Host ""
# The build/intermediates path 
$buildIntermediates = "C:\Users\USER\OneDrive\Desktop\campus-connect\node_modules\.pnpm\expo-modules-core@3.0.30_react-native@0.81.5_@babel+core@7.29.7_@react-native-community+cli@1_a2otg36iinjkdjbnvddxa5b2aa\node_modules\expo-modules-core\android\build\intermediates\cxx\Debug\v489386l"
Write-Host "build/intermediates/cxx/Debug/<hash> length: $($buildIntermediates.Length) chars"
Write-Host ""
Write-Host "Key insight: buildStagingDirectory only redirects .cxx/ NOT build/intermediates/"
Write-Host "The prefab_command.bat in build\intermediates\cxx\ is a DIFFERENT path than .cxx\"
