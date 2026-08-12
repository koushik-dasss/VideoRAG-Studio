import { motion } from "framer-motion";

export default function GlassCard({
  children,
  className = "",
}) {
  return (
    <motion.div
      whileHover={{
        scale: 1.01,
      }}
      transition={{
        duration: 0.25,
      }}
      className={`
      rounded-3xl
      border
      border-white/10
      backdrop-blur-xl
      bg-white/5
      shadow-[0_8px_40px_rgba(0,0,0,0.35)]
      p-6
      ${className}
      `}
    >
      {children}
    </motion.div>
  );
}