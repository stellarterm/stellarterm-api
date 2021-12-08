const { HORIZON_SERVER, ANCHORS_SERVER } = require('./horizon-server.constant');
const StellarSdk = require('stellar-sdk');
const directory = require('stellarterm-directory');

const Server = new StellarSdk.Server(HORIZON_SERVER, {
    appName: process.env.APP_NAME,
});

const XLM_CMC_ID = 512;

const NATIVE = StellarSdk.Asset.native();
const PERIOD_24H = 86400 * 1000;
const RESOLUTION_15_MINUTES = 900 * 1000;
const RESOLUTION_MINUTE = 60 * 1000;

function generate() {
    directory.reset();
    const end = Date.now();
    const start = end - PERIOD_24H;
    return directory.initializeIssuerOrgs(ANCHORS_SERVER)
        .then(() => {
            const requests = Object.values(directory.assets).map((asset) => {
                const isCounterAsset = asset.code === 'BTC' || asset.is_counter_selling;
                const base = !isCounterAsset ? new StellarSdk.Asset(asset.code, asset.issuer) : NATIVE;
                const counter = isCounterAsset ? new StellarSdk.Asset(asset.code, asset.issuer) : NATIVE;
                const ORDERBOOK = Server.orderbook(base, counter).call();
                const TRADES_24h = Server.tradeAggregation(base, counter, start, end + RESOLUTION_15_MINUTES, RESOLUTION_15_MINUTES, 0)
                    .limit(100).order('desc').call();
                const LAST_TRADE = Server.tradeAggregation(base, counter, start, end + RESOLUTION_MINUTE, RESOLUTION_MINUTE, 0)
                    .limit(1).order('desc').call();
                return Promise.allSettled([ORDERBOOK, TRADES_24h, LAST_TRADE])
                    .then(([orderbook, trades, lastTrade]) => [
                        orderbook.status === 'fulfilled' ? orderbook.value : null,
                        trades.status === 'fulfilled' ? trades.value : null,
                        lastTrade.status === 'fulfilled' ? lastTrade.value : null,
                        asset
                    ]);
            });
            return Promise.all(requests);
        })
        .then((responses) => {
            const summary = {};
            const assets = {};
            const ticker = {};
            responses.forEach(([orderbook, trades, lastTrade, asset]) => {
                const isCounterAsset = asset.code === 'BTC' || asset.is_counter_selling;
                const highest_bid = orderbook && orderbook.bids.length ? parseFloat(orderbook.bids[0].price) : null;
                const lowest_ask = orderbook && orderbook.asks.length ? parseFloat(orderbook.asks[0].price) : null;
                const last_price = highest_bid && lowest_ask ? (highest_bid + lowest_ask) / 2 : null;
                const [base_volume, quote_volume, highest_price_24h, lowest_price_24h] = trades && trades.records.reduce(
                    ([base, quote, high24, low24], {base_volume, counter_volume, high, low}) => [
                        base + Number(base_volume),
                        quote + Number(counter_volume),
                        high24 === null ? Number(high) : Math.max(Number(high), high24),
                        low24 === null ? Number(low) : Math.min(Number(low), low24)
                    ],
                    [0, 0, null, null]
                ) || [0, 0, null, null];

                const startPrice = trades && trades.records.length ? parseFloat(trades.records[trades.records.length - 1].open) : null;
                const finishPrice = lastTrade && lastTrade.records.length ? parseFloat(lastTrade.records[0].close) : null;
                const price_change_percent_24h = startPrice !== null && finishPrice !== null ? ((finishPrice / startPrice) - 1) : 0;

                const trading_pairs = isCounterAsset ? `${NATIVE.code}_${asset.code}` : `${asset.code}_${NATIVE.code}`;
                const alreadyExists = summary[trading_pairs];
                if (alreadyExists &&
                    ((isCounterAsset && alreadyExists.base_volume > base_volume) ||
                        (!isCounterAsset && alreadyExists.quote_volume > quote_volume))) {
                    return;
                }

                summary[trading_pairs] = {
                    last_price, highest_bid, lowest_ask, base_volume, quote_volume,
                    highest_price_24h, lowest_price_24h, price_change_percent_24h, trading_pairs,
                    base_currency: asset.code,
                    quote_currency: NATIVE.code
                };
                assets[trading_pairs] = {
                    name: asset.code,
                    can_withdraw: true,
                    can_deposit: true,
                    maker_fee: 0,
                    taker_fee: 0
                };
                if (asset.coinmarketcap_id) {
                    assets[trading_pairs].unified_cryptoasset_id = asset.coinmarketcap_id;
                }
                ticker[trading_pairs] = {
                    isFrozen: 0,
                    last_price, base_volume, quote_volume
                };
                if (isCounterAsset) {
                    ticker[trading_pairs].base_id = XLM_CMC_ID;
                } else {
                    ticker[trading_pairs].quote_id = XLM_CMC_ID;
                }
                if (isCounterAsset && asset.coinmarketcap_id) {
                    ticker[trading_pairs].quote_id = asset.coinmarketcap_id;
                } else if (asset.coinmarketcap_id) {
                    ticker[trading_pairs].base_id = asset.coinmarketcap_id;
                }
            });

            return {
                'cmc/v1/summary.json': JSON.stringify(Object.values(summary)),
                'cmc/v1/assets.json': JSON.stringify(assets),
                'cmc/v1/ticker.json': JSON.stringify(ticker)
            };
        });
}

module.exports = { generate };
