export default function Toast({ message, type }) {
  if (!message) {
    return null;
  }

  const backgroundClass = type === "error" ? "bg-red-600" : "bg-emerald-600";

  return (
    <div
      className={`fixed right-5 top-5 z-50 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${backgroundClass}`}
    >
      {message}
    </div>
  );
}
