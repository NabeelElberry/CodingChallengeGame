using System.Text.Json;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.Model;
using CodingChallengeReal.Domains;
using CodingChallengeReal.Repositories.Interface;
using CodingChallengeReal.Settings;
using Microsoft.Extensions.Options;

namespace CodingChallengeReal.Repositories.Implementation
{
    public class QueueRepository: IQueueRepository
    {
        private readonly IAmazonDynamoDB _dynamoDB;
        private readonly IOptions<DatabaseSettings> _databaseSettings;

        public QueueRepository(IAmazonDynamoDB dynamoDb,
            IOptions<DatabaseSettings> databaseSettings) 
        {
            _dynamoDB = dynamoDb;
            _databaseSettings = databaseSettings;
        }

        public async Task<bool> AddAsync(QueuedUser user)
        {
            var questionAsJson = JsonSerializer.Serialize(user);
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
    }
}
