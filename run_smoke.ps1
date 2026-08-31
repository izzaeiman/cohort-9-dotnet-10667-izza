$baseUrl = "http://localhost:5000/api"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Host "=== 1. FETCH ANTIFORGERY TOKEN ==="
$csrfRes = Invoke-WebRequest -Uri "$baseUrl/auth/antiforgery-token" -SessionVariable session -Method Get
Write-Host "CSRF Token Response: $($csrfRes.Content)"
$csrfObj = $csrfRes.Content | ConvertFrom-Json
$csrfToken = $csrfObj.token

Write-Host "`n=== 2. REGISTER USER & CHECK COOKIES ==="
$regBody = @{ name = "QA Smoke User"; email = "qasmoke_$(Get-Random)@test.com"; password = "Password123!" } | ConvertTo-Json
$regRes = Invoke-WebRequest -Uri "$baseUrl/auth/register" -SessionVariable session -Method Post -Body $regBody -ContentType "application/json" -Headers @{ "X-XSRF-TOKEN" = $csrfToken }
Write-Host "Register Status: $($regRes.StatusCode)"
Write-Host "Register Response Body: $($regRes.Content)"

$cookies = $session.Cookies.GetCookies("http://localhost:5000")
foreach ($c in $cookies) {
    Write-Host "Cookie: $($c.Name) | HttpOnly: $($c.HttpOnly) | Secure: $($c.Secure) | SameSite: $($c.SameSite)"
}

Write-Host "`n=== 3. FIX 1 PROOF: POST WITHOUT CSRF TOKEN (EXPECT 403) ==="
try {
    $taskBodyNoCsrf = @{ title = "Task Without CSRF"; category = "Backend"; priority = "High" } | ConvertTo-Json
    $noCsrfRes = Invoke-WebRequest -Uri "$baseUrl/tasks" -SessionVariable session -Method Post -Body $taskBodyNoCsrf -ContentType "application/json"
    Write-Host "Unexpected Success: $($noCsrfRes.StatusCode)"
} catch [System.Net.WebException] {
    $errRes = $_.Response
    $reader = New-Object System.IO.StreamReader($errRes.GetResponseStream())
    $errBody = $reader.ReadToEnd()
    Write-Host "POST WITHOUT CSRF -> Status: $([int]$errRes.StatusCode) ($($errRes.StatusCode))"
    Write-Host "Response Body: $errBody"
}

Write-Host "`n=== 4. FIX 1 PROOF: POST WITH CSRF TOKEN (EXPECT 201) ==="
$taskBodyCsrf = @{ title = "Task With Valid CSRF"; category = "Backend"; priority = "High" } | ConvertTo-Json
$csrfPostRes = Invoke-WebRequest -Uri "$baseUrl/tasks" -SessionVariable session -Method Post -Body $taskBodyCsrf -ContentType "application/json" -Headers @{ "X-XSRF-TOKEN" = $csrfToken }
Write-Host "POST WITH CSRF -> Status: $($csrfPostRes.StatusCode)"
Write-Host "Response Body: $($csrfPostRes.Content)"

Write-Host "`n=== 5. FIX 9 PROOF: FETCH TASKS AND VERIFY CATEGORY ENUM ==="
$getTasksRes = Invoke-WebRequest -Uri "$baseUrl/tasks" -SessionVariable session -Method Get
Write-Host "Get Tasks Response Body: $($getTasksRes.Content)"

Write-Host "`n=== 6. FIX 3 PROOF: REFRESH TOKEN ROTATION & REUSE REJECTION ==="
$initialRefreshToken = $session.Cookies.GetCookies("http://localhost:5000")["refresh_token"].Value
Write-Host "Captured Initial Refresh Token: $initialRefreshToken"

# Call refresh 1 (valid)
$refresh1Res = Invoke-WebRequest -Uri "$baseUrl/auth/refresh" -SessionVariable session -Method Post
Write-Host "Refresh 1 (Valid) Status: $($refresh1Res.StatusCode)"
$newRefreshToken = $session.Cookies.GetCookies("http://localhost:5000")["refresh_token"].Value
Write-Host "New Rotated Refresh Token: $newRefreshToken"

# Call refresh 2 with OLD refresh token (reuse attack)
$oldSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$oldCookie = New-Object System.Net.Cookie("refresh_token", $initialRefreshToken, "/", "localhost")
$oldSession.Cookies.Add($oldCookie)

try {
    $reuseRes = Invoke-WebRequest -Uri "$baseUrl/auth/refresh" -WebSession $oldSession -Method Post
    Write-Host "Unexpected Reuse Success: $($reuseRes.StatusCode)"
} catch [System.Net.WebException] {
    $errRes = $_.Response
    $reader = New-Object System.IO.StreamReader($errRes.GetResponseStream())
    $errBody = $reader.ReadToEnd()
    Write-Host "REFRESH TOKEN REUSE -> Status: $([int]$errRes.StatusCode) ($($errRes.StatusCode))"
    Write-Host "Response Body: $errBody"
}

Write-Host "`n=== 7. SMOKE TEST: EDIT & DELETE TASK ==="
$createdTaskObj = $csrfPostRes.Content | ConvertFrom-Json
$taskId = $createdTaskObj.id

# Edit task
$editBody = @{ title = "Task Updated via Smoke Test"; category = "UiUxDesign"; status = "InProgress" } | ConvertTo-Json
$editRes = Invoke-WebRequest -Uri "$baseUrl/tasks/$taskId" -SessionVariable session -Method Put -Body $editBody -ContentType "application/json" -Headers @{ "X-XSRF-TOKEN" = $csrfToken }
Write-Host "Edit Task Status: $($editRes.StatusCode)"

# Delete task
$deleteRes = Invoke-WebRequest -Uri "$baseUrl/tasks/$taskId" -SessionVariable session -Method Delete -Headers @{ "X-XSRF-TOKEN" = $csrfToken }
Write-Host "Delete Task Status: $($deleteRes.StatusCode)"

# Logout
$logoutRes = Invoke-WebRequest -Uri "$baseUrl/auth/logout" -SessionVariable session -Method Post -Headers @{ "X-XSRF-TOKEN" = $csrfToken }
Write-Host "Logout Status: $($logoutRes.StatusCode)"
