cd frontend
npm ci
npm run build

cd ../
rm -rf ./frontend

cd backend
npm ci
npm run build