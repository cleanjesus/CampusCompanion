// Dependencies
require("dotenv").config();
const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const { InferenceClient } = require("@huggingface/inference");

// Express app setup
const app = express();
app.use(express.static(__dirname + "/views"));
app.use(express.static(__dirname + "/public"));

const server = app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});

// Socket.io setup
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// HuggingFace client setup
const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

// Mental health system prompt
const MENTAL_HEALTH_PROMPT = `You are a supportive mental health companion for students and young people. You are not a therapist or a replacement for professional mental health care. Your role is to listen compassionately, provide general guidance, and suggest healthy coping strategies. For any serious mental health concerns, you must always recommend that the student speak with a qualified counselor, therapist, or mental health professional.

Your primary focus is on supporting students and young people who may be experiencing a range of emotional and life challenges, including but not limited to:
- Stress from school, exams, or academic deadlines
- Anxiety or sadness related to balancing school with work, hobbies, or personal responsibilities
- Struggles with unsupportive or absent parents, including feeling misunderstood or emotionally neglected
- The emotional impact of losing a friend, classmate, or loved one
- Financial worries about education, such as parents refusing to support tuition or school-related expenses
- Difficulty transitioning into the workforce or facing uncertainty about the future

Your job is to:
1. Respond with empathy, understanding, and without judgment.
2. Validate the student's feelings and let them know they are not alone.
3. Suggest evidence-based coping strategies for stress, anxiety, and low mood—such as journaling, mindfulness, movement or exercise, time management techniques, healthy sleep habits, and social support.
4. Encourage students to speak with trusted adults, school counselors, or trained professionals when challenges become overwhelming or persistent.
5. Maintain a calm, supportive, and grounded tone—like a caring peer or trained listener—not like a medical expert.
6. Never attempt to diagnose mental health conditions or speculate on clinical causes.

Crisis Protocol:
If a student expresses thoughts of self-harm, suicide, or shows signs of serious distress, you must immediately:
- Urge them to seek help from a crisis service, mental health professional, or emergency services.
- Provide appropriate crisis hotline resources (e.g., 988 in the U.S., or other local/national mental health crisis lines).
- Emphasize that they do not need to go through it alone, and immediate help is available.

Always prioritize safety, emotional support, and the long-term wellbeing of the person you're speaking with.`;

// Data processing for student mental health data
const studentMentalHealthData = [];
const studentInsights = {
  commonChallenges: {},
  copingStrategies: {},
  stressFactors: {},
  isolationPatterns: {},
  habitChanges: {},
  moodPatterns: {},
  workInterest: {},
  socialIssues: {},
};

// Analyze student mental health data
function analyzeStudentData() {
  studentMentalHealthData.forEach((record) => {
    // Count stress factors
    if (record.Growing_Stress) {
      studentInsights.stressFactors[record.Growing_Stress] =
        (studentInsights.stressFactors[record.Growing_Stress] || 0) + 1;
    }

    // Track common coping struggles
    if (record.Coping_Struggles) {
      studentInsights.commonChallenges[record.Coping_Struggles] =
        (studentInsights.commonChallenges[record.Coping_Struggles] || 0) + 1;
    }

    // Track isolation patterns
    if (record.Days_Indoors) {
      studentInsights.isolationPatterns[record.Days_Indoors] =
        (studentInsights.isolationPatterns[record.Days_Indoors] || 0) + 1;
    }

    // Track changes in habits
    if (record.Changes_Habits) {
      studentInsights.habitChanges[record.Changes_Habits] =
        (studentInsights.habitChanges[record.Changes_Habits] || 0) + 1;
    }

    // Track mood patterns
    if (record.Mood_Swings) {
      studentInsights.moodPatterns[record.Mood_Swings] =
        (studentInsights.moodPatterns[record.Mood_Swings] || 0) + 1;
    }

    // Track work/academic interest
    if (record.Work_Interest) {
      studentInsights.workInterest[record.Work_Interest] =
        (studentInsights.workInterest[record.Work_Interest] || 0) + 1;
    }

    // Track social challenges
    if (record.Social_Weakness) {
      studentInsights.socialIssues[record.Social_Weakness] =
        (studentInsights.socialIssues[record.Social_Weakness] || 0) + 1;
    }
  });
}

function getEnhancedSystemPrompt() {
  // Get top student challenges
  const topChallenges = Object.entries(studentInsights.commonChallenges)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((entry) => entry[0])
    .join(", ");

  // Get top stressors
  const topStressors = Object.entries(studentInsights.stressFactors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((entry) => entry[0])
    .join(", ");

  // Get common isolation patterns
  const isolationTrends = Object.entries(studentInsights.isolationPatterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map((entry) => entry[0])
    .join(", ");

  // Get common social issues
  const socialChallenges = Object.entries(studentInsights.socialIssues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((entry) => entry[0])
    .join(", ");

  return `${MENTAL_HEALTH_PROMPT}
  
Based on actual student data, pay special attention to these common student challenges:
${topChallenges}

Top stressors reported by students include: ${topStressors}
Common isolation patterns include: ${isolationTrends}
Frequently reported social challenges: ${socialChallenges}

Focus your responses specifically on academic pressures, campus life, student relationships,
and the unique challenges faced by students in educational environments.
`;
}

// Load dataset
fs.createReadStream("./mental_health_dataset.csv")
  .pipe(csv())
  .on("data", (row) => {
    if (row.Occupation && row.Occupation.toLowerCase().includes("student")) {
      studentMentalHealthData.push(row);
    }
  })
  .on("end", () => {
    console.log(
      `Loaded ${studentMentalHealthData.length} student mental health records`
    );
    analyzeStudentData();
  });

// Routes
app.get("/", (_, res) => {
  res.sendFile("index.html");
});

// Socket.io event handling
io.on("connection", (socket) => {
  socket.on("chat message", async (msg) => {
    console.log("Received message:", msg);
    try {
      const chatCompletion = await client.chatCompletion({
        provider: "novita",
        model: "deepseek-ai/DeepSeek-V3-0324",
        messages: [
          {
            role: "system",
            content: getEnhancedSystemPrompt(),
          },
          {
            role: "user",
            content: msg,
          },
        ],
      });

      const response = chatCompletion.choices[0].message.content;
      console.log("Bot response:", response);
      socket.emit("bot response", response);
    } catch (error) {
      console.error("Detailed error:", {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      socket.emit(
        "bot response",
        "Sorry, I encountered an error processing your message."
      );
    }
  });
});
