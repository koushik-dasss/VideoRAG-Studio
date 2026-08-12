export default function StatusBadge({ status }) {
  let styles;

  switch (status) {
    case "Completed":
      styles = "bg-green-500/15 text-green-400 border border-green-500/30";
      break;
    case "Processing":
      styles = "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30";
      break;
    case "Failed":
      styles = "bg-red-500/15 text-red-400 border border-red-500/30";
      break;
    default:
      styles = "bg-slate-500/15 text-slate-300 border border-slate-500/30";
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles}`}>
      {status}
    </span>
  );
}