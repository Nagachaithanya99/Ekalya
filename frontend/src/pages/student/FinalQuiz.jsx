import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  startFinalQuizFlow,
  submitFinalQuizFlow,
  reportFinalQuizViolation,
} from "../../services/courseLifecycleService";

export default function FinalQuiz() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [warning, setWarning] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(null);
  const timeoutSubmitRef = useRef(false);
  const lockRef = useRef(false);

  const attempted = useMemo(() => Object.keys(answers).length, [answers]);
  const totalQuestions = quiz?.questions?.length || 0;
  const allAnswered = totalQuestions > 0 && attempted === totalQuestions;
  const formattedTimer = useMemo(() => {
    if (typeof timeLeftSeconds !== "number") return "--:--";
    const mins = Math.floor(timeLeftSeconds / 60);
    const secs = timeLeftSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, [timeLeftSeconds]);

  useEffect(() => {
    startFinalQuizFlow(courseId)
      .then((r) => {
        if (r.data?.locked) {
          if (r.data?.passed) {
            if (r.data?.canSelectTemplate) {
              navigate(`/student/v2/courses/${courseId}/certificate/template`, {
                replace: true,
              });
            } else {
              navigate(`/student/certificates`, { replace: true });
            }
            return;
          }
          setLoadError(r.data?.message || "Final quiz is locked.");
          setQuiz(null);
          return;
        }
        setLoadError("");
        setQuiz(r.data);
        const minutes = Number(r.data?.timeLimitMinutes || 15);
        setTimeLeftSeconds(Math.max(1, Math.floor(minutes * 60)));
      })
      .catch((e) => {
        setQuiz(null);
        setLoadError(e?.response?.data?.message || "Final quiz unavailable");
      });
  }, [courseId]);

  useEffect(() => {
    if (!quiz || result) return;

    const warnExitMessage =
      "If you exit, it is treated as fail. Please complete the quiz.";

    const beforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onPopState = () => {
      window.history.pushState(null, "", window.location.href);
      alert(warnExitMessage);
    };
    const onLinkCapture = (e) => {
      const anchor = e.target?.closest?.("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (!href || href.startsWith("#")) return;
      e.preventDefault();
      e.stopPropagation();
      alert(warnExitMessage);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("popstate", onPopState);
    document.addEventListener("click", onLinkCapture, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("click", onLinkCapture, true);
    };
  }, [quiz, result]);

  const reportViolation = async (reason) => {
    if (lockRef.current || result) return;
    lockRef.current = true;
    try {
      const res = await reportFinalQuizViolation(courseId, reason);
      const action = res.data?.action;
      const msg = res.data?.message || "Violation reported";
      if (action === "AUTO_FAIL") {
        alert(msg);
        navigate(`/student/v2/courses/${courseId}`);
        return;
      }
      setWarning(msg);
      setShowWarning(true);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => {
        lockRef.current = false;
      }, 300);
    }
  };

  useEffect(() => {
    const onFs = () => {
      const active = !!document.fullscreenElement;
      if (!active && quiz && !result) reportViolation("EXIT_FULLSCREEN");
      setIsFullscreen(active);
    };
    const onVis = () => {
      if (document.hidden && quiz && !result) reportViolation("TAB_SWITCH");
    };
    const onBlur = () => {
      if (quiz && !result) reportViolation("WINDOW_BLUR");
    };

    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
    };
  }, [quiz, result]);

  useEffect(() => {
    if (!quiz || result) return;
    const onContextMenu = (e) => e.preventDefault();
    const onKeyDown = async (e) => {
      const k = String(e.key || "").toLowerCase();
      const isMacShot = e.metaKey && e.shiftKey && (k === "3" || k === "4");
      const isPrint = k === "printscreen";
      const isPrintPage = (e.ctrlKey || e.metaKey) && k === "p";
      if (isPrint || isMacShot || isPrintPage) {
        e.preventDefault();
        e.stopPropagation();
        try {
          await navigator.clipboard?.writeText("");
        } catch {}
        alert("Screenshots/printing are not allowed during final quiz.");
      }
    };
    document.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [quiz, result]);

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      alert("Please allow fullscreen mode.");
    }
  };

  const submit = async () => {
    if (!allAnswered) {
      alert("Please answer all questions before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitFinalQuizFlow(courseId, answers);
      setResult(res.data);
      if (res.data?.passed && res.data?.canSelectTemplate) {
        navigate(`/student/v2/courses/${courseId}/certificate/template`);
      } else if (res.data?.passed) {
        alert(
          res.data?.message ||
            "Passed, but template selection requires first attempt with >=75%."
        );
        navigate(`/student/v2/courses/${courseId}`);
      }
    } catch (e) {
      alert(e?.response?.data?.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!quiz || result || submitting) return;
    if (typeof timeLeftSeconds !== "number") return;

    if (timeLeftSeconds <= 0) {
      if (timeoutSubmitRef.current) return;
      timeoutSubmitRef.current = true;
      setSubmitting(true);
      submitFinalQuizFlow(courseId, answers)
        .then((res) => {
          setResult(res.data);
          if (res.data?.passed && res.data?.canSelectTemplate) {
            navigate(`/student/v2/courses/${courseId}/certificate/template`);
          } else if (res.data?.passed) {
            alert(
              res.data?.message ||
                "Passed, but template selection requires first attempt with >=75%."
            );
            navigate(`/student/v2/courses/${courseId}`);
          }
        })
        .catch((e) => {
          alert(e?.response?.data?.message || "Submit failed");
        })
        .finally(() => setSubmitting(false));
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (typeof prev !== "number") return prev;
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quiz, result, submitting, timeLeftSeconds, courseId, answers, navigate]);

  if (loadError) {
    return (
      <div className="min-h-screen bg-black text-white p-5 space-y-4">
        <div className="glass rounded-2xl p-6 border border-red-400/30">
          <h2 className="text-xl font-bold text-red-200">Final Quiz Unavailable</h2>
          <p className="mt-2 text-white/80">{loadError}</p>
          <div className="mt-4 flex gap-3">
            <button className="btn-gold" onClick={() => window.location.reload()}>
              Retry
            </button>
            <button
              className="btn-ghost"
              onClick={() => navigate(`/student/v2/courses/${courseId}`)}
            >
              Back to Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) return <div className="text-white/60">Loading final quiz...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-5 space-y-4">
      {!isFullscreen && !result && (
        <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4">
          <div className="glass rounded-2xl p-6 border border-white/10 max-w-md">
            <h2 className="text-xl font-bold">Fullscreen Required</h2>
            <p className="text-sm text-white/70 mt-2">
              Final quiz anti-cheat is active. 3 violations auto-fail the attempt.
              If you try to exit, it is considered a fail. Complete the quiz.
            </p>
            <button className="btn-gold mt-4 w-full" onClick={enterFullscreen}>
              Enter Fullscreen
            </button>
          </div>
        </div>
      )}

      {showWarning && (
        <div className="fixed inset-0 z-[1100] bg-black/70 flex items-center justify-center p-4">
          <div className="glass rounded-2xl p-6 border border-yellow-400/30 max-w-md">
            <h3 className="font-extrabold text-yellow-200">Anti-cheat Warning</h3>
            <p className="mt-2 text-white/80">{warning}</p>
            <button className="btn-gold mt-4 w-full" onClick={() => setShowWarning(false)}>
              Continue Quiz
            </button>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-extrabold">{quiz.title}</h1>
      <div className="text-sm text-white/70">
        Attempted Questions: {attempted}/{quiz.questions.length} | Attempts left: {quiz.attemptsLeft} | Pass score: {quiz.passingScore}% | Time left: {formattedTimer}
      </div>
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
      <button className="btn-gold" onClick={submit} disabled={submitting || !allAnswered}>
        {submitting ? "Submitting..." : "Submit Final Quiz"}
      </button>
      {result && (
        <div className="glass rounded-xl border border-white/10 p-4">
          Score: {result.score}% | {result.passed ? "Passed" : "Failed"}
        </div>
      )}
    </div>
  );
}
