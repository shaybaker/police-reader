const screens = { home: document.getElementById("homeScreen"), read: document.getElementById("readScreen"), write: document.getElementById("writeScreen"), sounds: document.getElementById("soundsScreen"), reports: document.getElementById("reportsScreen") };
const titleMap = { home: "משימות היום", read: "אימון קריאה", write: "חדר כתיבה", sounds: "מעבדת צלילים", reports: "דוחות הצלחה" };
let points = Number(localStorage.getItem("policeReaderPoints") || 120);
let childName = localStorage.getItem("policeReaderChildName") || "";
let readScore = 0;
let writeScore = 0;
let soundOn = localStorage.getItem("policeReaderSound") === "on";
let audioContext;
const voiceFiles = {
  "משטרה": "assets/audio/mishtara.mp3",
  "ניידת": "assets/audio/nayadet.mp3",
  "שוטר": "assets/audio/shoter.mp3"
};

function playTone(type) {
  if (!soundOn) return;
  audioContext ||= new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const notes = type === "success" ? [523.25, 659.25, 783.99] : type === "error" ? [220, 180] : [440];
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(notes[0], audioContext.currentTime);
  notes.slice(1).forEach((note, index) => oscillator.frequency.setValueAtTime(note, audioContext.currentTime + (index + 1) * 0.11));
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + notes.length * 0.11 + 0.16);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + notes.length * 0.11 + 0.2);
}

