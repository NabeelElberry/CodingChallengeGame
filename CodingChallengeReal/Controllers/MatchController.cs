using System.Diagnostics;
using System.Text.Json;
using AutoMapper;
using CodingChallengeReal.Domains;
using CodingChallengeReal.DTO;
using CodingChallengeReal.Misc;
using CodingChallengeReal.Repositories.Implementation;
using CodingChallengeReal.Repositories.Interface;
using CodingChallengeReal.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;
using static System.Net.WebRequestMethods;

namespace CodingChallengeReal.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class MatchController : Controller
    {
        private readonly IMatchService _matchService;
        private readonly IHubContext<MatchHub> _matchHub;
        private readonly EnqueueService _enqueueService;
        private readonly IMatchRepository _matchRepository;
        private readonly IQuestionRepository _questionRepository;
        private readonly IMapper _mapper;
        private readonly String Judge0URL = "http://107.23.165.87:2358";
        private String pythonBoilerplate = "";



        public MatchController(IMatchRepository matchRepository, IMapper mapper, IQuestionRepository questionRepository, EnqueueService enqueueService, IHubContext<MatchHub> matchHub, IMatchService matchService)
        {
            _matchService = matchService;
            _matchHub = matchHub;
            _enqueueService = enqueueService;
            _matchRepository = matchRepository;
            _questionRepository = questionRepository;
            _mapper = mapper;
        }


        [HttpPost]
        public async Task<IActionResult> AddMatchAsync(AddMatchDTO addMatchRequest)
        {
            var match = await _matchService.AddMatchAsync(addMatchRequest);

            return Ok(match);
        }


        [HttpGet]
        public async Task<IActionResult> GetMatchAsync(String id)
        {
            var matchDTO = await _matchRepository.GetAsync(id);
            return Ok(matchDTO);
        }


        [HttpDelete]
        public async Task<IActionResult> DeleteMatchAsync(Guid id)
        {
            var deletedUserBool = await _matchRepository.DeleteAsync(id);

            return Ok(deletedUserBool);
        }


        [HttpPut]
        public async Task<IActionResult> UpdateMatchAsync(Guid id, AddMatchDTO addMatchDTO)
        {
            MatchDTO match = await _matchRepository.GetAsync(id.ToString());

            if (match == null)
            {
                return Ok(false);
            }
            match.user1 = addMatchDTO.user1;
            match.user2 = addMatchDTO.user2;
            match.winner = addMatchDTO.winner;
            match.question_id = addMatchDTO.question_id;
            match.winning_soln_code = addMatchDTO.winning_soln_code;
            var updatedUser = await _matchRepository.UpdateAsync(id, _mapper.Map<Match>(match));

            return Ok(updatedUser);
        }

        [HttpPost]
        [Route("/queueUsers")]
        public async Task<IActionResult> QueueUsersTogetherAsync(string userId, int mmr)
        {
            int searchRadius = 0;
            (int, int) min_max = _enqueueService.EnqueuePlayer(userId, mmr); // enqueue the player into redis database
            var min = min_max.Item1;
            var max = min_max.Item2;
            var original = $"elo_queue_{min}_{max}";
            // find user in specific elo bracket, if none found expand out after 10 seconds
            MatchResultDTO? result = null;

            // does 10 different brackets
            for (int r = 0; r < 10; r++)
            {
                // go through all the brackets up to searchRadius, guaranteed to be at least 1
                for (int i = 0; i < r; i++)
                {

                    var offset = searchRadius * 100;

                    var lowerBucket = original;
                    var upperBucket = $"elo_queue_{min + (offset)}_{max + (offset)}";
                    if (min != 0)
                    {
                        lowerBucket = $"elo_queue_{min - (offset)}_{max - (offset)}";
                    }

                    Console.WriteLine("Searching original...");
                    result = await _enqueueService.AttemptMatchPlayer(min, max, userId); // search original bracket


                    if (lowerBucket != original && result == null) // actually search the lower bucket if different than original bracket, and match not found
                    {
                        result = await _enqueueService.AttemptMatchPlayer(min - offset, max - offset, userId);

                        Console.WriteLine($"Searching lower bucket {min - offset} {max - offset}");
                    }
                    if (result == null) // search upper bracket if nothing was found in lower
                    {
                        result = await _enqueueService.AttemptMatchPlayer(min + offset, max + offset, userId);
                        Console.WriteLine($"Searching upper bucket {min + offset} {max + offset}");
                    }

                    if (result != null) // match was found, stop queueing
                    {
                        if (result?.Opponent != null && result.IsInitiator) // only one match will be made depending on who the "initiator" was.
                        {
                            AddMatchDTO matchDto = new AddMatchDTO(userId, result.Opponent, null, null, null);
                            var match = await _matchService.AddMatchAsync(matchDto); // makes a match in DB

                            await _matchHub.Clients.User(userId).SendAsync("MatchFound", match.id);
                            await _matchHub.Clients.User(result.Opponent.Value).SendAsync("MatchFound", match.id);
                            Console.WriteLine($"userId: {userId}, OPPONENT VAL: {result.Opponent.Value}, OPPONENT: {result.Opponent}");

                            return Ok(matchDto);
                        }
                        else
                        {
                            return Ok(true);
                        }

                    }
                    Console.WriteLine($"Found match in search radius {searchRadius}: {result != null}");
                }
                searchRadius += 1;
            }


            return Ok(null);

        }
        [HttpGet("debug-claims")]
        public IActionResult DebugClaims()
        {
            foreach (var claim in User.Claims)
            {
                Console.WriteLine($"{claim.Type}: {claim.Value}");
            }

            return Ok("Check console output.");
        }

        [HttpPost("judge")]
        public async Task<IActionResult> JudgeAnswer(JudgeQuestionDTO judgeQuestionDTO)
        {
            String endpoint = $"{Judge0URL}/submissions/?base64_encoded=false&wait=true";

            QuestionDTO question = await _questionRepository.GetAsync(judgeQuestionDTO.QuestionId);
            String fullCode;
            Console.WriteLine($"{judgeQuestionDTO.LanguageId} {judgeQuestionDTO.UserCode} {judgeQuestionDTO.QuestionId}");
            // python case
            if (judgeQuestionDTO.LanguageId == 71)
            {
                fullCode = BuildFullPythonCode(question.MethodName, judgeQuestionDTO.UserCode, question.SampleTestCases, question.HiddenTestCases, question.CompareFunc["python"]);
                Console.WriteLine($"fullCode:\n{fullCode}");
            }
            else if (judgeQuestionDTO.LanguageId == 62) // java
            {
                fullCode = BuildFullJavaCode(question.MethodName, judgeQuestionDTO.UserCode, question.SampleTestCases, question.HiddenTestCases, question.CompareFunc["java"]);
                Console.WriteLine($"fullCode:\n{fullCode}");
            }
            else // CPP
            {
                fullCode = BuildFullCPPCode(question.MethodName, judgeQuestionDTO.UserCode, question.SampleTestCases, question.HiddenTestCases, question.CompareFunc["cpp"]);
                Console.WriteLine($"fullCode:\n{fullCode}");
            }

            var payload =
            new
            {
                source_code = fullCode,
                language_id = judgeQuestionDTO.LanguageId,
                stdin = "",
                expected_output = ""
            };

            Console.WriteLine("Payload: " + JsonSerializer.Serialize(payload));
            var client = new HttpClient();
            var content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
            var judge0Response = await client.PostAsync(endpoint, content);

            var judge0Json = await judge0Response.Content.ReadAsStringAsync();
            return Content(judge0Json, "application/json");
        }


        /* The structure here is 
         * class Solution:
         *     def methodName: 
         *          {userCode}
         *     assert statements
         */
        private static string BuildFullPythonCode(string methodName, string userCode, List<TestCaseDTO> sampleTestCases, List<TestCaseDTO> hiddenTestCases, string compareFunc)
        {
            string typingImports = "from typing import List, Dict, Tuple, Set, Optional, Any, Union\n";
            string fullCode = typingImports + userCode.Trim();

            IEnumerable<string> FormatTestBlock(List<TestCaseDTO> testCases) => testCases.Select(tc =>
                    $"result = Solution().{methodName}({tc.Input})\nexpected = {JsonSerializer.Serialize(tc.Output)}\nassert {compareFunc}\nprint('Input:', {tc.Input})\nprint('Result:', result)\nprint('Expected:', expected)\nprint('Expected type: ', type(expected))\nprint('result type: ', type(result))\nprint('sorted result', sorted(result))\nprint('sorted eval expected: ', sorted(eval(expected)))\nprint('type sorted result', type(sorted(result)))\nprint('type sorted eval expected: ', type(sorted(eval(expected))))\n");

            fullCode += "\n\n" + string.Join("\n\n", FormatTestBlock(sampleTestCases));
            fullCode += "\n\n" + string.Join("\n\n", FormatTestBlock(hiddenTestCases));
            fullCode += "print(\"ALL TESTS PASSED\")";

            return fullCode;
        }

        private static string BuildFullCPPCode(string methodName, string userCode, List<TestCaseDTO> sampleTestCases, List<TestCaseDTO> hiddenTestCases, string compareFunc)
        {
            IEnumerable<string> FormatTestBlock(List<TestCaseDTO> testCases) => testCases.Select(tc =>
        $@"    {{
        auto result = sol.{methodName}({tc.Input});
        auto expected = {tc.Output};
        bool passed = [&]() {{
{WrapCompareFunc(compareFunc, "cpp", "            ")}
            return passed;
        }}();

        if (!passed) {{
            cout << ""FAILED TEST"" << endl;
            cout << ""Input: {tc.Input}"" << endl;
            cout << ""(Add more detailed result/expected prints in compare_func if needed)"" << endl;
            exit(1);
        }}
    }}");

            string mainBlock = $@"
int main() {{
    Solution sol;
{string.Join("\n", FormatTestBlock(sampleTestCases))}
{string.Join("\n", FormatTestBlock(hiddenTestCases))}
    cout << ""All tests passed"" << endl;
}}";

            return $@"#include <cassert>
#include <string>
#include <vector>
#include <iostream>
#include <algorithm>
using namespace std;

{userCode.Trim()}

{mainBlock}";
        }


        private static string BuildFullJavaCode(string methodName, string userCode, List<TestCaseDTO> sampleTestCases, List<TestCaseDTO> hiddenTestCases, string compareFunc)
        {
            IEnumerable<string> FormatTestBlock(List<TestCaseDTO> testCases) => testCases.Select(tc =>
        $@"        {{
            var result = sol.{methodName}({tc.Input});
            var expected = {tc.Output};
            boolean passed = false;
            try {{
{WrapCompareFunc(compareFunc, "java", "                ")}
            }} catch (Exception e) {{
                System.out.println(""Exception during comparison: "" + e);
            }}

            if (!passed) {{
                System.out.println(""FAILED TEST"");
                System.out.println(""Input: {tc.Input}"");
                System.out.println(""Expected: "" + Arrays.toString(expected));
                System.out.println(""Got: "" + Arrays.toString(result));
                System.exit(1);
            }}
        }}");

            var mainBlock = $@"
public class Main {{
    public static void main(String[] args) {{
        Solution sol = new Solution();
{string.Join("\n", FormatTestBlock(sampleTestCases))}
{string.Join("\n", FormatTestBlock(hiddenTestCases))}
        System.out.println(""All tests passed"");
    }}
}}";

            return @"import java.util.*;
import java.util.Arrays;

" + userCode.Trim() + "\n\n" + mainBlock;
        }


        private static string WrapCompareFunc(string compareFunc, string language, string indent = "    ")
        {
            var lines = compareFunc.Trim().Split('\n').Select(l => l.Trim()).ToList();

            if (lines.Count == 1 && lines[0].StartsWith("return "))
            {
                string expr = lines[0].Substring("return ".Length).TrimEnd(';');
                return $"{indent}passed = {expr};";
            }

            // Multi-line case — replace first return line
            for (int i = 0; i < lines.Count; i++)
            {
                if (lines[i].StartsWith("return "))
                {
                    string expr = lines[i].Substring("return ".Length).TrimEnd(';');
                    lines[i] = $"passed = {expr};";
                    break;
                }
            }

            return string.Join("\n", lines.Select(line => indent + line));
        }
    }
    }



