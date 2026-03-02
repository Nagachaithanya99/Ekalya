import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import Course from "../models/Course.js";

const stripJsonFences = (text = "") =>
  String(text)
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

const extractFirstJsonObject = (text = "") => {
  const s = String(text || "");
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return "";
  return s.slice(start, end + 1);
};

const normalizeQuestions = (raw) => {
  const list = Array.isArray(raw?.questions) ? raw.questions : raw;
  if (!Array.isArray(list)) return [];

  return list
    .map((q) => {
      const question = String(q?.question || "").trim();
      const options = Array.isArray(q?.options)
        ? q.options.map((o) => String(o || "").trim()).filter(Boolean)
        : [];
      const correctAnswer = Number(q?.correctAnswer);

      if (!question || options.length !== 4) return null;
      if (!Number.isInteger(correctAnswer)) return null;
      if (correctAnswer < 0 || correctAnswer > 3) return null;

      return { question, options, correctAnswer };
    })
    .filter(Boolean);
};

const fallbackQuestions = (topic, count) => {
  const safeTopic = String(topic || "General topic").trim();
  const n = Math.min(Math.max(Number(count) || 5, 1), 20);
  const out = [];

  for (let i = 1; i <= n; i++) {
    out.push({
      question: `${safeTopic}: Question ${i}`,
      options: [
        `Core concept of ${safeTopic}`,
        `Unrelated detail`,
        `Partially correct statement`,
        `Incorrect interpretation`,
      ],
      correctAnswer: 0,
    });
  }

  return out;
};

/* ---------------- CREATE QUIZ ---------------- */
export const createQuiz = async (req, res) => {
  try {
    const {
      title,
      courseId,
      lessonId,
      passingScore,
      timeLimitMinutes,
      questions,
    } = req.body;

    if (!courseId || !questions?.length) {
      return res.status(400).json({ message: "Invalid quiz data" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.quizzesFinalized) {
      return res.status(400).json({ message: "Quizzes are finalized and locked" });
    }

    // ✅ validate ids if provided
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid courseId" });
    }

    if (lessonId && !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: "Invalid lessonId" });
    }

    const isFinalQuiz = !lessonId;

    const quiz = await Quiz.create({
      title,
      type: isFinalQuiz ? "FINAL" : "LESSON",
      courseId: new mongoose.Types.ObjectId(courseId),
      lessonId: lessonId
        ? new mongoose.Types.ObjectId(lessonId)
        : null, // null = final course quiz
      passingScore: passingScore || 60,
      timeLimitMinutes: Number(timeLimitMinutes || 15),
      maxAttempts: isFinalQuiz ? 4 : 3,
      questions,
    });

    return res.status(201).json(quiz);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to create quiz",
      error: err?.message,
    });
  }
};

/* ---------------- GET QUIZZES (ADMIN) ---------------- */
export const getQuizzesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid courseId" });
    }

    const quizzes = await Quiz.find({
      courseId: new mongoose.Types.ObjectId(courseId),
    })
      .populate("lessonId", "title order")
      .sort({ createdAt: -1 });

    return res.json(quizzes);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to load quizzes",
      error: err?.message,
    });
  }
};

/* ---------------- GENERATE QUIZ QUESTIONS (AI) ---------------- */
export const generateQuizQuestions = async (req, res) => {
  try {
    const {
      courseId,
      lessonId,
      topic = "",
      count = 5,
      difficulty = "medium",
    } = req.body || {};

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Valid courseId is required" });
    }

    if (lessonId && !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: "Invalid lessonId" });
    }

    const safeCount = Math.min(Math.max(Number(count) || 5, 1), 20);
    const safeDifficulty = ["easy", "medium", "hard"].includes(
      String(difficulty).toLowerCase()
    )
      ? String(difficulty).toLowerCase()
      : "medium";
    const safeTopic = String(topic || "").trim();

    if (!safeTopic) {
      return res.status(400).json({ message: "topic is required" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "Missing GROQ_API_KEY in .env" });
    }

    const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

    const prompt = `
Generate exactly ${safeCount} multiple-choice quiz questions for:
- Topic: ${safeTopic}
- Difficulty: ${safeDifficulty}
- Course ID: ${courseId}
- Lesson ID: ${lessonId || "final-course-quiz"}

Return ONLY valid JSON with this shape (no markdown):
{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0
    }
  ]
}

Rules:
- Exactly 4 options per question.
- correctAnswer must be 0,1,2,3.
- Keep wording clear for students.
`.trim();

    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 1400,
        messages: [
          {
            role: "system",
            content: "You output strict JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({
        message: data?.error?.message || "AI generation request failed",
      });
    }

    const raw = data?.choices?.[0]?.message?.content || "";
    const cleaned = stripJsonFences(raw);
    const jsonCandidate = cleaned || extractFirstJsonObject(raw);

    let parsed = null;
    try {
      parsed = JSON.parse(jsonCandidate);
    } catch {
      parsed = null;
    }

    let questions = normalizeQuestions(parsed).slice(0, safeCount);

    // Retry one time with stricter prompt if first response is not usable
    if (!questions.length) {
      const retryResp = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            max_tokens: 1600,
            messages: [
              {
                role: "system",
                content:
                  'Return only strict JSON object: {"questions":[{"question":"...","options":["...","...","...","..."],"correctAnswer":0}]}. No text.',
              },
              {
                role: "user",
                content: prompt,
              },
            ],
          }),
        }
      );

      if (retryResp.ok) {
        const retryData = await retryResp.json();
        const retryRaw = retryData?.choices?.[0]?.message?.content || "";
        const retryCandidate =
          stripJsonFences(retryRaw) || extractFirstJsonObject(retryRaw);

        try {
          const retryParsed = JSON.parse(retryCandidate);
          questions = normalizeQuestions(retryParsed).slice(0, safeCount);
        } catch {
          questions = [];
        }
      }
    }

    // Never hard-fail admin flow with 502; provide fallback questions
    if (!questions.length) {
      questions = fallbackQuestions(safeTopic, safeCount);
    }

    return res.json({ questions });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to generate quiz questions",
      error: err?.message,
    });
  }
};

/* ---------------- DELETE QUIZ ---------------- */
export const deleteQuiz = async (req, res) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    return res.json({ message: "Quiz deleted" });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to delete quiz",
      error: err?.message,
    });
  }
};

/* ---------------- UPDATE QUIZ ---------------- */
export const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, lessonId, passingScore, timeLimitMinutes, questions } = req.body;

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const course = await Course.findById(quiz.courseId);
    if (course?.quizzesFinalized || quiz.isFinalized) {
      return res.status(400).json({ message: "Quiz is finalized and cannot be edited" });
    }

    if (lessonId && !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: "Invalid lessonId" });
    }

    const isFinalQuiz = !lessonId;

    quiz.title = title ?? quiz.title;
    quiz.type = isFinalQuiz ? "FINAL" : "LESSON";
    quiz.lessonId = lessonId ? new mongoose.Types.ObjectId(lessonId) : null;
    quiz.passingScore = passingScore ?? quiz.passingScore;
    quiz.timeLimitMinutes =
      timeLimitMinutes !== undefined
        ? Number(timeLimitMinutes || 15)
        : quiz.timeLimitMinutes;
    quiz.maxAttempts = isFinalQuiz ? 4 : 3;
    quiz.questions = questions ?? quiz.questions;

    await quiz.save();

    return res.json(quiz);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to update quiz",
      error: err?.message,
    });
  }
};
