using System.Text.Json;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.Model;
using CodingChallengeReal.Domains;
using CodingChallengeReal.DTO;
using CodingChallengeReal.Repositories.Interface;
using CodingChallengeReal.Settings;
using Microsoft.Extensions.Options;

namespace CodingChallengeReal.Repositories.Implementation
{
    public class MatchRepository : IMatchRepository
    {
        private readonly IAmazonDynamoDB _dynamoDB;
        private readonly IOptions<DatabaseSettings> _databaseSettings;

        public MatchRepository(IAmazonDynamoDB dynamoDb,
            IOptions<DatabaseSettings> databaseSettings) {
            _dynamoDB = dynamoDb;
            _databaseSettings = databaseSettings;
        }

        public async Task<bool> AddAsync(Match match)
        {
            var matchAsJson = JsonSerializer.Serialize(match);
            var itemAsDocument = Document.FromJson(matchAsJson);
            var itemAsAttribute = itemAsDocument.ToAttributeMap();
            var createItemRequest = new PutItemRequest
            {
                TableName = _databaseSettings.Value.TableName,
                Item = itemAsAttribute
            };

            var response = await _dynamoDB.PutItemAsync(createItemRequest);
            var user1Attribute = Document.FromJson(
                                JsonSerializer.Serialize(
                                new UserPMatchDTO(match.user1, $"m#{match.id}", match.winner == 1 ? true : false, match.user2, match.problemSetId))).ToAttributeMap();

            createItemRequest.Item = user1Attribute;
            response = await _dynamoDB.PutItemAsync(createItemRequest);
            var user2Attribute = Document.FromJson(
                    JsonSerializer.Serialize(
                    new UserPMatchDTO(match.user2, $"m#{match.id}", match.winner == 1 ? false : true, match.user1, match.problemSetId))).ToAttributeMap();
            createItemRequest.Item = user2Attribute;
            response = await _dynamoDB.PutItemAsync(createItemRequest);
            // TODO: COME BACK TO THIS AFTER FINISHING MATCH LOGIC LIKE PLAYING A MATCH AND HAVING A DEFINITIVE WINNER

            //var problemSetAttributes = Document.FromJson(
            //        JsonSerializer.Serialize(
            //        new ProblemSetPMatchDTO($"m#{match.id}", match.user1, match.user2, match.winner, match.problemSetId, DateTime.UtcNow.ToString())).ToAttributeMap());

            return response.HttpStatusCode == System.Net.HttpStatusCode.OK;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var deleteItemRequest = new DeleteItemRequest
            {
                TableName = _databaseSettings.Value.TableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    {"pk", new AttributeValue {S = $"m#{id}"} },
                    {"sk", new AttributeValue {S = "meta"} }
                }
            };
            var response = await _dynamoDB.DeleteItemAsync(deleteItemRequest);
            return response.HttpStatusCode == System.Net.HttpStatusCode.OK;
        }

        public async Task<MatchDTO> GetAsync(string id)
        {
            var request = new GetItemRequest
            {
                TableName = _databaseSettings.Value.TableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    {"pk", new AttributeValue {S = $"m#{id}" } },
                    {"sk", new AttributeValue {S = "meta"} }
                }
            };

            var response = await _dynamoDB.GetItemAsync(request);
            if (response.Item == null || response.Item.Count == 0)
            {
                return null;
            }

            var itemAsDocument = Document.FromAttributeMap(response.Item);
            return JsonSerializer.Deserialize<MatchDTO>(itemAsDocument.ToJson());
        }

        public async Task<bool> UpdateAsync(Guid id, Match match)
        {
            match.id = id.ToString();
            var matchAsJson = JsonSerializer.Serialize(match);
            var itemAsDocument = Document.FromJson(matchAsJson);
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
