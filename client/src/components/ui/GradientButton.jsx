// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

export const GradientButton = ({ children, onClick, loading, disabled, className = "" }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading || disabled}
      className={`
        relative overflow-hidden group
        bg-gradient-to-r from-indigo-600 to-purple-600 
        hover:from-indigo-500 hover:to-purple-500
        text-white font-bold py-4 px-8 rounded-xl shadow-lg 
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-300
        ${className}
      `}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
            <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
            </>
        ) : children}
      </span>
      
      {/* Shine effect passing through on hover */}
      <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
    </motion.button>
  );
};
