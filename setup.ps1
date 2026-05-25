# AptiFyx Setup Script (PowerShell)

Write-Host "🚀 Setting up AptiFyx..." -ForegroundColor Cyan

# Backend setup
Write-Host "`n📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Backend npm install failed" -ForegroundColor Red; exit 1 }

Write-Host "`n🗄️  Setting up database..." -ForegroundColor Yellow
npx prisma generate
npx prisma db push
npx ts-node src/seed.ts

Write-Host "`n✅ Backend ready!" -ForegroundColor Green
Set-Location ..

# Mobile setup
Write-Host "`n📱 Installing mobile dependencies..." -ForegroundColor Yellow
Set-Location mobile
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Mobile npm install failed" -ForegroundColor Red; exit 1 }

Write-Host "`n✅ Mobile ready!" -ForegroundColor Green
Set-Location ..

Write-Host @"

🎉 AptiFyx is ready!

To start the backend:
  cd backend
  npm run dev

To start the mobile app:
  cd mobile
  npx expo start

Demo accounts (use any 6-digit OTP in dev mode):
  📱 Customer: 9876543210
  🔧 Provider (Electrician): 9988776655
  🔧 Provider (Plumbing):    9911223344
"@ -ForegroundColor Cyan
