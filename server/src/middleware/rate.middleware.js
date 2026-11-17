module.exports = function rateLimit(max = 30, keyFor = (req) => req.ip) {
  const entries = new Map();
  return (req, res, next) => {
    const now = Date.now(),
      key = keyFor(req);
    if (entries.size > 10000)
      for (const [address, entry] of entries)
        if (entry.reset <= now) entries.delete(address);
    const entry = entries.get(key);
    if (!entry || entry.reset <= now) {
      entries.set(key, { count: 1, reset: now + 15 * 60 * 1000 });
      return next();
    }
    if (++entry.count > max)
      return res.status(429).json({
        message: "Too many attempts. Please try again in 15 minutes.",
      });
    next();
  };
};
