using Amazon.DynamoDBv2.Model;
using System.Text.Json;
using CodingChallengeReal.Domains;
using CodingChallengeReal.DTO;
using CodingChallengeReal.Repositories.Interface;
using CodingChallengeReal.Settings;
using Amazon.DynamoDBv2;
using Microsoft.Extensions.Options;
using Amazon.DynamoDBv2.DocumentModel;

namespace CodingChallengeReal.Repositories.Implementation
{
    public class SolutionRepository : ISolutionRepository
    {
        private readonly IOptions<DatabaseSettings> _databaseSettings;
        private readonly IAmazonDynamoDB _dynamoDB;

        public SolutionRepository(IAmazonDynamoDB dynamoDb,
            IOptions<DatabaseSettings> databaseSettings) {
            this._databaseSettings = databaseSettings;
            this._dynamoDB = dynamoDb;
        }
        public async Task<bool> AddAsync(Solution solution)
        {
            var solnAsJson = JsonSerializer.Serialize(solution);
            var itemAsDocument = Document.FromJson(solnAsJson);
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
                    {"pk", new AttributeValue {S = $"s#{id}"} },
                    {"sk", new AttributeValue {S = "meta"} }
                }
            };
            var response = await _dynamoDB.DeleteItemAsync(deleteItemRequest);
            return response.HttpStatusCode == System.Net.HttpStatusCode.OK;
        }

        public async Task<SolutionDTO> GetAsync(Guid id)
        {
            var request = new GetItemRequest
            {
                TableName = _databaseSettings.Value.TableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    {"pk", new AttributeValue {S = $"s#{id}" } },
                    {"sk", new AttributeValue {S = "meta"} }
                }
            };

            var response = await _dynamoDB.GetItemAsync(request);
            if (response.Item == null || response.Item.Count == 0)
            {
                return null;
            }

            var itemAsDocument = Document.FromAttributeMap(response.Item);
            return JsonSerializer.Deserialize<SolutionDTO>(itemAsDocument.ToJson());
        }

        public async Task<bool> UpdateAsync(Guid id, Solution solution)
        {
            solution.id = id.ToString();
            var questionAsJson = JsonSerializer.Serialize(solution);
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
