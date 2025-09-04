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
