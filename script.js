npm init -y
npm install express axios dotenv winston helmet cors

server.js
import app from "./app.js";
import { config } from "./config/env.js";

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});

app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import askRoute from "./routes/ask.route.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/ask", askRoute);

app.use(errorMiddleware);

export default app;

config.js
import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT || 5000,
  CONFLUENCE_BASE_URL: process.env.CONFLUENCE_BASE_URL,
  CONFLUENCE_EMAIL: process.env.CONFLUENCE_EMAIL,
  CONFLUENCE_API_TOKEN: process.env.CONFLUENCE_API_TOKEN,
  GENAI_ENDPOINT: process.env.GENAI_ENDPOINT,
};



route.js
import express from "express";
import { askQuestion } from "../controllers/ask.controller.js";

const router = express.Router();
router.post("/", askQuestion);

export default router;



controller.js
import confluenceService from "../services/confluence.service.js";
import retrievalService from "../services/retrieval.service.js";
import genaiService from "../services/genai.service.js";
import validationService from "../services/validation.service.js";
import { buildPrompt } from "../utils/prompt.util.js";

export const askQuestion = async (req, res, next) => {
  try {
    const { question } = req.body;

    const pages = await confluenceService.searchPages(question);

    if (!pages.length) {
      return res.json({ answer: "Information not found in Confluence." });
    }

    const filteredContent = await retrievalService.extractRelevantContent(
      pages,
      question
    );

    const prompt = buildPrompt(filteredContent, question);

    const llmResponse = await genaiService.generate(prompt);

    const validated = await validationService.validate(llmResponse);

    res.json(validated);

  } catch (err) {
    next(err);
  }
};


conf.js
import axios from "axios";
import { config } from "../config/env.js";

class ConfluenceService {

  async searchPages(query) {
    const response = await axios.get(
      `${config.CONFLUENCE_BASE_URL}/wiki/rest/api/search`,
      {
        params: {
          cql: `text ~ "${query}"`,
          limit: 3
        },
        auth: {
          username: config.CONFLUENCE_EMAIL,
          password: config.CONFLUENCE_API_TOKEN
        }
      }
    );

    return response.data.results;
  }

  async getPageContent(pageId) {
    const response = await axios.get(
      `${config.CONFLUENCE_BASE_URL}/wiki/rest/api/content/${pageId}?expand=body.storage`,
      {
        auth: {
          username: config.CONFLUENCE_EMAIL,
          password: config.CONFLUENCE_API_TOKEN
        }
      }
    );

    return response.data.body.storage.value;
  }
}

export default new ConfluenceService();


retrieval.js
import confluenceService from "./confluence.service.js";
import { cleanHTML } from "../utils/htmlCleaner.util.js";
import { chunkText } from "../utils/chunk.util.js";

class RetrievalService {

  async extractRelevantContent(pages, question) {
    let combined = "";

    for (let page of pages) {
      const html = await confluenceService.getPageContent(page.content.id);
      const cleanText = cleanHTML(html);
      const chunks = chunkText(cleanText);

      const relevant = chunks.filter(chunk =>
        chunk.toLowerCase().includes(question.toLowerCase())
      );

      combined += relevant.join("\n\n");
    }

    return combined;
  }
}

export default new RetrievalService();


genai.servvice
import axios from "axios";
import { config } from "../config/env.js";

class GenAIService {

  async generate(prompt) {
    const response = await axios.post(config.GENAI_ENDPOINT, {
      prompt,
      temperature: 0.2
    });

    return response.data;
  }
}

export default new GenAIService();


validation service
class ValidationService {

  async validate(response) {
    if (!response || response.length < 10) {
      return { answer: "Information not found in Confluence." };
    }

    return { answer: response };
  }
}

export default new ValidationService();

prompt.util
export const buildPrompt = (content, question) => {
  return `
You are an enterprise assistant.

Answer ONLY using the content below.
If answer not explicitly present, respond exactly:
"Information not found in Confluence."

Content:
----------------
${content}
----------------

Question:
${question}

Format:
Answer:
Evidence:
Confidence:
`;
};

.env
PORT=5000
CONFLUENCE_BASE_URL=https://yourcompany.atlassian.net
CONFLUENCE_EMAIL=your-email
CONFLUENCE_API_TOKEN=your-token
GENAI_ENDPOINT=https://your-company-genai-api



import os
import shutil

local_file = r"C:\Users\aasagr\upload_test\ipooutput.csv"
remote_path = r"\\10.32.54.43\SharedIPO\ipooutput.csv"

# Check file exists
if not os.path.isfile(local_file):
    print("❌ Local file not found:", local_file)
    exit()

# Check if network path is reachable
remote_folder = os.path.dirname(remote_path)
if os.path.exists(remote_folder):
    try:
        shutil.copy(local_file, remote_path)
        print("✅ File uploaded to network share successfully.")
    except Exception as e:
        print("❌ Upload failed:", str(e))
else:
    print("❌ Network path not accessible. Check share permissions or server status.")




// assume date already sits in 2nd column elsewhere
      const dateMatch = title.match(/\b\d{2}-\d{2}-\d{4}\b/);
      const date = dateMatch ? dateMatch[0] : '';


import stringSimilarity from 'string-similarity';

