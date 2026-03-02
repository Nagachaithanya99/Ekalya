import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createQuiz,
  getQuizzesByCourse,
  deleteQuiz,
  updateQuiz,
  generateQuizQuestions,
} from "../../services/adminQuizService";
import { getLessonsByCourse } from "../../services/lessonService";
import { getAllCoursesAdmin } from "../../services/courseService";
import { adminFinalizeQuizzes } from "../../services/courseLifecycleService";

export default function AdminQuizzes() {
  const { courseId: routeCourseId } = useParams();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(routeCourseId || "");
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [finalizing, setFinalizing] = useState(false);

  const [buildMode, setBuildMode] = useState("manual"); // manual | auto
  const [generating, setGenerating] = useState(false);
  const [genTopic, setGenTopic] = useState("");
  const [genCount, setGenCount] = useState(5);
  const [genDifficulty, setGenDifficulty] = useState("medium");

  const emptyForm = {
    title: "",
    lessonId: "",
    passingScore: 60,
    questions: [],
  };
  const [form, setForm] = useState(emptyForm);

  const [qText, setQText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);

  const selectedCourse = useMemo(
    () => courses.find((c) => c._id === selectedCourseId),
    [courses, selectedCourseId]
  );

  const canGenerate = useMemo(
    () => !!genTopic.trim() && !generating && !!selectedCourseId,
    [genTopic, generating, selectedCourseId]
  );

  const refresh = useCallback(async () => {
    if (!selectedCourseId) {
      setQuizzes([]);
      return;
    }
    const r = await getQuizzesByCourse(selectedCourseId);
    setQuizzes(Array.isArray(r.data) ? r.data : []);
  }, [selectedCourseId]);

  useEffect(() => {
    getAllCoursesAdmin().then((r) => setCourses(Array.isArray(r.data) ? r.data : []));
  }, []);

  useEffect(() => {
    if (routeCourseId && routeCourseId !== selectedCourseId) {
      setSelectedCourseId(routeCourseId);
    }
  }, [routeCourseId, selectedCourseId]);

  useEffect(() => {
    if (!selectedCourseId) {
      setLessons([]);
      setQuizzes([]);
      return;
    }
    getLessonsByCourse(selectedCourseId).then((r) =>
      setLessons(Array.isArray(r.data) ? r.data : [])
    );
    refresh();
  }, [selectedCourseId, refresh]);

  const onCourseChange = (id) => {
    setSelectedCourseId(id);
    setForm(emptyForm);
    setEditingId(null);
    if (id) navigate(`/admin/quizzes/${id}`);
    else navigate("/admin/quizzes");
  };

  const addQuestion = () => {
    if (!qText.trim()) return;
    if (options.some((o) => !String(o).trim())) {
      alert("All 4 options are required");
      return;
    }

    setForm((p) => ({
      ...p,
      questions: [
        ...p.questions,
        {
          question: qText.trim(),
          options: options.map((o) => o.trim()),
          correctAnswer: correct,
        },
      ],
    }));

    setQText("");
    setOptions(["", "", "", ""]);
    setCorrect(0);
  };

  const removeQuestion = (index) => {
    setForm((p) => ({
      ...p,
      questions: p.questions.filter((_, i) => i !== index),
    }));
  };

  const generateQuestions = async (mode = "replace") => {
    if (!canGenerate || !selectedCourseId) return;
    try {
      setGenerating(true);
      const res = await generateQuizQuestions({
        courseId: selectedCourseId,
        lessonId: form.lessonId || null,
        topic: genTopic.trim(),
        count: Number(genCount),
        difficulty: genDifficulty,
      });

      const generated = Array.isArray(res.data?.questions) ? res.data.questions : [];
      if (!generated.length) return alert("No questions generated");

      setForm((p) => ({
        ...p,
        questions: mode === "append" ? [...p.questions, ...generated] : generated,
      }));
      setBuildMode("manual");
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to generate questions"
      );
    } finally {
      setGenerating(false);
    }
  };

  const submit = async () => {
    if (!selectedCourseId) return alert("Select a course first");
    if (!form.title.trim() || form.questions.length === 0) {
      alert("Quiz title and at least one question required");
      return;
    }

    const payload = { ...form, courseId: selectedCourseId };
    if (editingId) await updateQuiz(editingId, payload);
    else await createQuiz(payload);

    setForm(emptyForm);
    setEditingId(null);
    setBuildMode("manual");
    await refresh();
  };

  const startEdit = (quiz) => {
    setEditingId(quiz._id);
    setBuildMode("manual");
    setForm({
      title: quiz.title,
      lessonId: quiz.lessonId?._id || "",
      passingScore: quiz.passingScore,
      questions: quiz.questions || [],
    });
  };

  const handleFinalizeQuizzes = async () => {
    if (!selectedCourseId) return alert("Select a course first.");
    try {
      setFinalizing(true);
      const res = await adminFinalizeQuizzes(selectedCourseId);
      alert(res?.data?.message || "Quizzes finalized.");
      const cr = await getAllCoursesAdmin();
      setCourses(Array.isArray(cr.data) ? cr.data : []);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to finalize quizzes");
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">
        Quiz <span className="text-gold">Builder</span>
      </h1>

      <div className="glass rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <p className="text-sm text-white/70 mb-1">Select Course</p>
            <select
              value={selectedCourseId}
              onChange={(e) => onCourseChange(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-[#0b0b0b] text-white border border-[#f7d774]/35"
            >
              <option value="" className="bg-[#0b0b0b] text-white">
                -- Choose Course --
              </option>
              {courses.map((c) => (
                <option key={c._id} value={c._id} className="bg-[#0b0b0b] text-white">
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleFinalizeQuizzes}
            disabled={!selectedCourseId || finalizing || !!selectedCourse?.quizzesFinalized}
            className="btn-gold disabled:opacity-60"
          >
            {finalizing
              ? "Finalizing..."
              : selectedCourse?.quizzesFinalized
              ? "Quizzes Finalized"
              : "Finalize Quizzes"}
          </button>
        </div>

        {selectedCourse ? (
          <div className="text-sm text-white/70">
            Lessons finalized:{" "}
            <span className={selectedCourse.lessonsFinalized ? "text-green-400" : "text-yellow-300"}>
              {selectedCourse.lessonsFinalized ? "Yes" : "No"}
            </span>{" "}
            • Quizzes finalized:{" "}
            <span className={selectedCourse.quizzesFinalized ? "text-green-400" : "text-yellow-300"}>
              {selectedCourse.quizzesFinalized ? "Yes" : "No"}
            </span>
          </div>
        ) : null}

        {!selectedCourseId ? (
          <div className="text-white/60 text-sm">Select a course to add and finalize quizzes.</div>
        ) : (
          <>
            <input
              placeholder="Quiz Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10"
            />

            <select
              value={form.lessonId}
              onChange={(e) => setForm({ ...form, lessonId: e.target.value })}
              className="w-full px-4 py-2 rounded-xl bg-[#0b0b0b] text-white border border-[#f7d774]/35 focus:border-[#f7d774]/60 outline-none"
            >
              <option value="" className="bg-[#0b0b0b] text-white">
                Final Course Quiz
              </option>
              {lessons.map((l) => (
                <option key={l._id} value={l._id} className="bg-[#0b0b0b] text-white">
                  Lesson {l.order}: {l.title}
                </option>
              ))}
            </select>

            <div className="border border-white/10 rounded-2xl p-4 bg-white/5">
              <p className="font-semibold">Question Entry Mode</p>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setBuildMode("manual")}
                  className={`px-4 py-2 rounded-xl border ${
                    buildMode === "manual"
                      ? "bg-[#f7d774] text-black border-[#f7d774]"
                      : "bg-black/40 text-white border-white/15"
                  }`}
                >
                  Add Manually
                </button>
                <button
                  type="button"
                  onClick={() => setBuildMode("auto")}
                  className={`px-4 py-2 rounded-xl border ${
                    buildMode === "auto"
                      ? "bg-[#f7d774] text-black border-[#f7d774]"
                      : "bg-black/40 text-white border-white/15"
                  }`}
                >
                  Auto Generate (AI)
                </button>
              </div>

              {buildMode === "auto" && (
                <div className="mt-4 grid md:grid-cols-3 gap-3">
                  <input
                    placeholder="Topic (e.g., React hooks basics)"
                    value={genTopic}
                    onChange={(e) => setGenTopic(e.target.value)}
                    className="md:col-span-2 px-3 py-2 rounded-xl bg-black/40 border border-white/15"
                  />
                  <select
                    value={genDifficulty}
                    onChange={(e) => setGenDifficulty(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#0b0b0b] text-white border border-white/15"
                  >
                    <option value="easy" className="bg-[#0b0b0b] text-white">
                      Easy
                    </option>
                    <option value="medium" className="bg-[#0b0b0b] text-white">
                      Medium
                    </option>
                    <option value="hard" className="bg-[#0b0b0b] text-white">
                      Hard
                    </option>
                  </select>

                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={genCount}
                    onChange={(e) => setGenCount(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-black/40 border border-white/15"
                    placeholder="Question count"
                  />
                  <button
                    type="button"
                    onClick={() => generateQuestions("replace")}
                    disabled={!canGenerate}
                    className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 disabled:opacity-50"
                  >
                    {generating ? "Generating..." : "Generate & Replace"}
                  </button>
                  <button
                    type="button"
                    onClick={() => generateQuestions("append")}
                    disabled={!canGenerate}
                    className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 disabled:opacity-50"
                  >
                    {generating ? "Generating..." : "Generate & Append"}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {form.questions.map((q, i) => (
                <div key={i} className="glass rounded-2xl p-4 border border-white/10">
                  <p className="font-semibold">{q.question}</p>
                  <p className="text-xs text-white/60">
                    Correct option: {Number(q.correctAnswer) + 1}
                  </p>
                  <button
                    onClick={() => removeQuestion(i)}
                    className="text-red-400 text-sm mt-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {buildMode === "manual" && (
              <div className="border border-white/10 rounded-2xl p-4 space-y-2">
                <input
                  placeholder="Question"
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10"
                />

                {options.map((o, i) => (
                  <input
                    key={i}
                    placeholder={`Option ${i + 1}`}
                    value={o}
                    onChange={(e) =>
                      setOptions(options.map((x, j) => (j === i ? e.target.value : x)))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10"
                  />
                ))}

                <select
                  value={correct}
                  onChange={(e) => setCorrect(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0b0b] text-white border border-white/15 focus:border-[#f7d774]/55 outline-none"
                >
                  {[0, 1, 2, 3].map((i) => (
                    <option key={i} value={i} className="bg-[#0b0b0b] text-white">
                      Correct Option {i + 1}
                    </option>
                  ))}
                </select>

                <button onClick={addQuestion} className="btn-ghost">
                  Add Question
                </button>
              </div>
            )}

            <button onClick={submit} className="btn-gold">
              {editingId ? "Update Quiz" : "Create Quiz"}
            </button>
          </>
        )}
      </div>

      <div className="space-y-3">
        {quizzes.map((q) => (
          <div
            key={q._id}
            className="glass rounded-2xl p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{q.title}</p>
              <p className="text-xs text-white/60">
                {q.lessonId ? `Lesson: ${q.lessonId.title}` : "Final Course Quiz"}
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => startEdit(q)} className="text-gold hover:underline">
                Edit
              </button>
              <button
                onClick={async () => {
                  await deleteQuiz(q._id);
                  await refresh();
                }}
                className="text-red-400 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
