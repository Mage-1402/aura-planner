import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper function to handle POST requests using built-in https module (Node compatible)
const postRequest = (url, headers, body) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => JSON.parse(data),
          text: () => data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(body);
    req.end();
  });
};

app.post('/api/chat', async (req, res) => {
  const { messages, currentDate, existingTasks } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the backend server. Please configure your .env file.' });
  }

  try {
    const clientDate = currentDate || new Date().toISOString().split('T')[0];
    const parts = clientDate.split('-');
    const clientDateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const dayOfWeek = clientDateObj.toLocaleDateString('en-US', { weekday: 'long' });

    // Generate calendar lookup for the next 180 days to prevent calendar arithmetic hallucination
    const calendarLines = [];
    for (let i = 0; i < 180; i++) {
      const d = new Date(clientDateObj);
      d.setDate(clientDateObj.getDate() + i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${date}`;
      
      calendarLines.push(`- ${dateStr} is ${dayName}`);
    }
    const calendarLookup = calendarLines.join('\n');

    // List existing tasks to prevent duplicates
    const tasksList = (existingTasks || []).map(t => 
      `- "${t.title}" scheduled for ${t.dueDate || 'no date'} (Category: ${t.categoryName || 'None'}, Completed: ${t.completed})`
    ).join('\n') || 'None';

    const requestBody = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are AuraBot, a friendly, conversational, and highly encouraging AI productivity planner.
          
          Today's Date: ${clientDate} (${dayOfWeek})
          
          CALENDAR DATE LOOKUP (use this to verify and find exact dates and weekdays, e.g. next Monday):
          ${calendarLookup}
          
          USER'S EXISTING PLANNED TASKS (to prevent duplicates):
          ${tasksList}
          
          CRITICAL CONVERSATION RULES:
          1. Converse normally in English by default. Keep responses short, concise, and natural (avoid long info-dumps).
          2. If the user switches to Tamil (தமிழ்) or Tanglish (Tamil written in English/Latin characters, e.g. 'Epdi irukinga?'), switch and answer in that respective language naturally.
          3. Do NOT ask for the user's name unless they choose to introduce themselves.
          4. STRICT TASK PROTOCOL: Do NOT generate, recommend, or format any tasks (meaning NEVER output lines starting with 'TASK:') if the user is just greeting you, saying 'hi', having a casual conversation, or asking generic questions. Only generate task suggestions when the user EXPLICITLY asks you to 'schedule', 'plan', 'create a roadmap', or 'make a course path'.
          5. STUDY PLAN INSTRUCTION: If a user asks for a course plan, study planner, or a roadmap/schedule:
             - If they have NOT specified a start date, ask: "Shall we start this plan from today? Or would you like to start from a specific date (like tomorrow, next week)?"
             - If they have specified or implied a start date (e.g. "june 1", "tomorrow", "today"), immediately generate the tasks starting from that date.
             - Generate granular, consecutive day-by-day tasks labeled "Day 1: ...", "Day 2: ...", "Day 3: ..." etc., for the requested duration.
             - Map each day to consecutive daily calendar dates (e.g. Day 1 is June 1, Day 2 is June 2, Day 3 is June 3...) so they are scheduled sequentially "next-to-next".
             - Each task MUST contain detailed notes of WHAT SHOULD BE COVERED in that day's task (specific topics, exercises, or key concepts).
          6. Conclude your planning response by listing recommended tasks each on a single line starting exactly with 'TASK: ' formatted as:
          TASK: Task Title | YYYY-MM-DD | CategoryName | Detailed notes on what to study / cover
          Keep task descriptions short.`
        },
        ...messages
      ]
    });

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };

    const response = await postRequest('https://api.groq.com/openai/v1/chat/completions', headers, requestBody);
    const data = response.json();

    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to connect to Groq API from backend.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
