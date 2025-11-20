export const retrieveGameOrder = (
  answerOrder: string,
  currentStage: number,
  minigameOrder: string,
  currentMinigameNumber: string
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
    `GameAnswerOrder for 0 ${gameOrderJson.zero}, for 1: ${gameOrderJson.one}, for 2: ${gameOrderJson.two}`
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
    }`
  );

  return whatToQuery.split(",")[gameOrderToGet];
};
