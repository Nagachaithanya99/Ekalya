import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getLessonsByCourse } from "../../services/lessonService";
import {
  getMyCourses,
  getLessonProgress,
  saveLessonProgress,
} from "../../services/enrollmentService";
import Loader from "../../components/Loader";
import { motion } from "framer-motion";

export default function Watch() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);

  const lastSaveRef = useRef(0);

  const activeLesson = useMemo(
    () => lessons.find((l) => String(l._id) === String(activeLessonId)),
    [lessons, activeLessonId]
  );

  const completedSet = useMemo(() => {
    const ids = enrollment?.completedLessonIds || [];
    return new Set(ids.map(String));
  }, [enrollment]);

  const activeLessonProgress = useMemo(() => {
    const arr = enrollment?.lessonProgress || [];
    return arr.find((x) => String(x.lessonId) === String(activeLessonId));
  }, [enrollment, activeLessonId]);

  const progressPercent = useMemo(() => {
    if (!lessons.length) return Math.min(Number(enrollment?.progressPercent || 0), 100);
    const fromCompleted = Math.round((completedSet.size / lessons.length) * 100);
    return Math.min(Math.max(fromCompleted, Number(enrollment?.progressPercent || 0)), 100);
  }, [lessons.length, completedSet, enrollment?.progressPercent]);

  const isActiveLessonCompleted = useMemo(() => {
    if (!activeLessonId) return false;
    return completedSet.has(String(activeLessonId));
  }, [completedSet, activeLessonId]);

  const allLessonsCompleted = useMemo(() => {
    if (!lessons.length) return false;
    return lessons.every((l) => completedSet.has(String(l._id)));
  }, [lessons, completedSet]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [lessRes, myRes] = await Promise.all([
          getLessonsByCourse(courseId),
          getMyCourses(),
        ]);

        const lessonList = lessRes?.data || [];
        setLessons(lessonList);

        const enr = (myRes?.data || []).find(
          (e) => String(e.course?._id) === String(courseId)
        );
        setEnrollment(enr || null);

        setActiveLessonId(lessonList[0]?._id || null);
      } catch (err) {
        console.error("Failed to load watch data", err);
        setLessons([]);
        setEnrollment(null);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) load();
  }, [courseId]);

  // Resume mp4
  useEffect(() => {
    const seekToResume = async () => {
      if (!courseId || !activeLessonId) return;
      if (!activeLesson?.videoUrl) return;
      if (isYouTube(activeLesson.videoUrl)) return;
      if (!videoRef.current) return;

      try {
        const res = await getLessonProgress(courseId, activeLessonId);
        const resumeAt = Number(res?.data?.watchedSeconds || 0);

        const v = videoRef.current;
        const handler = () => {
          if (v.duration && resumeAt > 0 && resumeAt < v.duration - 1) {
            v.currentTime = resumeAt;
          }
          v.removeEventListener("loadedmetadata", handler);
        };
        v.addEventListener("loadedmetadata", handler);
      } catch {}
    };

    seekToResume();
  }, [courseId, activeLessonId, activeLesson?.videoUrl]);

  const saveProgressNow = async ({ ended = false } = {}) => {
    if (!courseId || !activeLessonId) return;
    if (!activeLesson?.videoUrl) return;
    if (isYouTube(activeLesson.videoUrl)) return;

    const v = videoRef.current;
    if (!v || !v.duration) return;

    const watchedSeconds = Math.floor(v.currentTime || 0);
    const durationSeconds = Math.floor(v.duration || 0);

    try {
      const res = await saveLessonProgress({
        courseId,
        lessonId: activeLessonId,
        watchedSeconds,
        durationSeconds,
        ended,
      });

      setEnrollment((prev) => {
        if (!prev) return prev;

        const ids = new Set((prev.completedLessonIds || []).map(String));
        if (res?.data?.lessonCompleted) ids.add(String(activeLessonId));

        const lp = [...(prev.lessonProgress || [])];
        const i = lp.findIndex((x) => String(x.lessonId) === String(activeLessonId));

        const patch = {
          lessonId: activeLessonId,
          watchedSeconds,
          durationSeconds,
          completed: !!res?.data?.lessonCompleted,
        };

        if (i === -1) lp.push(patch);
        else lp[i] = { ...lp[i], ...patch };

        return {
          ...prev,
          progressPercent: res?.data?.progressPercent ?? prev.progressPercent,
          completedLessonIds: Array.from(ids),
          lessonProgress: lp,
        };
      });
    } catch (err) {
      console.error("saveLessonProgress failed", err);
    }
  };

  const onTimeUpdate = () => {
    const now = Date.now();
    if (now - lastSaveRef.current < 5000) return;
    lastSaveRef.current = now;
    saveProgressNow();
  };

  const onEnded = () => saveProgressNow({ ended: true });

  if (loading) return <Loader label="Loading lessons..." />;

  if (!enrollment) {
    return (
      <div className="glass rounded-2xl p-6 text-white/70">
        You are not enrolled in this course.
      </div>
    );
  }

  return (
    <div className="grid xl:grid-cols-[380px_1fr] gap-6">
      {/* Lesson List */}
      <div className="glass rounded-3xl p-5 border border-white/10">
        <div className="mb-4">
          <h2 className="text-lg font-extrabold">Course Lessons</h2>
          <p className="text-sm text-white/60 mt-1">
            Progress:{" "}
            <span className="text-gold font-semibold">{progressPercent}%</span>
          </p>

          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full"
              style={{
                width: `${progressPercent}%`,
                background:
                  "linear-gradient(90deg, var(--gold), var(--fire), var(--water))",
              }}
            />
          </div>
        </div>

        <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
          {lessons.map((l) => {
            const isActive = String(l._id) === String(activeLessonId);
            const isDone = completedSet.has(String(l._id));

            return (
              <button
                key={l._id}
                onClick={() => setActiveLessonId(l._id)}
                className={`w-full text-left rounded-xl p-3 border transition ${
                  isActive
                    ? "bg-white/10 border-[#f7d774]/30 active-glow"
                    : "border-white/10 hover:bg-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {l.order}. {l.title}
                    </p>
                    <p className="text-xs text-white/60 line-clamp-1">
                      {l.description || "Lesson"}
                    </p>
                  </div>
                  <span className={`badge ${isDone ? "badge-done" : "badge-pending"}`}>
                    {isDone ? "Done" : "Pending"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Player */}
      <div className="glass rounded-3xl p-6 border border-white/10">
        {!activeLesson ? (
          <p className="text-white/60">Select a lesson to start learning.</p>
        ) : (
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-extrabold"
            >
              {activeLesson.title}
            </motion.h1>

            <p className="text-xs text-white/60">
              Watched: {Math.floor(activeLessonProgress?.watchedSeconds || 0)}s
              {activeLesson.videoUrl && isYouTube(activeLesson.videoUrl) && " (YouTube tracking limited)"}
            </p>

            {/* Video */}
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-black">
              {activeLesson.videoUrl ? (
                isYouTube(activeLesson.videoUrl) ? (
                  <iframe
                    className="w-full aspect-video"
                    src={toYouTubeEmbed(activeLesson.videoUrl)}
                    title="YouTube"
                    allowFullScreen
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={activeLesson.videoUrl}
                    controls
                    className="w-full"
                    onTimeUpdate={onTimeUpdate}
                    onEnded={onEnded}
                  />
                )
              ) : (
                <div className="p-4 text-white/60">
                  No video URL added for this lesson yet.
                </div>
              )}
            </div>

            {/* ✅ QUIZ BUTTONS (only after completion) */}
            <div className="flex flex-wrap gap-3 items-center">
              {isActiveLessonCompleted ? (
                <button
                  onClick={() =>
                    navigate(`/student/quiz/${courseId}?lessonId=${activeLessonId}`)
                  }
                  className="btn-gold"
                >
                  Take Lesson Quiz →
                </button>
              ) : (
                <div className="text-sm text-white/60">
                  Complete this lesson to unlock the quiz.
                </div>
              )}

              {/* Final Quiz only if all lessons completed */}
              {allLessonsCompleted && (
                <button
                  onClick={() => navigate(`/student/v2/final-quiz/${courseId}`)}
                  className="btn-ghost"
                >
                  Take Final Course Quiz 🎓
                </button>
              )}
            </div>

            {activeLesson.pdfUrl && (
              <a
                href={activeLesson.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost inline-block"
              >
                Open Lesson PDF
              </a>
            )}

            <div className="text-sm text-white/60 space-y-1">
              <p>✅ Lesson completes at <b>90%</b> watched or when video ends.</p>
              <p>🧠 Quiz unlocks only after lesson completion.</p>
              <p>🎓 Final quiz unlocks after all lessons are completed and lesson quizzes are passed.</p>
              <p>⚠️ YouTube videos cannot track watch time accurately.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function isYouTube(url) {
  return /youtube\.com\/watch\?v=|youtu\.be\//i.test(url);
}

function toYouTubeEmbed(url) {
  const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
  return match?.[1] ? `https://www.youtube.com/embed/${match[1]}` : url;
}
