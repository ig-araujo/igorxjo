function getTechnicalSignal(candles, timeframe) {
    if (candles.length < 35) return { summary: "Carregando...", full: "Coletando dados..." };

    const closes = candles.map(c => c.close);

    const ma9 = SMA(closes, 9);
    const ma21 = SMA(closes, 21);
    const rsi = RSI(closes, 14);
    const macdData = MACD(closes);
    const volumeStrength = calculateVolumePower(candles);

    let status = "";
    let force = 50;

    if (ma9 > ma21 && macdData.histogram > 0) {
        status = "Tendência de ALTA";
        force = 60 + Math.min(40, Math.abs(macdData.histogram * 50));
    } else {
        status = "Tendência de BAIXA";
        force = 60 + Math.min(40, Math.abs(macdData.histogram * 50));
    }

    const timeframeMinutes = Number(timeframe.replace("m", ""));
    const validity = timeframeMinutes * 2;

    const summary = `
        <b>${status}</b><br>
        Força: <b>${force.toFixed(0)}%</b><br>
        RSI: <b>${rsi.toFixed(1)}</b><br>
        Volume: <b>${volumeStrength}%</b><br>
        Validade: <b>~${validity} min</b>
    `;

    const full = `
        <b>Status Técnico:</b> ${status}<br><br>

        <b>Força do Movimento:</b> ${force.toFixed(0)}%<br>
        (Baseado no MACD + MA9/MA21)<br><br>

        <b>RSI:</b> ${rsi.toFixed(1)}<br>
        ${rsi > 70 ? "(Sobrecomprado)" : rsi < 30 ? "(Sobrevendido)" : "(Neutro)"}<br><br>

        <b>MACD:</b><br>
        Linha MACD: ${macdData.macd.toFixed(4)}<br>
        Linha Sinal: ${macdData.signal.toFixed(4)}<br>
        Histograma: ${macdData.histogram.toFixed(4)}<br><br>

        <b>Volume:</b> ${volumeStrength}% acima da média<br><br>

        <b>Timeframe utilizado:</b> ${timeframe}<br>
        <b>Validade estimada do sinal:</b> ~${validity} minutos<br>
    `;

    return { summary, full };
}

/************ INDICADORES ************/
function SMA(values, period) {
    if (values.length < period) return 0;
    const subset = values.slice(values.length - period);
    return subset.reduce((a,b)=>a+b)/period;
}

function RSI(values, period=14) {
    let gains = 0, losses = 0;
    for (let i = values.length - period; i < values.length - 1; i++) {
        const diff = values[i + 1] - values[i];
        if (diff > 0) gains += diff;
        else losses -= diff;
    }
    const RS = gains / (losses || 1);
    return 100 - (100 / (1 + RS));
}

function MACD(values, short=12, long=26, signal=9) {
    function EMA(vals, p) {
        const k = 2/(p+1);
        let ema = vals[0];
        for (let i=1;i<vals.length;i++) ema = vals[i]*k + ema*(1-k);
        return ema;
    }

    const macd = EMA(values, short) - EMA(values, long);
    const signalLine = EMA(values, signal);
    return { macd, signal: signalLine, histogram: macd - signalLine };
}

function calculateVolumePower(candles) {
    const volumes = candles.map(c => c.volume || 1);
    const avg = volumes.slice(-20).reduce((a,b)=>a+b)/20;
    const last = volumes[volumes.length - 1];
    return Math.round(((last - avg) / avg) * 100);
}
