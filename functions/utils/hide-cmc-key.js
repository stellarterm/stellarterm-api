const CMC_REG = /(?<="X-CMC_PRO_API_KEY":\s*")[^"]+(?=")/g;

module.exports = function(string) {
   return string .replace(CMC_REG, 'XXX-XXX-XXX');
};
