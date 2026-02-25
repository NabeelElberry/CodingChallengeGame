import type { Question } from "./interfaces";

const shuffle = (arr: string[]) => {
  let i = arr.length,
    j,
    temp;

  while (--i > 0) {
    j = Math.floor(Math.random() * (i + 1));
    temp = arr[j];
    arr[j] = arr[i];
    arr[i] = temp;
  }

  return arr;
};

export const retrieveGameOrder = (
  answerOrder: string,
  currentStage: number,
  minigameOrder: string,
  currentMinigameNumber: string,
) => {
  // logic for finding which answer order string to get
  let gameOrderToGet = 0;

  // I think this logic essentially finds what the number of times each minigame has been played is
  // it's really confusing though I genuinely don't understand how it's working
  // wouldn't it be better to just store it in a variable or something
  // and then update it to redis

  let x = 0;
  while (x < currentStage && minigameOrder != null) {
    if (minigameOrder[x] == minigameOrder[currentStage]) {
      gameOrderToGet += 1;
    }
    x++;
  }

  console.log("Game order to get");

  const gameOrderJson = JSON.parse(answerOrder!);
  console.log(
    `GameAnswerOrder for 0 ${gameOrderJson.zero}, for 1: ${gameOrderJson.one}, for 2: ${gameOrderJson.two}`,
  );

  let whatToQuery: string = "";

  console.log(`Current minigame: ${currentMinigameNumber}`);

  if (parseInt(currentMinigameNumber) == 0) {
    whatToQuery = gameOrderJson.zero.toString();
  } else if (parseInt(currentMinigameNumber) == 1) {
    whatToQuery = gameOrderJson.one.toString();
  } else if (parseInt(currentMinigameNumber) == 2) {
    whatToQuery = gameOrderJson.two.toString();
  }

  console.log(
    `Current Answer Order: ${whatToQuery} XXXXXXXX ${
      whatToQuery.split(",")[gameOrderToGet]
    }`,
  );

  return whatToQuery.split(",")[gameOrderToGet];
};

export const adjustQuestionInformation = (
  prevQuestionInfo: Question,
  randomAnswerIndex: string,
) => {
  const correctAnswerNumber = prevQuestionInfo.correctAnswer;
  const randomAnswerIndexArr = [...randomAnswerIndex];
  const newCorrectAnswerIndex: number = randomAnswerIndexArr.findIndex(
    (ele) => Number(ele) == correctAnswerNumber,
  );
  console.log(
    "prevQuestionInfo: ",
    prevQuestionInfo,
    " randomAnswerIndex: ",
    randomAnswerIndex,
  );
  const answerChoices = prevQuestionInfo.answerChoices;

  const newAnswerChoicesArr: string[] = [];
  randomAnswerIndexArr.forEach((strIndex, arrIndex) => {
    const numIndex = Number(strIndex);
    const answerChoiceByRandIndex = answerChoices[numIndex];
    newAnswerChoicesArr[arrIndex] = answerChoiceByRandIndex;
  });

  return {
    correctAnswer: newCorrectAnswerIndex,
    answerChoices: newAnswerChoicesArr,
    questionText: prevQuestionInfo.questionText,
  };
};
// export const mixAnswerChoiceOrder = (
//   gameInformation: Question | null,
// ): Question | undefined => {
//   if (!gameInformation) return;
//   let answerChoices = gameInformation.answerChoices;
//   let correctAnswerIndex = gameInformation.correctAnswer;
//   let correctAnswerLetter = answerChoices[correctAnswerIndex];

//   let shuffledAnswerChoices = shuffle(answerChoices);
//   return {
//     correctAnswer: shuffledAnswerChoices.findIndex(
//       (ele) => ele == correctAnswerLetter,
//     ),
//     answerChoices: shuffledAnswerChoices,
//     questionText: gameInformation.questionText,
//   };
// };
