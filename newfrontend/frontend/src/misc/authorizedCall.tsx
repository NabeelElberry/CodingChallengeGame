import axios from "axios";
import { useAuth } from "../store/AuthCtx";

const authorizedCall = async (
  authCtx: any,
  requestType: "GET" | "POST",
  endpoint: string,
  bodyOrParams?: "B" | "P",
  dataToSend?: any
) => {
  let response;

  const token = await authCtx.user?.getIdToken();

  try {
    // for GET requests just put undefined for last two parameters if don't need them
    if (requestType == "GET") {
      response = await axios.get(`${authCtx.API_URL}/${endpoint}`, {
        params: dataToSend,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(
        `In authorized call GET, URL: ${authCtx.API_URL}/${endpoint}`
      );
    } else {
      if (bodyOrParams == "B") {
        console.log(
          `In authorized call POST, URL: ${authCtx.API_URL}/${endpoint}`
        );
        response = response = await axios.post(
          `${authCtx.API_URL}/${endpoint}`,
          dataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        console.log(
          `In authorized call POST, URL: ${authCtx.API_URL}/${endpoint}`
        );
        response = await axios.post(`${authCtx.API_URL}/${endpoint}`, null, {
          params: dataToSend,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    }
  } catch {
    throw new Error("Error in URL");
  }
  return response;
};

export default authorizedCall;
