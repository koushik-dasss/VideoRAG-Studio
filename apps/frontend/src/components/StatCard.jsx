import { motion } from "framer-motion";

export default function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
}) {
  const Icon = icon;

  return (
    <motion.div
      whileHover={{
        y: -8,
        scale: 1.03,
      }}
      transition={{
        duration: 0.25,
      }}
      className="
      relative
      overflow-hidden
      rounded-3xl
      border
      border-slate-800
      bg-gradient-to-br
      from-slate-950
      to-slate-900
      p-6
      shadow-xl
      "
    >
      {/* Glow */}
      <div
        className="
        absolute
        -top-16
        -right-16
        w-40
        h-40
        rounded-full
        blur-3xl
        opacity-20
        bg-blue-500
      "
      />

      <div className="flex justify-between relative z-10">

        <div>

          <p className="text-slate-400 text-sm tracking-wide">
            {title}
          </p>

          <h2 className="text-5xl font-bold mt-3">
            {value}
          </h2>

          <p className="text-slate-500 mt-4 text-sm">
            {subtitle}
          </p>

        </div>

        <div
          className={`${color}
          w-16
          h-16
          rounded-2xl
          flex
          items-center
          justify-center
          shadow-lg`}
        >
          <Icon
            size={30}
            className="text-white"
          />
        </div>

      </div>

    </motion.div>
  );
}