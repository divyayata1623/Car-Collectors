@echo off
title CAR COLLECTORS - Frontend
cd frontend
echo Starting Frontend Server on http://localhost:3000
echo Opening browser in 10 seconds...
echo Keep this window open!
timeout /t 10 /nobreak > nul
start http://localhost:3000
npm run dev
