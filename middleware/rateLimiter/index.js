const getClientIP = require("../utils/getClientIP");

const maximumNumberOfRequests = 1;
const intervalMilliseconds = 1000;

let apiCalls = {};

const addNewClient = (apiCalls, ip) => {
  const newEntry = { date: new Date(), count: 1 };
  return { ...apiCalls, [ip]: newEntry };
};

const removeClient = (apiCalls, ip) => {
  let { [ip]: _, ...result } = apiCalls;
  return result;
};

const countClientRequests = (req, res, next) => {
  const ip = getClientIP(req);

  // if new client, create a new entry and allow the request
  if (!apiCalls[ip]) {
    apiCalls = addNewClient(apiCalls, ip);
    setTimeout(
      () => (apiCalls = removeClient(apiCalls, ip)),
      intervalMilliseconds
    );
  }
  // if client exists and is within the maximum count, increase the count and allow the request
  else if (apiCalls[ip].count < maximumNumberOfRequests) {
    apiCalls[ip].count = apiCalls[ip].count + 1;
  }
  // else, block the call
  else {
    return res.status(429).json({
      error: "Too many requests at once"
    });
  }

  next();
};

module.exports = countClientRequests;
