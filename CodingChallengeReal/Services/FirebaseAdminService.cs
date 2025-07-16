
using Google.Apis.Auth.OAuth2;
using Newtonsoft.Json;
using System.Net.Http.Headers;
namespace CodingChallengeReal.Services
{
using FirebaseAdmin;
using FirebaseAdmin.Auth;
using Google.Apis.Auth.OAuth2;

public class FirebaseAdminService
{
    public FirebaseAdminService()
    {
        if (FirebaseApp.DefaultInstance == null)
        {
            FirebaseApp.Create(new AppOptions
            {
                Credential = GoogleCredential.FromFile("firebase-admin.json")
            });
        }
    }

    public async Task SetCustomUserClaimsAsync(string uid, object claims)
    {
        var claimsDict = JsonConvert.DeserializeObject<Dictionary<string, object>>(
            JsonConvert.SerializeObject(claims)
        );

        await FirebaseAuth.DefaultInstance.SetCustomUserClaimsAsync(uid, claimsDict);
    }
}

}