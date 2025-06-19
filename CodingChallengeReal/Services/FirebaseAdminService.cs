
using Google.Apis.Auth.OAuth2;
using Newtonsoft.Json;
using System.Net.Http.Headers;
namespace CodingChallengeReal.Services
{
    public class FirebaseAdminService
    {
        private readonly HttpClient _httpClient = new();

        public async Task SetCustomUserClaimsAsync(string uid, object claims)
        {
            // Load service account
            GoogleCredential credential;
            using (var stream = new FileStream("firebase-admin.json", FileMode.Open, FileAccess.Read))
            {
                credential = GoogleCredential.FromStream(stream)
                    .CreateScoped("https://www.googleapis.com/auth/identitytoolkit");
            }

            var token = await credential.UnderlyingCredential.GetAccessTokenForRequestAsync();

            var requestUrl = $"https://identitytoolkit.googleapis.com/v1/projects/code1v1authentication/accounts:update";

            var body = new
            {
                localId = uid,
                customAttributes = JsonConvert.SerializeObject(claims)
            };

            var jsonBody = JsonConvert.SerializeObject(body);
            var request = new HttpRequestMessage(HttpMethod.Post, requestUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Content = new StringContent(jsonBody, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Failed to set claims: {error}");
            }
        }
    }
}