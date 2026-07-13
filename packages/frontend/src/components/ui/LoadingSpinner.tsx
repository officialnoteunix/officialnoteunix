export default function LoadingSpinner({ large }: { large?: boolean }) {
  return (
    <div className="loading-screen" role="status" aria-label="Loading">
      <div className={`spinner ${large ? 'spinner-lg' : ''}`} />
    </div>
  );
}
