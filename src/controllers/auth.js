const authService = require("../services/auth");
const login = async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json(result);
};
module.exports = {
  login,
};