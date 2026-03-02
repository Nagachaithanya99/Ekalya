import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import { getLessonsByCourse } from "../../services/lessonService";
import { getQuizzesByCourse, updateQuiz } from "../../services/adminQuizService";
import {
  adminCreateCourse,
  adminUpdateCourse,
  adminFinalizeLessons,
  adminFinalizeQuizzes,
  adminPublishCourse,
  adminAddLesson,
  adminListTemplates,
  adminUpdateAllowedTemplates,
} from "../../services/courseLifecycleService";

const tabs = ["Setup", "Lessons", "Quizzes", "Certificates", "Publish"];

export default function AdminCourseEditor() {
  const { id } = useParams();
  const isNew = id === "new";
  const [tab, setTab] = useState("Setup");
  const [course, setCourse] = useState({
    title: "",
    description: "",
    price: 0,
    state: "DRAFT",
    lessonsFinalized: false,
    quizzesFinalized: false,
    allowedTemplateIds: [],
  });
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [templates, setTemplates] = useState([]);

  const finalQuiz = useMemo(() => quizzes.find((q) => q.type === "FINAL"), [quizzes]);

  const loadCourse = async () => {
    if (isNew) return;
    const c = await api.get(`/admin/courses`);
    const row = (Array.isArray(c.data) ? c.data : []).find((x) => x._id === id);
    if (row) setCourse(row);
    const [l, q, t] = await Promise.all([
      getLessonsByCourse(id),
      getQuizzesByCourse(id),
      adminListTemplates(),
    ]);
    setLessons(Array.isArray(l.data) ? l.data : []);
    setQuizzes(Array.isArray(q.data) ? q.data : []);
    setTemplates(Array.isArray(t.data) ? t.data : []);
  };

  useEffect(() => {
    loadCourse().catch(console.error);
  }, [id]);

  const saveSetup = async () => {
    if (isNew) {
      const res = await adminCreateCourse(course);
      window.location.href = `/admin/course-editor/${res.data._id}`;
      return;
    }
    await adminUpdateCourse(id, course);
    alert("Course updated");
    await loadCourse();
  };

  const addLesson = async () => {
    const title = prompt("Lesson title");
    if (!title) return;
    await adminAddLesson(id, { title, content: "", isActive: true });
    await loadCourse();
  };

  const finalizeLessons = async () => {
    await adminFinalizeLessons(id);
    alert("Lessons finalized");
    await loadCourse();
  };

  const finalizeQuizzes = async () => {
    await adminFinalizeQuizzes(id);
    alert("Quizzes finalized");
    await loadCourse();
  };

  const publish = async () => {
    await adminPublishCourse(id);
    alert("Course published");
    await loadCourse();
  };

  const saveAllowedTemplates = async () => {
    await adminUpdateAllowedTemplates(id, course.allowedTemplateIds || []);
    alert("Allowed templates updated");
    await loadCourse();
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">AdminCourseEditor</h1>
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl border ${
              tab === t ? "bg-[#f7d774]/20 border-[#f7d774]/50" : "border-white/10"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Setup" && (
        <div className="glass rounded-2xl border border-white/10 p-5 space-y-3">
          <input
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2"
            placeholder="Course title"
            value={course.title || ""}
            onChange={(e) => setCourse((p) => ({ ...p, title: e.target.value }))}
          />
          <textarea
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2"
            placeholder="Description"
            value={course.description || ""}
            onChange={(e) => setCourse((p) => ({ ...p, description: e.target.value }))}
          />
          <button className="btn-gold" onClick={saveSetup}>
            Save Setup
          </button>
        </div>
      )}

      {tab === "Lessons" && (
        <div className="glass rounded-2xl border border-white/10 p-5 space-y-3">
          <button className="btn-ghost" onClick={addLesson}>
            Add Lesson
          </button>
          <button className="btn-gold" onClick={finalizeLessons} disabled={isNew}>
            Finalize Lessons
          </button>
          <div className="text-sm text-white/70">
            Lessons are append-only after finalization. New lessons auto-create quiz shells.
          </div>
          <ul className="space-y-2">
            {lessons.map((l) => (
              <li key={l._id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                {l.order}. {l.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "Quizzes" && (
        <div className="glass rounded-2xl border border-white/10 p-5 space-y-3">
          <button className="btn-gold" onClick={finalizeQuizzes} disabled={isNew}>
            Finalize Quizzes
          </button>
          <div className="text-sm text-white/70">
            Update questions in existing quiz editor if needed. Finalize locks editing.
          </div>
          <div className="space-y-2">
            {quizzes.map((q) => (
              <div key={q._id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="font-bold">{q.title}</div>
                <div className="text-xs text-white/60">
                  {q.type} | Questions: {q.questions?.length || 0} | Finalized: {q.isFinalized ? "Yes" : "No"}
                </div>
                {!q.isFinalized && (
                  <button
                    className="btn-ghost mt-2"
                    onClick={async () => {
                      const text = prompt("Add one question text");
                      if (!text) return;
                      const next = [...(q.questions || []), {
                        question: text,
                        options: ["A", "B", "C", "D"],
                        correctAnswer: 0,
                      }];
                      await updateQuiz(q._id, { ...q, questions: next });
                      await loadCourse();
                    }}
                  >
                    Quick Add Question
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Certificates" && (
        <div className="glass rounded-2xl border border-white/10 p-5 space-y-3">
          <div className="text-sm text-white/70">Allowed templates for this course</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {templates.map((t) => {
              const checked = (course.allowedTemplateIds || []).some((x) => String(x) === String(t._id));
              return (
                <label key={t._id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setCourse((prev) => {
                        const set = new Set((prev.allowedTemplateIds || []).map(String));
                        if (e.target.checked) set.add(String(t._id));
                        else set.delete(String(t._id));
                        return { ...prev, allowedTemplateIds: Array.from(set) };
                      });
                    }}
                  />
                  <span>{t.name}</span>
                </label>
              );
            })}
          </div>
          <button className="btn-gold" onClick={saveAllowedTemplates} disabled={isNew}>
            Save Allowed Templates
          </button>
        </div>
      )}

      {tab === "Publish" && (
        <div className="glass rounded-2xl border border-white/10 p-5 space-y-2">
          <p>Lessons Finalized: {course.lessonsFinalized ? "Yes" : "No"}</p>
          <p>Quizzes Finalized: {course.quizzesFinalized ? "Yes" : "No"}</p>
          <p>Final Quiz Exists: {finalQuiz ? "Yes" : "No"}</p>
          <button className="btn-gold" onClick={publish} disabled={isNew}>
            Publish
          </button>
        </div>
      )}
    </div>
  );
}
