import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getLessonsByCourse } from "../../services/lessonService";
import { completeLessonFlow } from "../../services/courseLifecycleService";
import api from "../../services/api";

export default function LessonViewer() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [quizId, setQuizId] = useState(null);

  useEffect(() => {
    (async () => {
      const lessons = await getLessonsByCourse(courseId);
      const row = (lessons.data || []).find((x) => x._id === lessonId);
      setLesson(row || null);
      const quiz = await api.get(`/quizzes?courseId=${courseId}&lessonId=${lessonId}`);
      setQuizId(quiz?.data?._id || null);
    })();
  }, [courseId, lessonId]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{lesson?.title || "Lesson"}</h1>
      <p className="text-white/70">{lesson?.description || ""}</p>
      {!!lesson?.videoUrl && (
        <video src={lesson.videoUrl} controls className="w-full rounded-2xl border border-white/10" />
      )}
      <div className="flex gap-2">
        <button
          className="btn-ghost"
          onClick={async () => {
            await completeLessonFlow(courseId, lessonId);
            alert("Lesson completed");
          }}
        >
          Mark Complete
        </button>
        <button
          className="btn-gold"
          disabled={!quizId}
          onClick={() => navigate(`/student/v2/lesson-quiz/${quizId}`)}
        >
          Take Lesson Quiz
        </button>
      </div>
    </div>
  );
}