function goTo(screenName) {
  Object.entries(screens).forEach(([name, element]) => element.classList.toggle("hidden", name !== screenName));
  document.getElementById("pageTitle").textContent = titleMap[screenName];
  document.querySelectorAll(".nav-item").forEach((button) => {
    const active = button.dataset.screen === screenName;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function addPoints(amount) {
  points += amount;
  localStorage.setItem("policeReaderPoints", String(points));
  document.getElementById("points").textContent = points;
  document.getElementById("reportPoints").textContent = points;
}
function speak(text) {
  if (!soundOn || !("speechSynthesis" in window)) return;
  const key = Object.keys(voiceFiles).find((word) => text.includes(word));
  if (key) {
    const humanVoice = new Audio(voiceFiles[key]);
    humanVoice.volume = 0.95;
    humanVoice.play().catch(() => speakWithSystemVoice(text));
    return;
  }
  speakWithSystemVoice(text);
}
function speakWithSystemVoice(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "he-IL";
  utterance.rate = 0.82;
  utterance.pitch = 1.05;
  window.speechSynthesis.speak(utterance);
}
function applyChildName(name) {
  childName = name.trim();
  localStorage.setItem("policeReaderChildName", childName);
  const firstLetter = Array.from(childName)[0] || "?";
  document.getElementById("welcomeName").textContent = childName;
  document.getElementById("reportName").textContent = childName;
  document.getElementById("officerName").textContent = `החוקר ${childName}`;
  document.getElementById("avatarLetter").textContent = firstLetter;
}
function openNamePrompt() {
  const modal = document.getElementById("welcomeModal");
  modal.classList.remove("hidden");
  document.getElementById("childName").focus();
}
document.getElementById("nameForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.getElementById("childName");
  if (!input.value.trim()) return;
  applyChildName(input.value);
  document.getElementById("welcomeModal").classList.add("hidden");
  document.querySelector(".app-shell").removeAttribute("aria-hidden");
  soundOn = true;
  localStorage.setItem("policeReaderSound", "on");
  speak(`שלום ${childName}. ברוך הבא לתחנת הקריאה`);
});
if (childName) {
  applyChildName(childName);
  document.getElementById("welcomeModal").classList.add("hidden");
} else {
  document.querySelector(".app-shell").setAttribute("aria-hidden", "true");
}
document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => goTo(button.dataset.go)));
document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => goTo(button.dataset.screen)));
document.getElementById("soundButton").addEventListener("click", (event) => {
  soundOn = !soundOn;
  localStorage.setItem("policeReaderSound", soundOn ? "on" : "off");
  event.currentTarget.setAttribute("aria-pressed", String(soundOn));
  event.currentTarget.textContent = soundOn ? "◉" : "◖";
  if (soundOn) playTone("success");
  document.getElementById("toast").textContent = soundOn ? "הצלילים הופעלו" : "הצלילים הושתקו";
  document.getElementById("toast").classList.add("show");
  setTimeout(() => document.getElementById("toast").classList.remove("show"), 1800);
});
document.getElementById("helpButton").addEventListener("click", () => {
  const toast = document.getElementById("toast");
  toast.textContent = "אפשר לבקש עזרה ממבוגר בכל שלב.";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
});
const readRounds = [
  { word: "משטרה", image: "מכונית משטרה", choices: ["משטרה", "מכונה", "מטריה"], hint: "המילה מתחילה באות מ." },
  { word: "ניידת", image: "ניידת משטרה", choices: ["נדנדה", "ניידת", "נמלה"], hint: "המילה מתחילה בצליל נַי." },
  { word: "שוטר", image: "שוטר", choices: ["שולחן", "שוטר", "שמש"], hint: "המילה מתחילה באות ש." }
];
let readRound = 0;
let readCompleted = false;
const choicesContainer = document.getElementById("choices");
function renderReadRound() {
  const round = readRounds[readRound];
  document.getElementById("readRoundLabel").textContent = `קוראים את הזירה · סבב ${readRound + 1} מתוך ${readRounds.length}`;
  document.querySelector(".scene-illustration").setAttribute("aria-label", round.image);
  document.getElementById("hintText").textContent = "";
  document.getElementById("readFeedback").textContent = "";
  document.getElementById("readFeedback").className = "feedback";
  document.getElementById("nextRead").classList.add("hidden");
  choicesContainer.replaceChildren();
  round.choices.forEach((text) => {
    const button = document.createElement("button");
    const correct = text === round.word;
    button.className = "choice";
    button.textContent = text;
    button.addEventListener("click", () => {
      document.querySelectorAll(".choice").forEach((item) => { item.disabled = true; });
      const feedback = document.getElementById("readFeedback");
      if (correct) {
        button.classList.add("correct");
        feedback.className = "feedback good";
        feedback.textContent = `מצוין! זו המילה ${round.word}.`;
        readScore += 40;
        document.getElementById("readScore").textContent = readScore;
        addPoints(40);
        playTone("success");
        speak(`מצוין! ${round.word}`);
        document.getElementById("nextRead").classList.remove("hidden");
      } else {
        button.classList.add("wrong");
        feedback.className = "feedback bad";
        feedback.textContent = `כמעט. נסו שוב עם רמז: ${round.word}.`;
        document.querySelectorAll(".choice").forEach((item) => { if (item !== button) item.disabled = false; });
        playTone("error");
        speak("כמעט. נסו שוב");
      }
    });
    choicesContainer.appendChild(button);
  });
}
renderReadRound();
document.getElementById("listenButton").addEventListener("click", () => { soundOn = true; localStorage.setItem("policeReaderSound", "on"); document.getElementById("soundButton").setAttribute("aria-pressed", "true"); document.getElementById("soundButton").textContent = "◉"; speak("משטרה"); playTone("click"); document.getElementById("toast").textContent = "הקשיבו למילה: משטרה"; document.getElementById("toast").classList.add("show"); setTimeout(() => document.getElementById("toast").classList.remove("show"), 1800); });
document.getElementById("hintButton").addEventListener("click", () => { document.getElementById("hintText").textContent = readRounds[readRound].hint; playTone("click"); speak(readRounds[readRound].hint); });
document.getElementById("nextRead").addEventListener("click", () => {
  if (readRound < readRounds.length - 1) {
    readRound += 1;
    renderReadRound();
  } else {
    readCompleted = true;
    document.getElementById("readFeedback").className = "feedback good";
    document.getElementById("readFeedback").textContent = "כל שלושת הסבבים הושלמו. חקירה מצוינת!";
    document.getElementById("nextRead").textContent = "המשך לחדר הכתיבה ←";
    document.getElementById("nextRead").onclick = () => goTo("write");
  }
});
document.getElementById("checkLetter").addEventListener("click", () => {
  const input = document.getElementById("letterInput");
  const feedback = document.getElementById("writeFeedback");
  if (input.value.trim() === "ש") { document.getElementById("blank").textContent = "ש"; feedback.className = "feedback good"; feedback.textContent = "נכון מאוד! כתבתם את המילה משטרה."; writeScore = 40; document.getElementById("writeScore").textContent = writeScore; addPoints(40); input.disabled = true; document.getElementById("checkLetter").disabled = true; playTone("success"); speak("נכון מאוד"); }
  else { feedback.className = "feedback bad"; feedback.textContent = "נסו שוב. האות היא ש."; playTone("error"); input.focus(); }
});
document.getElementById("letterInput").addEventListener("keydown", (event) => { if (event.key === "Enter") document.getElementById("checkLetter").click(); });
const soundChoices = document.getElementById("soundChoices");
["מ", "ש", "ת"].forEach((letter) => {
  const button = document.createElement("button");
  button.className = "sound-choice";
  button.textContent = letter;
  button.addEventListener("click", () => {
    const feedback = document.getElementById("soundFeedback");
    document.querySelectorAll(".sound-choice").forEach((item) => { item.disabled = true; });
    if (letter === "ש") {
      button.classList.add("correct");
      feedback.className = "feedback good";
      feedback.textContent = "נכון! שׁוֹטֵר מתחילה בצליל שׁ.";
      addPoints(30);
      playTone("success");
      speak("נכון. שוטר מתחילה בצליל שין");
    } else {
      button.classList.add("wrong");
      feedback.className = "feedback bad";
      feedback.textContent = "כמעט. הקשיבו שוב: שׁוֹטֵר.";
      document.querySelectorAll(".sound-choice").forEach((item) => { if (item !== button) item.disabled = false; });
      playTone("error");
      speak("כמעט. שוטר");
    }
  });
  soundChoices.appendChild(button);
});
document.getElementById("soundWordButton").addEventListener("click", () => { soundOn = true; localStorage.setItem("policeReaderSound", "on"); speak("שוטר"); playTone("click"); });
document.getElementById("points").textContent = points;
document.getElementById("reportPoints").textContent = points;
document.getElementById("soundButton").setAttribute("aria-pressed", String(soundOn));
document.getElementById("soundButton").textContent = soundOn ? "◉" : "◖";
