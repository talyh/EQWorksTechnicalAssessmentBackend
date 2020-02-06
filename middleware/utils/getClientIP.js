const getClientIP = req => {
  const ip = req.header("x-forwarded-for") || req.connection.remoteAddress;
  return ip;
};

module.exports = getClientIP;
