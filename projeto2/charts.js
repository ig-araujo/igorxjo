let liveChart;

function openChartModal(symbol, candles) {
    document.getElementById("modalChart").style.display = "block";
    document.getElementById("chartTitle").innerText = symbol.toUpperCase();

    const ctx = document.getElementById("liveChart").getContext("2d");

    if (liveChart) liveChart.destroy();

    liveChart = new Chart(ctx, {
        type: "candlestick",
        data: {
            datasets: [{
                label: symbol.toUpperCase(),
                data: candles.map(c => ({
                    x: c.time,
                    o: c.open,
                    h: c.high,
                    l: c.low,
                    c: c.close
                })),
                borderColor: "#000"
            }]
        }
    });
}

function closeChartModal() {
    document.getElementById("modalChart").style.display = "none";
}
