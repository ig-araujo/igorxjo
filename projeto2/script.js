const timeframeDefault = "1m";
const marketGrid = document.getElementById("marketGrid");

const assets = [
    { symbol: "BTCUSDT", type: "crypto", name: "Bitcoin" },
    { symbol: "ETHUSDT", type: "crypto", name: "Ethereum" },
    { symbol: "EURUSD", type: "forex", name: "Euro / Dólar" },
    { symbol: "BRL=X", type: "yahoo", name: "Dólar / Real" },
    { symbol: "PETR4.SA", type: "yahoo", name: "PETR4 – Petrobras" },
    { symbol: "^BVSP", type: "yahoo", name: "IBOVESPA" }
];

let candleData = {};

function generateDashboard() {
    marketGrid.innerHTML = "";
    assets.forEach(asset => {
        const card = document.createElement("div");
        card.classList.add("card");
        card.id = `card-${asset.symbol}`;
        card.innerHTML = `
            <h3>${asset.name}</h3>
            <p><b>${asset.symbol}</b></p>
            <p>Preço: <span id="price-${asset.symbol}">--</span></p>
            <div class="signal-summary" id="summary-${asset.symbol}">
                Carregando sinal técnico...
            </div>
            <div style="margin-top:15px;">
                <button class="btn" onclick="openChart('${asset.symbol}')">Ver gráfico</button>
                <button class="btn right" onclick="openTechModal('${asset.symbol}')">Ver análise</button>
            </div>
        `;
        marketGrid.appendChild(card);
        candleData[asset.symbol] = [];
    });
}

generateDashboard();

function openTechModal(symbol) {
    const modal = document.getElementById("modalTech");
    const techSymbol = document.getElementById("techSymbol");
    const techDetails = document.getElementById("techDetails");

    techSymbol.innerText = symbol;
    const candles = candleData[symbol];
    const signal = getTechnicalSignal(candles, timeframeDefault);
    techDetails.innerHTML = signal.full;
    modal.style.display = "block";
}

function closeTechModal() {
    document.getElementById("modalTech").style.display = "none";
}

function openChart(symbol) {
    const candles = candleData[symbol];
    openChartModal(symbol, candles);
}

function updateCard(symbol) {
    const priceEl = document.getElementById(`price-${symbol}`);
    const summaryEl = document.getElementById(`summary-${symbol}`);
    const candles = candleData[symbol];
    if (!candles || candles.length === 0) return;

    const last = candles[candles.length - 1].close;
    priceEl.innerText = last.toFixed(2);

    const signal = getTechnicalSignal(candles, timeframeDefault);
    summaryEl.innerHTML = signal.summary;
}

async function fetchYahoo(symbol) {
    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
        const response = await fetch(url);
        const json = await response.json();

        const timestamps = json.chart.result[0].timestamp;
        const o = json.chart.result[0].indicators.quote[0].open;
        const h = json.chart.result[0].indicators.quote[0].high;
        const l = json.chart.result[0].indicators.quote[0].low;
        const c = json.chart.result[0].indicators.quote[0].close;
        const v = json.chart.result[0].indicators.quote[0].volume;

        const candles = timestamps.map((t, i) => ({
            time: new Date(t * 1000),
            open: o[i],
            high: h[i],
            low: l[i],
            close: c[i],
            volume: v[i]
        }));

        candleData[symbol] = candles.slice(-60);
        updateCard(symbol);

    } catch (err) {
        console.log("Erro Yahoo:", symbol, err);
    }
}

function connectBinance(symbol) {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_1m`);
    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        const k = msg.k;

        const candle = {
            time: new Date(k.t),
            open: Number(k.o),
            high: Number(k.h),
            low: Number(k.l),
            close: Number(k.c),
            volume: Number(k.v)
        };

        if (!candleData[symbol]) candleData[symbol] = [];
        candleData[symbol].push(candle);
        candleData[symbol] = candleData[symbol].slice(-200);

        updateCard(symbol);
    };
    ws.onclose = () => setTimeout(() => connectBinance(symbol), 2000);
}

setInterval(() => {
    assets.forEach(asset => {
        if (asset.type === "yahoo" || asset.type === "forex") fetchYahoo(asset.symbol);
    });
}, 10000);

assets.filter(a => a.type === "crypto").forEach(a => connectBinance(a.symbol));
