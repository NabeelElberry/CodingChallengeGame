// framer motion
export const textFlashVariant = {
    flash: { color: ["#ffffff", "#322f98", "#ffffff"],
            transition: {
                duration: 1,
                times: [0,0.33,0.66], // evenly spaced flashes
                ease: "easeInOut",
            },
        },
    idle: { color: "#322f98" },
    selected: {color: "#ffffff"},
    whileHover: {
        color: "#ffffff",
        transition: {duration: 1}
    }
}

export const variants = {
    exit: {x: -3000, transition: {duration: 0.5}},
};
  

export const smallClass = "w-60 h-20 md:w-100 3xl:h-50 3xl:w-120"
export const largeClass = "w-80 h-30 md:w-200 3xl:h-70 3xl:w-240"


