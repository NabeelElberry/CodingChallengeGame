﻿using System.Text.Json.Serialization;

namespace CodingChallengeReal.DTO
{
    public class MatchDTO
    {
        [JsonPropertyName("id")]
        public string id { get; set; }

        [JsonPropertyName("pk")]
        public string pk => $"m#{id}";

        [JsonPropertyName("sk")]
        public string sk { get; set; }

        [JsonPropertyName("user1")]
        public string user1 { get; set; }

        [JsonPropertyName("user2")]
        public string user2 { get; set; }

        [JsonPropertyName("winner")]
        public int? winner { get; set; }

        [JsonPropertyName("question_id")]
        public string question_id { get; set; }

        [JsonPropertyName("winning_soln_code")]
        public string? winning_soln_code { get; set; }
    }
}
