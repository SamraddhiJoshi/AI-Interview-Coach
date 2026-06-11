$BASE_URL = "http://localhost:5000/api"

$loginBody = @{
    email = "testuser@example.com"
    password = "TestPassword123"
} | ConvertTo-Json

Write-Host "=== 1. Login ===" -ForegroundColor Cyan
$resp = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$token = $resp.token
Write-Host "Token received."

$pdfPath = "C:\Projects\ai-interview-coach\test_resume.pdf"
$resumeText = "Candidate Name: Jane Doe`nSkills: React, Node.js, MongoDB, Express`nProjects:`n- E-commerce Platform: Built with React and Node.js`n- Personal Portfolio: Built with HTML and CSS`nExperience: 2 years as Frontend Developer at TechCorp`nEducation: B.S. Computer Science, State University"

Write-Host "`n=== 2. Create Test Resume PDF ===" -ForegroundColor Cyan
# Create a valid minimal PDF using standard PDF structure
$pdfContent = @"
%PDF-1.4
1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj
2 0 obj <</Type/Pages/Kids[3 0 R]/Count 1>> endobj
3 0 obj <</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<<>>/Contents 4 0 R>> endobj
4 0 obj <</Length 55>> stream
BT /F1 12 Tf 50 700 Td ($resumeText) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000052 00000 n
0000000101 00000 n
0000000188 00000 n
trailer <</Size 5/Root 1 0 R>>
startxref
293
%%EOF
"@

[System.IO.File]::WriteAllText($pdfPath, $pdfContent)
Write-Host "Created test_resume.pdf"

Write-Host "`n=== 3. Upload & Analyze Resume ===" -ForegroundColor Cyan
Add-Type -AssemblyName System.Net.Http
$httpClient = New-Object System.Net.Http.HttpClient
$httpClient.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $token)

$form = New-Object System.Net.Http.MultipartFormDataContent
$fileStream = [System.IO.File]::OpenRead($pdfPath)
$streamContent = New-Object System.Net.Http.StreamContent($fileStream)
$streamContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("application/pdf")
$form.Add($streamContent, "resume", [System.IO.Path]::GetFileName($pdfPath))

$uploadTask = $httpClient.PostAsync("$BASE_URL/resume/upload", $form)
$uploadTask.Wait()
$uploadResult = $uploadTask.Result
$responseBody = $uploadResult.Content.ReadAsStringAsync().Result

Write-Host "Upload Status: $($uploadResult.StatusCode)"
Write-Host "Response: $responseBody"

$fileStream.Close()

Write-Host "`n=== 4. Generate Interview ===" -ForegroundColor Cyan
$interviewReq = @{
    role = "MERN Stack Developer"
    experienceLevel = "0-1 Years"
    numberOfQuestions = 5
} | ConvertTo-Json

$interviewResp = Invoke-RestMethod -Uri "$BASE_URL/interviews/generate" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Body $interviewReq
Write-Host "Interview Generation Status: Success"
Write-Host "Question Source: $($interviewResp.data.questionSource)"
Write-Host "Questions Generated:"
$interviewResp.data.questions | ForEach-Object { Write-Host "- $_" }

$httpClient.Dispose()
Remove-Item $pdfPath
