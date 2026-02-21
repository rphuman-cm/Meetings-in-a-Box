const METRIC_FIELDS = [
  { key: "adjT", label: "Tempo (AdjT)", valueA: 69.8, valueB: 66.1, mean: 67.5, std: 2.5 },
  { key: "tor", label: "TOR", valueA: 15.8, valueB: 18.4, mean: 17.0, std: 2.0 },
  { key: "tord", label: "TORD", valueA: 20.5, valueB: 17.2, mean: 18.0, std: 2.0 },
  { key: "orr", label: "ORR", valueA: 32.3, valueB: 29.1, mean: 30.0, std: 3.0 },
  { key: "drr", label: "DRR", valueA: 73.4, valueB: 70.2, mean: 71.5, std: 3.0 },
  { key: "threePAr", label: "3PAr", valueA: 41.2, valueB: 36.4, mean: 38.0, std: 4.0 },
  { key: "threePArAllowed", label: "3PAr Allowed", valueA: 34.1, valueB: 39.8, mean: 37.0, std: 4.0 },
  { key: "threeP", label: "3P%", valueA: 36.8, valueB: 34.9, mean: 34.5, std: 2.5 },
  { key: "threePAllowed", label: "3P% Allowed", valueA: 31.9, valueB: 35.2, mean: 34.5, std: 2.5 },
  { key: "twoP", label: "2P%", valueA: 53.1, valueB: 50.9, mean: 51.5, std: 2.5 },
  { key: "twoPAllowed", label: "2P% Allowed", valueA: 47.5, valueB: 51.2, mean: 50.0, std: 2.5 },
  { key: "ftr", label: "FTR", valueA: 33.6, valueB: 30.1, mean: 31.5, std: 4.0 },
  { key: "ftrd", label: "FTRD", valueA: 28.8, valueB: 34.7, mean: 31.5, std: 4.0 }
];

const CONSTANT_FIELDS = [
  { key: "kTO", label: "k_to", value: 1.5 },
  { key: "kOR", label: "k_or", value: 1.3 },
  { key: "k3V", label: "k_3v", value: 0.8 },
  { key: "k3Q", label: "k_3q", value: 1.1 },
  { key: "k2Q", label: "k_2q", value: 1.0 },
  { key: "kFT", label: "k_ft", value: 0.9 },
  { key: "wP", label: "w_p", value: 0.9 },
  { key: "wE", label: "w_e", value: 1.0 },
  { key: "wV", label: "w_v", value: 0.5 },
  { key: "volA", label: "Volatility a", value: 0.35 },
  { key: "volB", label: "Volatility b", value: 0.35 },
  { key: "volC", label: "Volatility c", value: 0.3 }
];

const form = document.querySelector("#engineForm");
const teamAFields = document.querySelector("#teamAFields");
const teamBFields = document.querySelector("#teamBFields");
const constantFields = document.querySelector("#constantFields");

function buildFields() {
  METRIC_FIELDS.forEach((field) => {
    teamAFields.append(metricInput(field, "A", field.valueA));
    teamBFields.append(metricInput(field, "B", field.valueB));

    teamAFields.append(metricInput({ key: `${field.key}Mean`, label: `${field.label} mean` }, "A", field.mean));
    teamAFields.append(metricInput({ key: `${field.key}Std`, label: `${field.label} std` }, "A", field.std));
  });

  CONSTANT_FIELDS.forEach((field) => {
    const label = document.createElement("label");
    label.textContent = field.label;
    const input = document.createElement("input");
    input.type = "number";
    input.step = "0.01";
    input.name = field.key;
    input.value = field.value;
    label.append(input);
    constantFields.append(label);
  });
}

function metricInput(field, suffix, value) {
  const label = document.createElement("label");
  label.textContent = field.label;
  const input = document.createElement("input");
  input.type = "number";
  input.step = "0.01";
  input.name = `${field.key}${suffix}`;
  input.value = value;
  label.append(input);
  return label;
}

function zScore(value, mean, std) {
  return std === 0 ? 0 : (value - mean) / std;
}

