import client from "../utils/openaiClient.js";
import Course from "../models/Course.js";
import Lesson from "../models/Lesson.js";

export const chatAssistant = async (req, res, next) => {
  try {
    const { message, courseId, lessonId, role } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Optional context
    let contextText = "";
    if (courseId) {
      const course = await Course.findById(courseId).select(
        "title description category level"
      );
      if (course) {
        contextText += `\nCourse Context:\n- Title: ${course.title}\n- Description: ${course.description}\n- Category: ${course.category}\n- Level: ${course.level}\n`;
      }
    }

    if (lessonId) {
      const lesson = await Lesson.findById(lessonId).select("title description");
      if (lesson) {
        contextText += `\nLesson Context:\n- Title: ${lesson.title}\n- Description: ${lesson.description}\n`;
      }
    }

    // Role-aware instructions (optional)
    const base = `
You are an AI assistant in an Online Course Management System.
Be clear, step-by-step, and helpful.
If unsure, say what to check next.
`;

    const roleHint =
      role === "admin"
        ? `Admin mode: help with platform management, dashboards, managing courses/lessons/blogs, troubleshooting.`
        : role === "student"
        ? `Student mode: help learning, summaries, quizzes, explain concepts simply.`
        : `Public mode: help with courses info, how to enroll, platform guidance.`;

    const instructions = `${base}\n${roleHint}`.trim();

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const response = await client.responses.create({
      model,
      instructions,
      input: `User: ${message}\n${contextText}`.trim(),
    });

    const aiText =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "I couldn’t generate a reply. Please try again.";

    return res.json({ reply: aiText });
  } catch (err) {
    // ✅ Handle quota errors cleanly
    const status = err?.status || err?.response?.status;

    if (status === 429 && err?.code === "insufficient_quota") {
      return res.status(429).json({
        error:
          "AI quota/credits finished. Please add billing/credits in OpenAI platform to continue.",
        code: "insufficient_quota",
      });
    }

    // Other errors
    return next(err);
  }
};
