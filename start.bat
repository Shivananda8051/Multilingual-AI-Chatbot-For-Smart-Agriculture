@echo off

echo Starting client...
cd client
start cmd /k "npm run dev"

echo Starting server...
cd ..
cd server
start cmd /k "npm run dev"