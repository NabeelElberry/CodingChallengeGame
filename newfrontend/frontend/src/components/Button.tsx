interface CustomButtonProps {
  children: React.ReactNode;
  width?: string | number; // e.g. "150px", "10rem", or 200
  size?: string | number;
  spacing?: string | number;
  height?: string | number;
}

function CustomButton({ children, width, size, spacing, height }: CustomButtonProps) {
    return <button className={`p-2 
         ${width ? `w-${width} ` : "w-20 "} 
         ${height ? `h-${height} ` : ""} 
        bg-text-color text-button-text rounded-2xl 
        hover:text-white hover:cursor-pointer duration-500 text-center`}>
          <span className={`w-full ${size ? `text-${size} ` : "text-sm " } ${spacing ? spacing : ""}`}>{children}</span>
    </button>
}

export default CustomButton;