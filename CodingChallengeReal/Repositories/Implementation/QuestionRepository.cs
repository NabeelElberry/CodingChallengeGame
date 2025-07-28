
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.Model;
using CodingChallengeReal.Domains;
using CodingChallengeReal.DTO;
using CodingChallengeReal.Repositories.Interface;
using CodingChallengeReal.Settings;
using Microsoft.Extensions.Options;
using SystemTextJson = System.Text.Json;
using NewtonsoftJson = Newtonsoft.Json;


namespace CodingChallengeReal.Repositories.Implementation
{
    public class QuestionRepository : IQuestionRepository
    {
        private readonly IAmazonDynamoDB _dynamoDB;
        private readonly IOptions<DatabaseSettings> _databaseSettings;

        public QuestionRepository(IAmazonDynamoDB dynamoDb,
            IOptions<DatabaseSettings> databaseSettings) {
            _dynamoDB = dynamoDb;
            _databaseSettings = databaseSettings;
        }
        public async Task<bool> AddAsync(Question question)
        {
            var questionAsJson = SystemTextJson.JsonSerializer.Serialize(question);
            var itemAsDocument = Document.FromJson(questionAsJson);
            var itemAsAttribute = itemAsDocument.ToAttributeMap();
            var createItemRequest = new PutItemRequest
            {
                TableName = _databaseSettings.Value.TableName,
                Item = itemAsAttribute
            };

            var response = await _dynamoDB.PutItemAsync(createItemRequest);
            return response.HttpStatusCode == System.Net.HttpStatusCode.OK;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var deleteItemRequest = new DeleteItemRequest
            {
                TableName = _databaseSettings.Value.TableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    {"pk", new AttributeValue {S = $"q#{id}"} },
                    {"sk", new AttributeValue {S = "meta"} }
                }
            };
            var response = await _dynamoDB.DeleteItemAsync(deleteItemRequest);
            return response.HttpStatusCode == System.Net.HttpStatusCode.OK;
        }

        public async Task<QuestionDTO> GetAsync(Guid id)
        {
            var request = new GetItemRequest
            {
                TableName = _databaseSettings.Value.TableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    {"pk", new AttributeValue {S = $"q#{id}" } },
                    {"sk", new AttributeValue {S = "meta"} }
                }
            };

            var response = await _dynamoDB.GetItemAsync(request);
            if (response.Item == null || response.Item.Count == 0)
            {
                return null;
            }

            var itemAsDocument = Document.FromAttributeMap(response.Item);
            return SystemTextJson.JsonSerializer.Deserialize<QuestionDTO>(itemAsDocument.ToJson());
        }

        public async Task<bool> UpdateAsync(Guid id, Question question)
        {
            question.id = id.ToString();
            var questionAsJson = SystemTextJson.JsonSerializer.Serialize(question);
            var itemAsDocument = Document.FromJson(questionAsJson);
            var itemAsAttribute = itemAsDocument.ToAttributeMap();
            var updateItemRequest = new PutItemRequest
            {
                TableName = _databaseSettings.Value.TableName,
                Item = itemAsAttribute
            };

            var response = await _dynamoDB.PutItemAsync(updateItemRequest);
            return response.HttpStatusCode == System.Net.HttpStatusCode.OK;
        }

        public async Task<bool> AddQuestionsFromBulk()
        {
            var jsonString = File.ReadAllText("questions_compare_func_cleaned.json");

            // Deserialize array of questions
            var documents = Newtonsoft.Json.JsonConvert.DeserializeObject<List<Dictionary<string, object>>>(jsonString);

            //foreach (var doc in documents)
            //{
                var doc = documents[0];
                Guid id = Guid.NewGuid();
                var itemAsDocument = Document.FromJson(Newtonsoft.Json.JsonConvert.SerializeObject(doc));
                itemAsDocument.Add(new KeyValuePair<string, DynamoDBEntry>("id", $"{id}"));
                itemAsDocument.Add(new KeyValuePair<string, DynamoDBEntry>("pk", $"q#{id}"));
                itemAsDocument.Add(new KeyValuePair<string, DynamoDBEntry>("sk", "meta"));
            

                string difficultyString = itemAsDocument["difficulty"];
                var difficultyValue = difficultyString.ToLower() switch
                {
                    "easy" => 0,
                    "medium" => 1,
                    _ => 2
                };
                itemAsDocument.Remove("difficulty");
                itemAsDocument.Add("difficulty", difficultyValue);

                var itemAsAttribute = itemAsDocument.ToAttributeMap();

                var createItemRequest = new PutItemRequest
                {
                    TableName = _databaseSettings.Value.TableName,
                    Item = itemAsAttribute
                };

                var response = await _dynamoDB.PutItemAsync(createItemRequest);

                if (response.HttpStatusCode != System.Net.HttpStatusCode.OK)
                {
                    return false; // Or log and continue if you'd rather batch insert
                }
            //}

            return true;
        }


    }

}
