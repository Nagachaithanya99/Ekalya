const errorHandler = (err, req, res, next) => {
  console.error("🔥 ERROR:", err);

  const status = err.status || 500;
  const message = err.message || "Something went wrong";

  res.status(status).json({ message });
};

export default errorHandler;
