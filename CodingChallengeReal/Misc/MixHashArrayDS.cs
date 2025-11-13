using System.Collections;

namespace CodingChallengeReal.Misc
{
    public class MixHashArrayDS
    {
        Dictionary<int, int> dict;
        List<int> array;

        public MixHashArrayDS()
        {
            dict = new Dictionary<int, int>();
            array = new List<int>();
        }

        public Boolean Insert(int number)
        {
            array.Add(number);

            var indexOfNumber = array.Count - 1;
            dict.Add(number, indexOfNumber);
            return true;
        }

        public Boolean Remove(int number)
        {
            if (!dict.ContainsKey(number)) return false;

            int lastIndex = array.Count - 1;
            int lastElement = array[lastIndex];
            int removeIndex = dict[number];

            // Swap element to remove with last
            array[removeIndex] = lastElement;
            dict[lastElement] = removeIndex;

            // Remove last element
            array.RemoveAt(lastIndex);

            // Remove from dictionary
            dict.Remove(number);

            return true;
        }

        public Boolean Contains(int number)
        {
            return dict.ContainsKey(number);
        }

        public int GetRandomElement()
        {
            Random rand = new Random();
            int r = rand.Next(array.Count);
            return array[r];
        }
    }
}
