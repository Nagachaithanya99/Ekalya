import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { getQuiz, submitQuiz } from "../../services/quizService";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/clerk-react";

export default function Quiz() {
  const { courseId } = useParams();
  const [search] = useSearchParams();
  const lessonId = search.get("lessonId");
  const isFinalQuiz = !lessonId;
  const navigate = useNavigate();
  const { user } = useUser();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const [autoFailReason, setAutoFailReason] = useState("");
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(null);
  const [loadError, setLoadError] = useState("");

  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(
    !!document.fullscreenElement
  );

  const forceFailRef = useRef(false);
  const timeoutSubmitRef = useRef(false);
  const isAttemptLocked = !result;

  useEffect(() => {
    let mounted = true;
    getQuiz({ courseId, lessonId })
      .then((res) => {
        if (!mounted) return;
        setLoadError("");
        setQuiz(res.data);
        if (typeof res.data?.attemptsLeft === "number") {
          setAttemptsLeft(res.data.attemptsLeft);
        }
        const minutes = Number(res.data?.timeLimitMinutes || 15);
        setTimeLeftSeconds(Math.max(1, Math.floor(minutes * 60)));
        timeoutSubmitRef.current = false;
      })
      .catch((err) => {
        if (!mounted) return;
        const msg =
          err?.response?.data?.message ||
          "Quiz is not available right now. Please try again later.";
        setLoadError(msg);
        setQuiz(null);
      });

    return () => {
      mounted = false;
    };
  }, [courseId, lessonId]);

  const totalQuestions = quiz?.questions?.length || 0;
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;
  const formattedTimer = useMemo(() => {
    if (typeof timeLeftSeconds !== "number") return "--:--";
    const mins = Math.floor(timeLeftSeconds / 60);
    const secs = timeLeftSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, [timeLeftSeconds]);

  const forceFailAttempt = async (reason) => {
    if (!quiz?._id || forceFailRef.current || submitting || result) return;
    forceFailRef.current = true;
    setAutoFailReason(reason || "Quiz failed due to rule violation.");
    setSubmitting(true);
    try {
      const res = await submitQuiz({ quizId: quiz._id, answers: {} });
      if (res?.data?.alreadyPassed) {
        alert(res.data.message || "You had already attempted successfully before.");
        navigate("/student/certificates");
        return;
      }
      setResult(res.data || { score: 0, passed: false });
      if (typeof res.data?.attemptsLeft === "number") {
        setAttemptsLeft(res.data.attemptsLeft);
      }
      alert(reason || "Quiz failed due to rule violation.");
    } catch (err) {
      const msg = err?.response?.data?.message || "Quiz failed";
      const alreadyPassed = !!err?.response?.data?.alreadyPassed;
      if (alreadyPassed) {
        alert(msg);
        navigate("/student/certificates");
        return;
      }
      if (typeof err?.response?.data?.attemptsLeft === "number") {
        setAttemptsLeft(err.response.data.attemptsLeft);
      }
      setResult({ score: 0, passed: false });
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      alert("Please allow fullscreen mode for quiz.");
    }
  };

  useEffect(() => {
    if (!quiz || !isAttemptLocked) return;

    const beforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const onPopState = () => {
      window.history.pushState(null, "", window.location.href);
      alert("Finish and submit the quiz before leaving this page.");
    };

    const onLinkCapture = (e) => {
      const anchor = e.target?.closest?.("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (!href || href.startsWith("#")) return;
      e.preventDefault();
      e.stopPropagation();
      alert("Finish and submit the quiz before leaving this page.");
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
  }, [quiz, isAttemptLocked]);

  useEffect(() => {
    if (!quiz || !isAttemptLocked) return;

    const onContextMenu = (e) => e.preventDefault();
    const onVisibility = () => {
      if (document.hidden) {
        forceFailAttempt("You switched tab/window. Quiz is marked as failed.");
      }
    };
    const onBlur = () => {
      forceFailAttempt("You switched out of quiz window. Quiz is marked as failed.");
    };
    const onKeyDown = async (e) => {
      const k = String(e.key || "").toLowerCase();
      const isMacShot = e.metaKey && e.shiftKey && (k === "3" || k === "4");
      const isPrint = k === "printscreen";
      const isPrintPage = (e.ctrlKey || e.metaKey) && k === "p";
      const isDevTools =
        e.key === "F12" || ((e.ctrlKey || e.metaKey) && e.shiftKey && k === "i");

      if (isPrint || isMacShot || isPrintPage || isDevTools) {
        e.preventDefault();
        e.stopPropagation();
        try {
          await navigator.clipboard?.writeText("");
        } catch {}
        alert("Screenshots/recording/printing are blocked during quiz.");
      }
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [quiz, isAttemptLocked, result, submitting]);

  useEffect(() => {
    const onFsChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (active) setHasEnteredFullscreen(true);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    if (!quiz || !isAttemptLocked) return;
    if (hasEnteredFullscreen && !isFullscreen) {
      forceFailAttempt("You exited fullscreen. Quiz is marked as failed.");
    }
  }, [quiz, isAttemptLocked, hasEnteredFullscreen, isFullscreen]);

  // After submit result, restore normal portal behavior by leaving fullscreen.
  useEffect(() => {
    if (!result) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, [result]);

  const resetForRetry = () => {
    forceFailRef.current = false;
    timeoutSubmitRef.current = false;
    setAutoFailReason("");
    setAnswers({});
    setResult(null);
    const minutes = Number(quiz?.timeLimitMinutes || 15);
    setTimeLeftSeconds(Math.max(1, Math.floor(minutes * 60)));
  };

  const handleSubmit = async ({ force = false } = {}) => {
    if (!quiz?._id) return;
    if (!force && !allAnswered) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitQuiz({ quizId: quiz._id, answers });
      if (res?.data?.alreadyPassed) {
        alert(res.data.message || "You had already attempted successfully before.");
        navigate("/student/certificates");
        return;
      }
      setResult(res.data);
      if (typeof res.data?.attemptsLeft === "number") {
        setAttemptsLeft(res.data.attemptsLeft);
      }

      if (res.data?.passed) {
        setTimeout(() => {
          if (isFinalQuiz) {
            navigate(`/student/certificates/templates?courseId=${courseId}`);
          }
          else navigate(`/student/watch/${courseId}`);
        }, 3000);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Quiz submission failed";
      const alreadyPassed = !!err?.response?.data?.alreadyPassed;
      if (alreadyPassed) {
        alert(msg);
        navigate("/student/certificates");
        return;
      }
      alert(msg);
      if (typeof err?.response?.data?.attemptsLeft === "number") {
        setAttemptsLeft(err.response.data.attemptsLeft);
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!quiz || !isAttemptLocked) return;
    if (typeof timeLeftSeconds !== "number") return;
    if (submitting) return;

    if (timeLeftSeconds <= 0) {
      if (timeoutSubmitRef.current) return;
      timeoutSubmitRef.current = true;
      handleSubmit({ force: true });
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
  }, [quiz, isAttemptLocked, submitting, timeLeftSeconds]);

  if (loadError) {
    return (
      <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8">
        <div className="glass rounded-3xl p-6 border border-red-400/25 bg-red-500/5 max-w-2xl">
          <p className="text-sm text-red-200/90">Quiz unavailable</p>
          <p className="mt-2 text-white/80">{loadError}</p>
          <div className="mt-4 flex gap-3">
            <button onClick={() => navigate(`/student/watch/${courseId}`)} className="btn-gold">
              Back to Course
            </button>
            <button onClick={() => navigate("/student/certificates")} className="btn-ghost">
              Go Certificates
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) return <div className="text-white/60">Loading quiz...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8 relative">
      {isAttemptLocked && (
        <div className="pointer-events-none fixed inset-0 z-[5] opacity-[0.08]">
          <div className="absolute inset-0 flex items-center justify-center rotate-[-18deg] text-2xl font-extrabold tracking-wider">
            {user?.primaryEmailAddress?.emailAddress || "Protected Quiz"} •{" "}
            {new Date().toLocaleString()}
          </div>
        </div>
      )}

      {isAttemptLocked && !isFullscreen && (
        <div className="fixed inset-0 z-[1100] bg-black/90 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl border border-white/15 bg-[#111] p-6 text-center">
            <h2 className="text-xl font-extrabold">Quiz Locked Mode</h2>
            <p className="mt-2 text-sm text-white/70">
              Enter fullscreen to continue. If you exit fullscreen or switch window,
              your quiz will be failed automatically.
            </p>
            <button onClick={enterFullscreen} className="btn-gold mt-5 w-full">
              Enter Fullscreen
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6 relative z-[10]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 border border-white/10 relative overflow-hidden"
        >
          <div className="aurora-line absolute top-0 left-0 right-0" />
          <div className="relative z-10">
            <p className="text-white/60 text-sm">
              {isFinalQuiz ? "Final Course Quiz" : "Lesson Quiz"}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold">
              Quiz: <span className="text-gold">{quiz.title}</span>
            </h1>

            <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/60">
              <span className="badge">
                Questions: <span className="text-white/85">{totalQuestions}</span>
              </span>
              <span className="badge">
                Attempted Questions:{" "}
                <span className="text-white/85">
                  {answeredCount}/{totalQuestions}
                </span>
              </span>
              <span
                className={`badge ${
                  typeof timeLeftSeconds === "number" && timeLeftSeconds <= 60
                    ? "text-red-200 border-red-400/30 bg-red-500/10"
                    : ""
                }`}
              >
                Time Left: <span className="text-white/90 font-semibold">{formattedTimer}</span>
              </span>
              {typeof attemptsLeft === "number" && (
                <span className="badge">
                  Attempts left:{" "}
                  <span className="text-gold font-semibold">{attemptsLeft}</span>
                </span>
              )}
              {isAttemptLocked && (
                <span className="badge text-yellow-200 border-yellow-300/25 bg-yellow-500/10">
                  Screen Locked Until Submit
                </span>
              )}
            </div>

            <div className="mt-4 h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width:
                    totalQuestions === 0
                      ? "0%"
                      : `${Math.round((answeredCount / totalQuestions) * 100)}%`,
                  background:
                    "linear-gradient(90deg, var(--gold), var(--fire), var(--water))",
                }}
              />
            </div>
          </div>
        </motion.div>

        <div className="space-y-4">
          {quiz.questions.map((q, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * Math.min(i, 8) }}
              className="glass rounded-3xl p-6 border border-white/10"
            >
              <p className="font-extrabold">
                {i + 1}. {q.question}
              </p>
              <div className="mt-4 space-y-2">
                {q.options.map((op, idx) => {
                  const selected = answers[i] === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!!result}
                      onClick={() => setAnswers({ ...answers, [i]: idx })}
                      className={`w-full text-left rounded-2xl px-4 py-3 border transition ${
                        selected
                          ? "bg-white/10 border-[rgba(247,215,116,0.25)] active-glow"
                          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                      } ${result ? "opacity-80 cursor-not-allowed" : ""}`}
                    >
                      <span className="text-white/85">{op}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {!result ? (
            <>
              <button
                onClick={handleSubmit}
                disabled={!allAnswered || submitting || attemptsLeft === 0}
                className={`btn-gold ${
                  !allAnswered || submitting || attemptsLeft === 0
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                }`}
              >
                {submitting ? "Submitting..." : "Submit Quiz"}
              </button>
              {!allAnswered && (
                <span className="text-sm text-white/60">
                  Answer all questions to enable submit.
                </span>
              )}
            </>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="glass rounded-3xl p-6 border border-white/10 w-full"
              >
                <p className="text-sm text-white/60">Result</p>
                <p className="mt-1 text-2xl font-extrabold">
                  Score: <span className="text-gold">{result.score}%</span>
                </p>

                <p className="mt-2 text-white/70">
                  {result.passed ? (
                    <>
                      Passed. Redirecting in <span className="text-gold font-semibold">3s</span>.
                    </>
                  ) : (
                    <>
                      Failed.
                      {autoFailReason ? (
                        <>
                          {" "}
                          <span className="text-red-300">{autoFailReason}</span>
                        </>
                      ) : null}
                      {typeof attemptsLeft === "number" ? (
                        <>
                          {" "}
                          Attempts left:{" "}
                          <span className="text-gold font-semibold">{attemptsLeft}</span>
                        </>
                      ) : null}
                    </>
                  )}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  {result.passed ? (
                    <button
                      onClick={() => {
                        if (isFinalQuiz) {
                          navigate(`/student/certificates/templates?courseId=${courseId}`);
                        }
                        else navigate(`/student/watch/${courseId}`);
                      }}
                      className="btn-gold"
                    >
                      Go Now
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={resetForRetry}
                        disabled={attemptsLeft === 0}
                        className={`btn-gold ${
                          attemptsLeft === 0 ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                      >
                        Retry Quiz
                      </button>
                      <button
                        onClick={() => navigate(`/student/watch/${courseId}`)}
                        className="btn-ghost"
                      >
                        Back to Lesson
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
