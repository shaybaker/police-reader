const screens = { home: document.getElementById("homeScreen"), read: document.getElementById("readScreen"), write: document.getElementById("writeScreen"), reports: document.getElementById("reportsScreen") };
const titleMap = { home: "משימות היום", read: "אימון קריאה", write: "חדר כתיבה", reports: "דוחות הצלחה" };
let points = Number(localStorage.getItem("policeReaderPoints") || 120);
let readScore = 0;
let writeScore = 0;
let soundOn = false;

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
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}
document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => goTo(button.dataset.go)));
document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => goTo(button.dataset.screen)));
document.getElementById("soundButton").addEventListener("click", (event) => {
  soundOn = !soundOn;
  event.currentTarget.setAttribute("aria-pressed", String(soundOn));
  event.currentTarget.textContent = soundOn ? "◉" : "◖";
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
const choices = [{ text: "משטרה", correct: true }, { text: "מכונה", correct: false }, { text: "מטריה", correct: false }];
const choicesContainer = document.getElementById("choices");
choices.forEach(({ text, correct }) => {
  const button = document.createElement("button");
  button.className = "choice";
  button.textContent = text;
  button.addEventListener("click", () => {
    document.querySelectorAll(".choice").forEach((item) => { item.disabled = true; });
    const feedback = document.getElementById("readFeedback");
    if (correct) {
      button.classList.add("correct"); feedback.className = "feedback good"; feedback.textContent = "מצוין! זו המילה משטרה."; readScore = 40; addPoints(40);
      document.getElementById("nextRead").classList.remove("hidden");
      speak("מצוין! משטרה");
    } else {
      button.classList.add("wrong"); feedback.className = "feedback bad"; feedback.textContent = "כמעט. נסו שוב עם רמז: מִשְׁטָרָה."; document.querySelectorAll(".choice").forEach((item) => { if (item !== button) item.disabled = false; });
      speak("כמעט. נסו שוב");
    }
  });
  choicesContainer.appendChild(button);
});
document.getElementById("listenButton").addEventListener("click", () => { soundOn = true; speak("משטרה"); document.getElementById("toast").textContent = "הקשיבו למילה: משטרה"; document.getElementById("toast").classList.add("show"); setTimeout(() => document.getElementById("toast").classList.remove("show"), 1800); });
document.getElementById("nextRead").addEventListener("click", () => goTo("write"));
document.getElementById("checkLetter").addEventListener("click", () => {
  const input = document.getElementById("letterInput");
  const feedback = document.getElementById("writeFeedback");
  if (input.value.trim() === "ש") { document.getElementById("blank").textContent = "ש"; feedback.className = "feedback good"; feedback.textContent = "נכון מאוד! כתבתם את המילה משטרה."; writeScore = 40; addPoints(40); input.disabled = true; document.getElementById("checkLetter").disabled = true; speak("נכון מאוד"); }
  else { feedback.className = "feedback bad"; feedback.textContent = "נסו שוב. האות היא ש."; input.focus(); }
});
document.getElementById("letterInput").addEventListener("keydown", (event) => { if (event.key === "Enter") document.getElementById("checkLetter").click(); });
document.getElementById("points").textContent = points;
document.getElementById("reportPoints").textContent = points;
