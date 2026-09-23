const screens = { home: document.getElementById("homeScreen"), read: document.getElementById("readScreen"), write: document.getElementById("writeScreen"), sounds: document.getElementById("soundsScreen"), reports: document.getElementById("reportsScreen") };
const titleMap = { home: "משימות היום", read: "אימון קריאה", write: "חדר כתיבה", sounds: "מעבדת צלילים", reports: "דוחות הצלחה" };
let points = Number(localStorage.getItem("policeReaderPoints") || 120);
let childName = localStorage.getItem("policeReaderChildName") || "";
let readScore = 0;
let writeScore = 0;
let soundOn = localStorage.getItem("policeReaderSound") === "on";
let audioContext;
const completedTasks = new Set(JSON.parse(sessionStorage.getItem("policeReaderCompleted") || "[]"));
const ranks = [
  { name: "מתלמד", level: 1, min: 0 },
  { name: "בלש מתחיל", level: 2, min: 160 },
  { name: "בלש זוטר", level: 3, min: 320 },
  { name: "בלש מתקדם", level: 4, min: 500 },
  { name: "מפקד חקירה", level: 5, min: 700 }
];
const voiceFiles = {
  "משטרה": "assets/audio/mishtara.wav",
  "ניידת": "assets/audio/nayadet.wav",
  "שוטר": "assets/audio/shoter.wav",
  "מפה": "assets/audio/mapa.wav",
  "מפתח": "assets/audio/mafteach.wav",
  "תיק": "assets/audio/tik.wav",
  "תג": "assets/audio/tag.wav",
  "דלת": "assets/audio/delet.wav",
  "אור": "assets/audio/or.wav"
};
const instructionFiles = {
  "איזו מילה מתאימה לתמונה? בחר את המילה שאתה רואה.": "assets/audio/instruction-read.wav",
  "כתבו את האות שחסרה במילה.": "assets/audio/instruction-write.wav",
  "איזה צליל פותח את המילה? בחרו את האות הראשונה.": "assets/audio/instruction-sounds.wav"
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
  const taskForScreen = { read: "read", write: "write", sounds: "sounds" }[screenName];
  if (taskForScreen && completedTasks.has(taskForScreen)) {
    showToast("המשימה הזו כבר הושלמה בסשן הנוכחי. פתחו משחק חדש למשימות חדשות.");
    return;
  }
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
  updateRank();
}
function updateRank() {
  const rank = [...ranks].reverse().find((item) => points >= item.min) || ranks[0];
  const next = ranks.find((item) => item.min > points);
  document.getElementById("rankName").textContent = rank.name;
  document.getElementById("homeRank").textContent = rank.name;
  document.getElementById("rankLevel").textContent = `דרגה ${rank.level}`;
  document.getElementById("rankNext").textContent = next ? `עוד ${next.min - points} נקודות עד לדרגה הבאה.` : "הגעת לדרגת מפקד חקירה!";
  const progress = next ? Math.round(((points - rank.min) / (next.min - rank.min)) * 100) : 100;
  document.getElementById("progressFill").style.width = `${progress}%`;
  document.getElementById("progressValue").textContent = `${progress}%`;
}
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}
function completeTask(task) {
  completedTasks.add(task);
  sessionStorage.setItem("policeReaderCompleted", JSON.stringify([...completedTasks]));
  document.querySelectorAll(`[data-screen="${task}"]`).forEach((button) => {
    button.classList.add("completed");
    button.setAttribute("aria-disabled", "true");
  });
}
function speak(text) {
  if (!soundOn) return;
  const file = instructionFiles[text] || Object.entries(voiceFiles).find(([word]) => text.trim() === word)?.[1];
  if (file) {
    const localAudio = new Audio(file);
    localAudio.volume = 0.95;
    localAudio.onerror = () => speakWithSystemVoice(text);
    localAudio.play().catch(() => speakWithSystemVoice(text));
    return;
  }
  speakWithSystemVoice(text);
}
function speakWithSystemVoice(text) {
  if (!("speechSynthesis" in window)) {
    showToast("לא נמצא קול במחשב. הוסיפו קול עברי בהגדרות Windows.");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "he-IL";
  utterance.rate = 0.82;
  utterance.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  const hebrewVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("he"));
  if (hebrewVoice) utterance.voice = hebrewVoice;
  window.speechSynthesis.speak(utterance);
}
if ("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
function showManagerFeedback(message, nextAction) {
  const modal = document.getElementById("missionComplete");
  document.getElementById("managerTitle").textContent = childName ? `כל הכבוד, ${childName}!` : "כל הכבוד!";
  document.getElementById("managerMessage").textContent = message;
  modal.classList.remove("hidden");
  playTone("success");
  speak(`כל הכבוד ${childName || ""}. ${message}`);
  window.setTimeout(() => {
    modal.classList.add("hidden");
    nextAction();
  }, 2000);
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
  showToast("אפשר לבקש עזרה ממבוגר בכל שלב.");
});
document.querySelectorAll("[data-speak]").forEach((button) => button.addEventListener("click", () => {
  soundOn = true;
  localStorage.setItem("policeReaderSound", "on");
  speak(button.dataset.speak);
}));
const readRounds = [
  { word: "משטרה", image: "מכונית משטרה", imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Police%20car.jpg?width=900", choices: ["משטרה", "מכונה", "מטריה"], hint: "המילה מתחילה באות מ." },
  { word: "ניידת", image: "ניידת משטרה", imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Police%20car%20in%20New%20York%20City.jpg?width=900", choices: ["נדנדה", "ניידת", "נמלה"], hint: "המילה מתחילה בצליל נַי." },
  { word: "שוטר", image: "שוטר", imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Police%20officer.jpg?width=900", choices: ["שולחן", "שוטר", "שמש"], hint: "המילה מתחילה באות ש." },
  { word: "מפה", image: "מפת חקירה", imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Map.jpg?width=900", choices: ["מפה", "מיטה", "מגבת"], hint: "המילה מתחילה באות מ." },
  { word: "מפתח", image: "מפתח", imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Key.jpg?width=900", choices: ["מפתח", "מטוס", "מחשב"], hint: "המילה מתחילה בצליל מַפ." },
  { word: "תג", image: "תג משטרה", imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Police_badge.jpg?width=900", choices: ["תג", "גג", "דג"], hint: "המילה קצרה ומתחילה באות ת." },
  { word: "דלת", image: "דלת", imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Door.jpg?width=900", choices: ["דלת", "דגל", "דלי"], hint: "המילה מתחילה באות ד." },
  { word: "אור", image: "אור", imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Flashlight.jpg?width=900", choices: ["אור", "אריה", "אוזן"], hint: "המילה מתחילה באות א." }
];
let readRound = 0;
let readCompleted = false;
const choicesContainer = document.getElementById("choices");
function renderReadRound() {
  const round = readRounds[readRound];
  document.getElementById("readRoundLabel").textContent = `קוראים את הזירה · סבב ${readRound + 1} מתוך ${readRounds.length}`;
  document.querySelector(".scene-illustration").setAttribute("aria-label", round.image);
  const sceneImage = document.getElementById("sceneImage");
  sceneImage.src = round.imageUrl;
  sceneImage.alt = round.image;
  sceneImage.onerror = () => { sceneImage.classList.add("hidden"); };
  sceneImage.onload = () => sceneImage.classList.remove("hidden");
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
        window.setTimeout(() => showManagerFeedback(`סיימת את סבב הקריאה: ${round.word}.`, () => {
          if (readRound < readRounds.length - 1) {
            readRound += 1;
            renderReadRound();
          } else {
            completeTask("read");
            goTo("write");
          }
        }), 150);
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
document.getElementById("speakChoices").addEventListener("click", () => speak(readRounds[readRound].choices.join(". ")));
const writeRounds = [
  { word: "משטרה", missing: "ש", parts: ["מ", "_", "ט", "ר", "ה"], imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Police%20car.jpg?width=500" },
  { word: "ניידת", missing: "י", parts: ["נ", "_", "ד", "ת"], imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Police%20car%20in%20New%20York%20City.jpg?width=500" },
  { word: "שוטר", missing: "ו", parts: ["ש", "_", "ט", "ר"], imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Police%20officer.jpg?width=500" },
  { word: "מפה", missing: "פ", parts: ["מ", "_", "ה"], imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Map.jpg?width=500" },
  { word: "מפתח", missing: "פ", parts: ["מ", "_", "ת", "ח"], imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Key.jpg?width=500" },
  { word: "תג", missing: "ג", parts: ["ת", "_"], imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Police_badge.jpg?width=500" },
  { word: "דלת", missing: "ל", parts: ["ד", "_", "ת"], imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Door.jpg?width=500" },
  { word: "אור", missing: "ר", parts: ["א", "_"], imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Flashlight.jpg?width=500" }
];
let writeRound = 0;
function renderWriteRound() {
  const round = writeRounds[writeRound];
  document.getElementById("writeRoundLabel").textContent = `כותבים דו״ח · סבב ${writeRound + 1} מתוך ${writeRounds.length}`;
  document.getElementById("writeWordLabel").textContent = round.word;
  document.getElementById("speakWriteWord").setAttribute("aria-label", `השמע את המילה ${round.word}`);
  const writeImage = document.getElementById("writeImage");
  writeImage.src = round.imageUrl;
  writeImage.alt = round.word;
  writeImage.onerror = () => writeImage.classList.add("hidden");
  writeImage.onload = () => writeImage.classList.remove("hidden");
  document.getElementById("missingWord").replaceChildren(...round.parts.map((part) => {
    const span = document.createElement("span");
    span.className = part === "_" ? "blank" : "";
    span.textContent = part;
    return span;
  }));
  document.getElementById("letterInput").value = "";
  document.getElementById("letterInput").disabled = false;
  document.getElementById("checkLetter").disabled = false;
  document.getElementById("writeFeedback").textContent = "";
  document.getElementById("writeFeedback").className = "feedback";
}
renderWriteRound();
document.getElementById("checkLetter").addEventListener("click", () => {
  const input = document.getElementById("letterInput");
  const feedback = document.getElementById("writeFeedback");
  const round = writeRounds[writeRound];
  if (input.value.trim() === round.missing) {
    document.querySelector("#missingWord .blank").textContent = round.missing;
    feedback.className = "feedback good";
    feedback.textContent = `נכון מאוד! כתבתם את המילה ${round.word}.`;
    writeScore += 40;
    document.getElementById("writeScore").textContent = writeScore;
    addPoints(40);
    input.disabled = true;
    document.getElementById("checkLetter").disabled = true;
    showManagerFeedback(`השלמת את המילה ${round.word}.`, () => {
      if (writeRound < writeRounds.length - 1) {
        writeRound += 1;
        renderWriteRound();
      } else {
        completeTask("write");
        goTo("sounds");
      }
    });
  }
  else { feedback.className = "feedback bad"; feedback.textContent = `נסו שוב. האות היא ${round.missing}.`; playTone("error"); input.focus(); }
});
document.getElementById("letterInput").addEventListener("keydown", (event) => { if (event.key === "Enter") document.getElementById("checkLetter").click(); });
document.getElementById("speakWriteWord").addEventListener("click", () => speak(writeRounds[writeRound].word));
const soundRounds = [
  { word: "שוטר", answer: "ש", choices: ["מ", "ש", "ת"] },
  { word: "ניידת", answer: "נ", choices: ["נ", "ב", "ל"] },
  { word: "מפה", answer: "מ", choices: ["ס", "מ", "ש"] },
  { word: "מפתח", answer: "מ", choices: ["מ", "פ", "ש"] },
  { word: "תיק", answer: "ת", choices: ["ת", "ט", "ק"] },
  { word: "תג", answer: "ת", choices: ["ת", "ג", "ד"] },
  { word: "דלת", answer: "ד", choices: ["ד", "ת", "ל"] },
  { word: "אור", answer: "א", choices: ["א", "ו", "ר"] }
];
let soundRound = 0;
const soundChoices = document.getElementById("soundChoices");
function renderSoundRound() {
  const round = soundRounds[soundRound];
  document.getElementById("soundWord").textContent = round.word;
  document.getElementById("soundRoundLabel").textContent = `מעבדת צלילים · סבב ${soundRound + 1} מתוך ${soundRounds.length}`;
  document.getElementById("soundFeedback").textContent = "";
  document.getElementById("soundFeedback").className = "feedback";
  soundChoices.replaceChildren();
  round.choices.forEach((letter) => {
  const button = document.createElement("button");
  button.className = "sound-choice";
  button.textContent = letter;
  button.addEventListener("click", () => {
    const feedback = document.getElementById("soundFeedback");
    document.querySelectorAll(".sound-choice").forEach((item) => { item.disabled = true; });
    if (letter === round.answer) {
      button.classList.add("correct");
      feedback.className = "feedback good";
      feedback.textContent = `נכון! ${round.word} מתחילה בצליל ${round.answer}.`;
      addPoints(30);
      showManagerFeedback(`זיהית נכון את הצליל הראשון במילה ${round.word}.`, () => {
        if (soundRound < soundRounds.length - 1) {
          soundRound += 1;
          renderSoundRound();
        } else {
          completeTask("sounds");
          goTo("reports");
        }
      });
    } else {
      button.classList.add("wrong");
      feedback.className = "feedback bad";
      feedback.textContent = `כמעט. הקשיבו שוב: ${round.word}.`;
      document.querySelectorAll(".sound-choice").forEach((item) => { if (item !== button) item.disabled = false; });
      playTone("error");
      speak(`כמעט. ${round.word}`);
    }
  });
  soundChoices.appendChild(button);
});
}
renderSoundRound();
document.getElementById("soundWordButton").addEventListener("click", () => { soundOn = true; localStorage.setItem("policeReaderSound", "on"); speak(document.getElementById("soundWord").textContent); playTone("click"); });
document.getElementById("points").textContent = points;
document.getElementById("reportPoints").textContent = points;
updateRank();
completedTasks.forEach((task) => document.querySelectorAll(`[data-screen="${task}"]`).forEach((button) => {
  button.classList.add("completed");
  button.setAttribute("aria-disabled", "true");
}));
document.getElementById("soundButton").setAttribute("aria-pressed", String(soundOn));
document.getElementById("soundButton").textContent = soundOn ? "◉" : "◖";
