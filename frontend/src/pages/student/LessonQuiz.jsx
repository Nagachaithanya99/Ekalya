import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { startLessonQuiz, submitLessonQuiz } from "../../services/courseLifecycleService";

export default function LessonQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    startLessonQuiz(quizId)
      .then((r) => setQuiz(r.data))
      .catch((e) => alert(e?.response?.data?.message || "Unable to start quiz"));
  }, [quizId]);

  const submit = async () => {
    const res = await submitLessonQuiz(quizId, answers);
    setResult(res.data);
  };

  if (!quiz) return <div className="text-white/60">Loading quiz...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{quiz.title}</h1>
      <p className="text-white/70">Attempts left: {quiz.attemptsLeft}</p>
      {quiz.questions.map((q, i) => (
        <div key={i} className="glass rounded-xl border border-white/10 p-4">
          <div>{i + 1}. {q.question}</div>
          <div className="mt-2 space-y-2">
            {q.options.map((op, idx) => (
              <button
                key={idx}
                className={`w-full text-left p-2 rounded-lg border ${answers[i] === idx ? "border-[#f7d774]" : "border-white/10"}`}
                onClick={() => setAnswers((p) => ({ ...p, [i]: idx }))}
              >
                {op}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button className="btn-gold" onClick={submit}>Submit</button>
      {result && (
        <div className="glass rounded-xl border border-white/10 p-4">
          Score: {result.score}% | {result.passed ? "Passed" : "Failed"}
          <div className="mt-2">
            <button className="btn-ghost" onClick={() => navigate(-1)}>Back</button>
          </div>
        </div>
      )}
    </div>
  );
}
