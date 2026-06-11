const mongoose = require('mongoose');
const Resume = require('./models/Resume');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const resume = await Resume.findOne().sort({ createdAt: -1 });
    console.log("Resume isAnalyzed:", resume.isAnalyzed);
    console.log("Resume parsedData:", JSON.stringify(resume.parsedData, null, 2));
    process.exit(0);
});
