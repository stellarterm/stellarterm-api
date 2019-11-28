rm output/v1/ticker.json
source setEnvironment.sh
node localTicker.js
echo '================================================================'
echo
echo
cat output/v1/ticker.json
echo