function logistic(x) {
  return 1 / (1 + Math.exp(-x));
}

function num(fd, key) {
  return Number(fd.get(key) || 0);
}

function calculateEngine(fd) {
  const readMetric = (key) => ({
    a: num(fd, `${key}A`),
    b: num(fd, `${key}B`),
    mean: num(fd, `${key}MeanA`),
    std: Math.max(num(fd, `${key}StdA`), 0.0001)
  });

  const metric = {};
  METRIC_FIELDS.forEach((field) => {
    metric[field.key] = readMetric(field.key);
  });

  const z = (key, side) => zScore(metric[key][side], metric[key].mean, metric[key].std);

  const toPressureA = z("tor", "a") + z("tord", "b");
  const toPressureB = z("tor", "b") + z("tord", "a");
  const deltaTO = num(fd, "kTO") * (toPressureB - toPressureA);

  const orEdgeA = z("orr", "a") - z("drr", "b");
  const orEdgeB = z("orr", "b") - z("drr", "a");
  const deltaOR = num(fd, "kOR") * (orEdgeA - orEdgeB);

  const threePVolA = z("threePAr", "a") + z("threePArAllowed", "b");
  const threePVolB = z("threePAr", "b") + z("threePArAllowed", "a");
  const delta3PVol = num(fd, "k3V") * (threePVolA - threePVolB);

  const threePQualA = z("threeP", "a") - z("threePAllowed", "b");
  const threePQualB = z("threeP", "b") - z("threePAllowed", "a");
  const delta3PQual = num(fd, "k3Q") * (threePQualA - threePQualB);

  const twoPQualA = z("twoP", "a") - z("twoPAllowed", "b");
  const twoPQualB = z("twoP", "b") - z("twoPAllowed", "a");
  const delta2PQual = num(fd, "k2Q") * (twoPQualA - twoPQualB);

  const ftEdgeA = z("ftr", "a") - z("ftrd", "b");
  const ftEdgeB = z("ftr", "b") - z("ftrd", "a");
  const deltaFT = num(fd, "kFT") * (ftEdgeA - ftEdgeB);

  const matchupDelta100 = deltaTO + deltaOR + delta3PVol + delta3PQual + delta2PQual + deltaFT;
  const poss = (metric.adjT.a + metric.adjT.b) / 2;

  const deltaMargin = matchupDelta100 * (poss / 100);
  const deltaTotal =
    (num(fd, "wP") * (deltaTO + deltaOR) +
      num(fd, "wE") * (delta3PQual + delta2PQual + deltaFT) +
      num(fd, "wV") * delta3PVol) *
    (poss / 100);

  const baseMargin = (num(fd, "adjEMA") - num(fd, "adjEMB")) * (poss / 100) + num(fd, "hca");
  const finalMargin = baseMargin + deltaMargin;
  const finalTotal = num(fd, "baseTotal") + deltaTotal;

  const possZ = zScore(poss, metric.adjT.mean, metric.adjT.std);
  const volatility =
    100 *
    logistic(
      num(fd, "volA") * Math.abs(threePVolA - threePVolB) +
        num(fd, "volB") * Math.abs(toPressureA - toPressureB) +
        num(fd, "volC") * possZ
    );

  const confidence = Math.max(5, Math.min(95, 75 + Math.abs(finalMargin) * 2 - volatility * 0.35));

  return {
    deltas: { deltaTO, deltaOR, delta3PVol, delta3PQual, delta2PQual, deltaFT, matchupDelta100 },
    baseMargin,
    finalMargin,
    finalTotal,
    deltaMargin,
    deltaTotal,
    volatility,
    confidence,
    poss,
    drivers: { threePVolA, threePVolB, toPressureA, toPressureB }
  };
}

function mismatchFlags(d) {
  const flags = [];
  if (d.deltaTO > 2) flags.push("Turnover mismatch: nasty edge for Team A.");
  else if (d.deltaTO > 1.2) flags.push("Turnover mismatch: strong edge for Team A.");
  if (d.delta3PQual + d.delta3PVol > 1.8) flags.push("3PT edge flag: volume + quality edge is significant.");
  if (d.deltaFT > 1) flags.push("FT edge flag: late-game whistle protector.");
  if (d.deltaOR > 1.2) flags.push("Rebounding edge flag: extra-possession advantage.");
  if (!flags.length) flags.push("No extreme mismatch flags triggered.");
  return flags;
}

