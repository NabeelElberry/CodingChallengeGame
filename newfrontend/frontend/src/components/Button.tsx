import * as motion from "motion/react-client";

interface CustomButtonProps {
  children: React.ReactNode;
  width?: string | number; // e.g. "150px", "10rem", or 200
  tailwindTextSize?: string | number;
  spacing?: string | number;
  height?: string | number;
  className?: string | number;
  pulse?: boolean;
  onClick?: () => void;
}

function CustomButton({ children, tailwindTextSize, spacing, className, pulse, onClick}: CustomButtonProps) {
  return (
    <button onClick={onClick}
      className={`p-2 
        bg-text-color text-button-text rounded-2xl 
        duration-500 flex items-center justify-center text-center
        hover:cursor-pointer
        ${!pulse ? "hover:text-white": ""}
        ${className ?? ''}
        `}
    >
      {pulse 
      ? 
      <motion.div className={`w-full ${tailwindTextSize ? tailwindTextSize : "text-sm"} ${spacing ?? ""}`} 
      animate={{ color: ['#ffffff', '#322f98', '#ffffff'] }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}  


      > {children}</motion.div>
      : 
      <span className={`w-full ${tailwindTextSize ? tailwindTextSize : "text-sm"} ${spacing ?? ""}`}>{children}</span>}
      
    </button>
  );
}


export default CustomButton;