const getClientIP = require("../utils/getClientIP");

const maximumTotalRequests = 10;
const maximumRequestsPerClient = 2;
const intervalMilliseconds = 600000;

let apiCalls = { totalRequests: 0 };

const addNewClient = (apiCalls, ip) => {
  // console.log("creating new client", ip);
  const newEntry = { date: new Date(), count: 1 };
  return { ...apiCalls, [ip]: newEntry };
};

const removeClient = (apiCalls, ip) => {
  // console.log("removing client", ip);
  let { [ip]: _, ...result } = apiCalls;
  // console.log("result.totalRequests", result.totalRequests);
  // console.log("-[ip].totalRequests", apiCalls.totalRequests);
  const newTotalRequests = adjustTotalRequestCount(
    result.totalRequests,
    -[ip].totalRequests
  );
  result.totalRequests = newTotalRequests > 0 ? newTotalRequests : 0;
  // console.log("result", result);
  return result;
};

const adjustTotalRequestCount = (totalRequests, adjustBy) => {
  // console.log("adjusting total count");
  return totalRequests + adjustBy;
};

const countClientRequests = (req, res, next) => {
  // console.log("-------------------");
  // console.log("new call against", apiCalls);
  // console.log("-------------------");

  const ip = getClientIP(req);

  // if we haven't reached capacity, check the specific client capacity
  if (apiCalls.totalRequests < maximumTotalRequests) {
    // if new client, create a new entry and allow the request
    if (!apiCalls[ip]) {
      apiCalls = addNewClient(apiCalls, ip);
      setTimeout(
        () => (apiCalls = removeClient(apiCalls, ip)),
        intervalMilliseconds
      );
      apiCalls.totalRequests = adjustTotalRequestCount(
        apiCalls.totalRequests,
        1
      );
    }
    // if client exists and is within the maximum count, increase the count and allow the request
    else if (apiCalls[ip].count < maximumRequestsPerClient) {
      apiCalls[ip].count = apiCalls[ip].count + 1;
      apiCalls.totalRequests = adjustTotalRequestCount(
        apiCalls.totalRequests,
        1
      );
    } else {
      const cooldownDate = new Date(apiCalls[ip].date);
      cooldownDate.setMilliseconds(intervalMilliseconds);

      // console.log("rejecting request");
      return res
        .status(429)
        .set({ "Retry-After": cooldownDate })
        .json({
          error: `You've exceed the permitted amount of requests per time. Please try again after ${cooldownDate}`
        });
    }
  }
  // else, block the call
  else {
    // console.log("rejecting request");
    return res.status(429).json({
      error:
        "This endpoint is experiencing a high amount of requests. Please try again later."
    });
  }

  next();
};

module.exports = countClientRequests;
