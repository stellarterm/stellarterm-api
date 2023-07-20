const CMC_REG = /(?<="X-CMC_PRO_API_KEY":\s*")[^"]+(?=")/gi;
const X_APP_REG = /(?<="X-App-Name":\s*")[^"]+(?=")/gi;
const USER_AGENT_REG = /(?<="User-Agent":\s*")[^"]+(?=")/gi;

module.exports = function(string) {
   return string
       .replace(CMC_REG, 'XXX-XXX-XXX')
       .replace(X_APP_REG, 'XXX-XXX-XXX')
       .replace(USER_AGENT_REG, 'XXX-XXX-XXX');
};
