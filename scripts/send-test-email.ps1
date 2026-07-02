param(
  [string]$Subject = 'Test support email',
  [string]$Body = 'This is a test email that should create a support ticket.',
  [string]$From = 'customer@example.com',
  [string]$ApiBaseUrl = 'http://localhost:4000'
)

$payload = @{ 
  from = $From
  subject = $Subject
  text = $Body
} | ConvertTo-Json -Compress

Invoke-RestMethod -Method Post -Uri "$ApiBaseUrl/api/email/inbound/resend" -ContentType 'application/json' -Body $payload
