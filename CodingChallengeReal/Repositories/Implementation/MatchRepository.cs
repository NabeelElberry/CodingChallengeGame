﻿using System.Text.Json;
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
