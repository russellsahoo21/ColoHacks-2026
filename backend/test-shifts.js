import 'dotenv/config';
import { connectDB } from './src/config/db.js';
import { getGlobalReport } from './src/controllers/reportController.js';
import mongoose from 'mongoose';

async function testShift(shiftLabel) {
  return new Promise((resolve) => {
    const req = { query: { shiftLabel: shiftLabel }};
    const res = {
      json: (data) => resolve(data),
      status: (code) => ({ json: (data) => resolve(data) })
    };
    const next = (err) => { console.error(err); resolve(null); };
    getGlobalReport(req, res, next);
  });
}

async function run() {
  await connectDB();
  const latest = await testShift('latest');
  const morning = await testShift('morning');
  const afternoon = await testShift('afternoon');
  const evening = await testShift('evening');
  
  console.log('LATEST bounds:', latest.reportSummary.windowStart, latest.reportSummary.windowEnd, 'Admissions:', latest.completedAdmissions.length);
  console.log('MORNING bounds:', morning.reportSummary.windowStart, morning.reportSummary.windowEnd, 'Admissions:', morning.completedAdmissions.length);
  console.log('AFTERNOON bounds:', afternoon.reportSummary.windowStart, afternoon.reportSummary.windowEnd, 'Admissions:', afternoon.completedAdmissions.length);
  console.log('EVENING bounds:', evening.reportSummary.windowStart, evening.reportSummary.windowEnd, 'Admissions:', evening.completedAdmissions.length);
  
  await mongoose.disconnect();
}

run();
