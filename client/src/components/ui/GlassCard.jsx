// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

export const GlassCard = ({ children, className = "", delay = 0 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay: delay, ease: "easeOut" }}
      className={`
        relative overflow-hidden
        backdrop-blur-xl 
        bg-white/10 dark:bg-slate-900/40 
        border border-white/20 dark:border-white/10 
        shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] 
        rounded-3xl p-6 
        ${className}
      `}
    >
      {/* Subtle shine effect on top edge */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50" />
      
      {children}
    </motion.div>
  );
};