function recommendations(engine) {
  const recs = [];
  if (engine.volatility > 67) {
    recs.push("High chaos spot: prefer smaller stakes, live betting, and derivative props over heavy pregame sides.");
  } else if (Math.abs(engine.deltaMargin) > Math.abs(engine.deltaTotal)) {
    recs.push("Spread/ML profile is stronger than total profile.");
  } else {
    recs.push("Total profile is stronger than side profile.");
  }

  if (engine.volatility >= 34 && engine.volatility <= 66) {
    recs.push("Medium volatility: totals and derivatives are reasonable.");
  }

  if (engine.volatility < 34) {
    recs.push("Low volatility: spread and ML are comparatively reliable.");
  }

  if (Math.abs(engine.deltas.delta3PVol) > 1.2) {
    recs.push("3PT volume variance is elevated: consider alt lines and wide-outcome props.");
  }

  return recs;
}

function correlationTag(engine) {
  const favorite = engine.finalMargin >= 0 ? "A" : "B";
  const fast = engine.poss >= 69;
  const lowVol = engine.volatility < 34;

  if (favorite === "A" && fast && engine.deltas.deltaOR > 0.5 && engine.deltaTotal > 0.5) return "Fav+Over";
  if (favorite === "A" && !fast && engine.deltas.deltaTO > 0.6 && lowVol) return "Fav+Under";
  if (favorite === "B" && fast && engine.deltas.deltaOR < -0.5 && engine.deltaTotal > 0.5) return "Fav+Over";
  if (favorite === "B" && !fast && engine.deltas.deltaTO < -0.6 && lowVol) return "Fav+Under";
  return "Avoid correlation assumptions";
}

function render(engine, names) {
  const summaryCards = document.querySelector("#summaryCards");
  summaryCards.innerHTML = "";

  const cards = [
    ["Projected Margin", `${names.a} ${engine.finalMargin >= 0 ? "+" : ""}${engine.finalMargin.toFixed(2)}`],
    ["Projected Total", engine.finalTotal.toFixed(2)],
    ["Matchup Margin Adj", `${engine.deltaMargin >= 0 ? "+" : ""}${engine.deltaMargin.toFixed(2)}`],
    ["Matchup Total Adj", `${engine.deltaTotal >= 0 ? "+" : ""}${engine.deltaTotal.toFixed(2)}`],
    ["Win Confidence", `${engine.confidence.toFixed(1)}%`],
    ["Chaos Rating", `${engine.volatility.toFixed(1)} / 100`]
  ];

  cards.forEach(([label, value]) => {
    const article = document.createElement("article");
    article.className = "card stat";
    article.innerHTML = `<p>${label}</p><strong>${value}</strong>`;
    summaryCards.append(article);
  });

  const deltaList = document.querySelector("#deltaList");
  deltaList.innerHTML = "";
  Object.entries(engine.deltas).forEach(([key, val]) => {
    const li = document.createElement("li");
    li.textContent = `${key}: ${val.toFixed(3)}`;
    deltaList.append(li);
  });

  const flagList = document.querySelector("#flagList");
  flagList.innerHTML = "";
  mismatchFlags(engine.deltas).forEach((flag) => {
    const li = document.createElement("li");
    li.textContent = flag;
    flagList.append(li);
  });

  const betList = document.querySelector("#betList");
  betList.innerHTML = "";
  recommendations(engine).forEach((rec) => {
    const li = document.createElement("li");
    li.textContent = rec;
    betList.append(li);
  });

  document.querySelector("#correlationTag").textContent = correlationTag(engine);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const fd = new FormData(form);
  const engine = calculateEngine(fd);
  render(engine, { a: fd.get("teamAName") || "Team A", b: fd.get("teamBName") || "Team B" });
});

buildFields();
form.requestSubmit();
