
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
    public class ProblemSetRepository : IProblemSetRepository
    {
        private readonly IAmazonDynamoDB _dynamoDB;
        private readonly IOptions<DatabaseSettings> _databaseSettings;

        public ProblemSetRepository(IAmazonDynamoDB dynamoDb,
            IOptions<DatabaseSettings> databaseSettings) {
            _dynamoDB = dynamoDb;
            _databaseSettings = databaseSettings;
        }
        public async Task<bool> AddAsync(ProblemSet question)
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

        public async Task<ProblemSetDTO> GetAsync(Guid id)
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
            return SystemTextJson.JsonSerializer.Deserialize<ProblemSetDTO>(itemAsDocument.ToJson());
        }

        public async Task<bool> UpdateAsync(Guid id, ProblemSet question)
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


    }

}
