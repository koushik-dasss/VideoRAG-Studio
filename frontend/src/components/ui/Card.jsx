export default function Card({
  children,
  className = "",
}) {
  return (
    <div
      className={`
        bg-slate-950
        border
        border-slate-800
        rounded-2xl
        shadow-lg
        p-6
        transition-all
        duration-300
        hover:border-blue-500
        ${className}
      `}
    >
      {children}
    </div>
  );
}