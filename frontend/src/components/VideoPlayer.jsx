export default function VideoPlayer({
  src,
  startTime,
  onProgress,
  onComplete,
}) {
  return (
    <video
      src={src}
      controls
      autoPlay
      onLoadedMetadata={(e) => {
        e.target.currentTime = startTime;
      }}
      onTimeUpdate={(e) => {
        onProgress(e.target.currentTime);
      }}
      onEnded={onComplete}
      className="w-full rounded-xl"
    />
  );
}
