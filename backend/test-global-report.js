import 'dotenv/config';
import { connectDB } from './src/config/db.js';
import { getGlobalReport } from './src/controllers/reportController.js';
import mongoose from 'mongoose';

async function test() {
  await connectDB();
  const req = { query: { shiftLabel: 'latest' }};
  const res = {
    json: (data) => console.log(JSON.stringify(data, null, 2)),
    status: (code) => ({ json: (data) => console.log(code, data) })
  };
  const next = (err) => console.error(err);
  
  await getGlobalReport(req, res, next);
  await mongoose.disconnect();
}

test();
