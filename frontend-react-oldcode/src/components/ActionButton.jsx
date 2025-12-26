export default function ActionButton({ text, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-purple-600 text-white py-3 rounded-xl text-lg font-semibold hover:bg-purple-700 transition"
    >
      {text}
    </button>
  );
}