import * as motion from "motion/react-client";

interface CustomButtonProps {
  children: React.ReactNode;
  width?: string | number; // e.g. "150px", "10rem", or 200
  size?: string | number;
  spacing?: string | number;
  height?: string | number;
  className?: string | number;
  pulse?: boolean;
}

function CustomButton({ children, width, size, spacing, height, className, pulse }: CustomButtonProps) {
  return (
    <button
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
      <motion.div className={`w-full ${size ? size : "text-sm"} ${spacing ?? ""}`} 
      animate={{ color: ['#ffffff', '#322f98', '#ffffff'] }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}  


      > {children}</motion.div>
      : 
      <span className={`w-full ${size ? size : "text-sm"} ${spacing ?? ""}`}>{children}</span>}
      
    </button>
  );
}


export default CustomButton;