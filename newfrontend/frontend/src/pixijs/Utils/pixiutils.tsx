interface types {
  object1: any;
  object2: any;
}

export const checkForAABB = (object1: any, object2: any) => {
  const bounds1 = object1.getBounds();
  const bounds2 = object2.getBounds();

  return (
    bounds1.x < bounds2.x + bounds2.width &&
    bounds1.x + bounds1.width > bounds2.x &&
    bounds1.y < bounds2.y + bounds2.height &&
    bounds1.y + bounds1.height > bounds2.y
  );
};

export const checkForAABBNoObject = (
  coordinates1: { x: number; y: number },
  size1: { width: number; height: number },
  coordinates2: { x: number; y: number },
  size2: { width: number; height: number }
) => {
  return (
    coordinates1.x < coordinates2.x + size2.width &&
    coordinates1.x + size1.width > coordinates2.x &&
    coordinates1.y < coordinates2.y + size2.height &&
    coordinates1.y + size1.height > coordinates2.y
  );
};

export const numToAnswer = (input: number) => {
  if (input >= 3) {
    //console.log(`Input is ${input}, returning D`);
    return "D";
  }
  if (input >= 2) {
    //console.log(`Input is ${input}, returning C`);
    return "C";
  }
  if (input >= 1) {
    //console.log(`Input is ${input}, returning B`);
    return "B";
  }
  if (input >= 0) {
    //console.log(`Input is ${input}, returning A`);
    return "A";
  }
  return "UNDEFINED";
};

export const generateAnswerChoice = () => {
  const val = Math.random() * 4;
  // console.log(`Number: ${val}`);
  return numToAnswer(val);
};

export const answerToNumber = (letter: string) => {
  if (letter == "D") {
    return 3;
  } else if (letter == "C") {
    return 2;
  } else if (letter == "B") {
    return 1;
  } else {
    return 0;
  }
};
