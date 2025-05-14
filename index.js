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
const MENTAL_HEALTH_PROMPT = `You're a supportive mental health companion for students. Not a therapist. Provide compassionate listening, guidance, and coping strategies. For serious concerns, recommend professional help.

PRIMARY FOCUS: Support students with: academic stress, work-life balance, family issues, grief, financial concerns, future uncertainty.

RESPONSE GUIDELINES:
- Be empathetic, non-judgmental; speak as a peer
- Keep responses short, concise
- Use max 3 Gen Z terms per response (no repetition)
- Keep conversation light yet supportive
- No emojis or special characters
- Validate feelings, suggest evidence-based strategies (journaling, mindfulness, exercise, time management)
- Maintain supportive peer tone, never clinical
- No diagnosing conditions

CRISIS PROTOCOL: For self-harm/suicide indicators, immediately recommend crisis services (988 US), professional help, emphasize help is available.`;

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

STUDENT DATA INSIGHTS:
- Common challenges: ${topChallenges}
- Top stressors: ${topStressors}
- Isolation patterns: ${isolationTrends}
- Social challenges: ${socialChallenges}

Focus on academic pressures, campus life, student relationships, educational challenges.

LANGUAGE GUIDELINES (CRITICAL):
- STRICT LIMIT: Use AT MOST 2 Gen Z terms per response, never more
- Prioritize sounding natural over using slang
- Do not use slang in every response.
- Never force slang where it doesn't naturally fit
- Sound like a supportive friend, not someone trying to be cool

APPROVED GEN Z TERMS (choose sparingly):
aura: distinctive personal quality/energy
bestie: close friend, affectionate address
era: current life phase ("healing era")
glow-up: positive personal transformation
locked in: highly focused/determined
lore: personal backstory, often humorous
lowkey: subtle interest ("lowkey need a break")
highkey: enthusiastic interest ("highkey excited")

IMPORTANT: Your primary goal is to sound natural and helpful. A response with zero slang terms is better than one with forced, unnatural slang.`;
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