export const processAlerts = (data) => {
  let open = 0;
  let closed = 0;

  const activeAlerts = new Set();
  const finalUpdates = [];
  const everOpened = [];
  const unmatchedFinalUpdates = [];
  const discrepantAlerts = [];

  const noiseWords = new Set([
    'high', 'alert', 'final', 'update', 'reg', 'sc',
    'auto', 'automatically', 'initiated', 'cap', 'report', 'summary'
  ]);

  const getCoreWords = (title = '') => {
    return new Set(
      title
        .toLowerCase()
        .replace(/update\s*#?\d+.*$/i, '')
        .replace(/final update.*$/i, '')
        .replace(/\.[a-z]{2,5}\b/g, '')
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !noiseWords.has(word))
    );
  };

  const normalizeTitle = (title = '') => {
    return title
      .toLowerCase()
      .replace(/update\s*#?\d+.*$/i, '')
      .replace(/final update.*$/i, '')
      .replace(/\.[a-z]{2,5}\b/g, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const areTitlesEquivalent = (titleA, titleB) => {
    const cleanedA = normalizeTitle(titleA);
    const cleanedB = normalizeTitle(titleB);

    const sim = stringSimilarity.compareTwoStrings(cleanedA, cleanedB);
    if (sim >= 0.85) return true;

    const coreA = getCoreWords(titleA);
    const coreB = getCoreWords(titleB);
    const common = [...coreA].filter(word => coreB.has(word));
    const ratio = common.length / Math.min(coreA.size, coreB.size);

    return ratio >= 0.7;
  };

  // Extract alerts
  let alerts;
  if (data?.ResponseStatus?.alerts) {
    alerts = Array.isArray(data.ResponseStatus.alerts.alert)
      ? data.ResponseStatus.alerts.alert
      : [data.ResponseStatus.alerts.alert];
  } else if (Array.isArray(data)) {
    alerts = data;
  } else {
    console.warn("❌ No valid alert data found");
    return { open, closed, openTitles: [], unmatchedFinalUpdates, discrepantAlerts };
  }

  console.log("🔍 Starting Alert Processing...\n");

  alerts.forEach(alert => {
    const title = alert?.reportSummary?.title || alert?.title || '';
    if (!/high\s*alert/i.test(title)) return;

    const isFinal = /final update/i.test(title);
    const isIntermediate = /update\s*#?\d+/i.test(title) && !isFinal;

    console.log(`[PASS 1] "${title}" → ${isFinal ? 'FINAL' : isIntermediate ? 'INTERMEDIATE' : 'BASE'}`);

    if (isFinal) {
      finalUpdates.push(title);
    } else if (!isIntermediate) {
      const exactMatch = activeAlerts.has(title);
      const fuzzyMatch = [...activeAlerts].some(t => areTitlesEquivalent(t, title));

      if (!exactMatch && !fuzzyMatch) {
        activeAlerts.add(title);
        everOpened.push(title);
        open++;
        console.log(`✅ Added to activeAlerts`);
      } else {
        console.log(`🔁 Skipped (duplicate or similar already exists)`);
      }
    }
  });

  console.log("\n🔄 Processing Final Updates...\n");

  finalUpdates.forEach(finalTitle => {
    const match = [...activeAlerts].find(openTitle =>
      areTitlesEquivalent(openTitle, finalTitle)
    );
    if (match) {
      activeAlerts.delete(match);
      closed++;
      open--;
      console.log(`✅ Closed: "${finalTitle}" matched with "${match}"`);
    } else {
      unmatchedFinalUpdates.push(finalTitle);
      discrepantAlerts.push({ type: 'UNMATCHED_FINAL_UPDATE', title: finalTitle });
      console.log(`❌ No match found for final update: "${finalTitle}"`);
    }
  });

  [...activeAlerts].forEach(title => {
    discrepantAlerts.push({ type: 'OPEN', title });
  });

  console.log("\n📊 Summary:");
  console.log(`Open Count: ${open}`);
  console.log(`Closed Count: ${closed}`);
  console.log(`Unmatched Finals: ${unmatchedFinalUpdates.length}`);

  return {
    open,
    closed,
    openTitles: [...activeAlerts],
    allOpenTitles: everOpened,
    unmatchedFinalUpdates,
    discrepantAlerts,
  };
};









const dino = document.getElementById("dino");
const rock = document.getElementById("rock");
const score = document.getElementById("score");

function jump() {
  dino.classList.add("jump-animation");
  setTimeout(() =>
    dino.classList.remove("jump-animation"), 500);
}

document.addEventListener('keypress', (event) => {
  if (!dino.classList.contains('jump-animation')) {
    jump();
  }
})

setInterval(() => {
  const dinoTop = parseInt(window.getComputedStyle(dino)
    .getPropertyValue('top'));
  const rockLeft = parseInt(window.getComputedStyle(rock)
    .getPropertyValue('left'));
  score.innerText++;

  if (rockLeft < 0) {
    rock.style.display = 'none';
  } else {
    rock.style.display = ''
  }

  if (rockLeft < 50 && rockLeft > 0 && dinoTop > 150) {
    alert("You got a score of: " + score.innerText +
      "\n\nPlay again?");
    location.reload();
  }
}, 50);



