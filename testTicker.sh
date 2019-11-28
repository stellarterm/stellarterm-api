rm output/v1/ticker.json
source setStagingEnvironment.sh
node localTicker.js
echo '================================================================'
echo
echo
cat output/v1/ticker.json
echo
