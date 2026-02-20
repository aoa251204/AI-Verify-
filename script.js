function el(id){ return document.getElementById(id); }

const checklistIds = [
  "dosePresent","routePresent","freqPresent","durationPresent",
  "contraPresent","interactionsPresent","monitoringPresent","redFlagsPresent",
  "patientFactors","sourcesProvided","sourcesVerifiable","uncertainty",
  "noAbsoluteLanguage","plainLanguage","culturalSensitivity"
];

// Weight missing items (risk points added when NOT ticked)
const weights = {
  dosePresent: 2,
  routePresent: 1,
  freqPresent: 2,
  durationPresent: 1,

  contraPresent: 2,
  interactionsPresent: 2,
  monitoringPresent: 1,
  redFlagsPresent: 1,

  patientFactors: 2,
  sourcesProvided: 2,
  sourcesVerifiable: 2,
  uncertainty: 1,

  noAbsoluteLanguage: 1,
  plainLanguage: 1,
  culturalSensitivity: 1
};

function scoreRisk(){
  let score = 0;
  const missing = [];

  checklistIds.forEach(id => {
    const checked = el(id).checked;
    if(!checked){
      score += (weights[id] || 1);
      missing.push(id);
    }
  });

  // Extra heuristic: scan pasted text for "always/never/guarantee" etc.
  const text = (el("aiText").value || "").toLowerCase();
  const absoluteWords = ["always","never","guarantee","guaranteed","definitely","certainly","must"];
  const hasAbsolute = absoluteWords.some(w => text.includes(w));
  if(hasAbsolute){
    score += 1;
    if(!missing.includes("noAbsoluteLanguage")) missing.push("noAbsoluteLanguage");
  }

  // Map to category
  let level = "Green";
  let klass = "good";
  let msg = "Low risk based on checklist. Still verify key clinical details in trusted sources.";
  if(score >= 9 && score <= 15){
    level = "Amber";
    klass = "warn";
    msg = "Moderate risk. Verify key details before relying on this information.";
  } else if(score >= 16){
    level = "Red";
    klass = "bad";
    msg = "High risk. Do not rely on this without thorough verification and professional judgement.";
  }

  const actions = buildActions(missing);

  renderResult({score, level, klass, msg, actions});
}

function buildActions(missing){
  // Convert missing IDs into human actions (keep it short & useful)
  const map = {
    dosePresent: "Verify the dose/strength in a trusted source (e.g., BNF/local guidance).",
    routePresent: "Confirm route/formulation and ensure the advice matches the product.",
    freqPresent: "Check frequency/maximum usage advice (avoid unsafe overuse).",
    durationPresent: "Clarify duration/stop criteria where relevant.",
    contraPresent: "Check contraindications/cautions for the patient’s comorbidities.",
    interactionsPresent: "Check for clinically significant drug–drug interactions.",
    monitoringPresent: "Confirm monitoring requirements (labs/response) where relevant.",
    redFlagsPresent: "Add safety-netting and clear red flags for urgent review.",
    patientFactors: "Consider patient factors (renal/hepatic, pregnancy, age, asthma control, etc.).",
    sourcesProvided: "Require sources; avoid using uncited outputs for clinical decisions.",
    sourcesVerifiable: "Verify citations are real and up-to-date (avoid fabricated references).",
    uncertainty: "Look for uncertainty; if missing, assume it may be incomplete and verify.",
    noAbsoluteLanguage: "Be cautious of absolute claims; verify and contextualise.",
    plainLanguage: "Rephrase into clear patient-friendly counselling.",
    culturalSensitivity: "Adapt counselling for health literacy, language needs, and beliefs."
  };

  const uniq = [...new Set(missing)];
  const actions = uniq
    .map(id => map[id])
    .filter(Boolean);

  // Limit to top 6 actions for readability
  return actions.slice(0, 6);
}

function renderResult({score, level, klass, msg, actions}){
  const box = el("resultBox");
  box.classList.remove("good","warn","bad","neutral");
  box.classList.add(klass);

  el("pill").textContent = level;
  el("scoreText").textContent = `Score: ${score}`;
  el("resultMsg").textContent = msg;

  const ul = el("actions");
  ul.innerHTML = "";
  actions.forEach(a => {
    const li = document.createElement("li");
    li.textContent = a;
    ul.appendChild(li);
  });
}

function copySummary(){
  const pill = el("pill").textContent;
  const score = el("scoreText").textContent;
  const text = el("aiText").value || "";
  const snippet = text.trim().slice(0, 240).replace(/\s+/g," ");
  const summary = `AI-VERIFY Result: ${pill} (${score}). Snippet: "${snippet}${text.length>240 ? "…" : ""}"`;
  navigator.clipboard.writeText(summary).then(() => {
    el("copyBtn").textContent = "Copied ✓";
    setTimeout(()=> el("copyBtn").textContent = "Copy summary", 1200);
  });
}

function resetAll(){
  el("aiText").value = "";
  checklistIds.forEach(id => el(id).checked = false);
  el("resultBox").classList.remove("good","warn","bad");
  el("resultBox").classList.add("neutral");
  el("pill").textContent = "—";
  el("scoreText").textContent = "Score: —";
  el("resultMsg").textContent = "Tick the checklist and click “Score risk”.";
  el("actions").innerHTML = "";
}

el("scoreBtn").addEventListener("click", scoreRisk);
el("copyBtn").addEventListener("click", copySummary);
el("resetBtn").addEventListener("click", resetAll);
