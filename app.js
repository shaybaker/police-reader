const $ = (id) => document.getElementById(id);
let name = localStorage.getItem("policeReaderChildName") || "";
let soundOn = localStorage.getItem("policeReaderSound") !== "off";
let points = Number(localStorage.getItem("policeReaderPoints") || 0);
let solved = 0;
let index = 0;
let answered = false;
const ranks = [{name:"טירון", min:0}, {name:"שוטר מתחיל", min:80}, {name:"שוטר אחראי", min:180}, {name:"בלש צעיר", min:300}, {name:"מפקד משמרת", min:450}];
const audio = {
  "משטרה":"assets/audio/mishtara.wav", "ניידת":"assets/audio/nayadet.wav", "שוטר":"assets/audio/shoter.wav",
  "תג":"assets/audio/tag.wav", "דלת":"assets/audio/delet.wav", "אור":"assets/audio/or.wav"
};
const cases = [
  {title:"תיק אבוד בתחנה", image:"https://commons.wikimedia.org/wiki/Special:FilePath/Police_station.jpg?width=800", keyword:"תיק", text:"מוקד, כאן מנהל התחנה. ילד מצא תיק ליד הדלת. קרא את המילה תיק ובחר פעולה.", question:"מה עושים קודם?", choices:["מרימים ובודקים לבד","מבקשים ממבוגר להגיע ונשארים ליד התיק","בועטים בתיק"], answer:1, praise:"בחירה מצוינת. נשארים רגועים ומבקשים עזרה."},
  {title:"אור מהבהב בחצר", image:"https://commons.wikimedia.org/wiki/Special:FilePath/Flashlight.jpg?width=800", keyword:"אור", text:"שוטר, יש אור מהבהב בחצר החשוכה. קרא את המילה אור ובחר פעולה בטוחה.", question:"איך מתקרבים?", choices:["עם שוטר נוסף ופנס","רצים לבד בחושך","מתחבאים ולא מספרים"], answer:0, praise:"כל הכבוד. תמיד בודקים יחד ובזהירות."},
  {title:"דלת פתוחה", image:"https://commons.wikimedia.org/wiki/Special:FilePath/Door.jpg?width=800", keyword:"דלת", text:"יש דלת פתוחה בבניין. לא יודעים מי פתח אותה. קרא את המילה דלת.", question:"מה מדווחים בקשר?", choices:["דלת פתוחה, צריך לבדוק","אין שום דבר","אני נכנס לבד"], answer:0, praise:"נכון מאוד. דיווח ברור עוזר לצוות להגיע."},
  {title:"ניידת בדרך", image:"https://commons.wikimedia.org/wiki/Special:FilePath/Police_car.jpg?width=800", keyword:"ניידת", text:"הניידת בדרך לאירוע. קרא את המילה ניידת והכן את הדרך.", question:"מה חשוב לעשות?", choices:["לפנות מקום ולחכות להוראה","לחסום את הכביש","לנסוע אחריה"], answer:0, praise:"מעולה. מפנים דרך ונשמעים להוראות."},
  {title:"תג על הרצפה", image:"https://commons.wikimedia.org/wiki/Special:FilePath/Police_badge.jpg?width=800", keyword:"תג", text:"מצאת תג על הרצפה ליד התחנה. קרא את המילה תג.", question:"למי מוסרים את התג?", choices:["למנהל התחנה","לוקחים הביתה","משאירים באמצע הדרך"], answer:0, praise:"מצוין. חפץ חשוב מוסרים למבוגר אחראי."},
  {title:"עזרה לשכן", image:"https://commons.wikimedia.org/wiki/Special:FilePath/Police_officer.jpg?width=800", keyword:"שוטר", text:"שכן מבקש עזרה כי הוא לא מוצא את הדרך. קרא את המילה שוטר.", question:"איך עוזרים?", choices:["מקשיבים ומזעיקים מבוגר","צועקים עליו","מתעלמים"], answer:0, praise:"כל הכבוד. הקשבה ודיבור רגוע הם כוח של שוטר."
  }
];
function rank(){ return [...ranks].reverse().find((r)=>points>=r.min).name; }
function save(){ localStorage.setItem("policeReaderPoints", points); $("points").textContent=points; $("rank").textContent=rank(); $("solved").textContent=solved; }
function speak(text){
  if(!soundOn) return;
  const word=Object.keys(audio).find((key)=>text.trim()===key);
  if(word){ const player=new Audio(audio[word]); player.volume=.95; player.play().catch(()=>systemSpeak(text)); return; }
  systemSpeak(text);
}
function systemSpeak(text){ if(!("speechSynthesis" in window)) return; speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang="he-IL"; u.rate=.78; u.pitch=1.02; const voice=speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith("he")); if(voice) u.voice=voice; speechSynthesis.speak(u); }
function render(){
  const item=cases[index]; answered=false; $("caseCounter").textContent=`אירוע ${index+1} מתוך ${cases.length}`; $("scenarioTitle").textContent=item.title; $("dispatchText").textContent=item.text; $("keyword").textContent=item.keyword; $("question").textContent=item.question; $("difficulty").textContent=index<2?"קל":index<4?"בינוני":"מתקדם"; $("feedback").textContent=""; $("feedback").className="feedback"; $("nextButton").classList.add("hidden");
  const image=$("scenarioImage"); image.src=item.image; image.alt=item.title; image.onerror=()=>image.classList.add("fallback"); image.onload=()=>image.classList.remove("fallback");
  const choices=$("choices"); choices.replaceChildren(); item.choices.forEach((choice,i)=>{const b=document.createElement("button"); b.className="choice"; b.textContent=choice; b.addEventListener("click",()=>answer(i,b)); choices.appendChild(b);});
}
function answer(selected, button){
  if(answered) return; const item=cases[index]; if(selected!==item.answer){ button.classList.add("wrong"); $("feedback").textContent="כמעט. קרא שוב את הקריאה והקשב לרמז."; $("feedback").className="feedback bad"; speak("כמעט. נסה שוב."); return; }
  answered=true; document.querySelectorAll(".choice").forEach((b)=>b.disabled=true); button.classList.add("correct"); points+=30; solved++; save(); $("feedback").textContent=item.praise; $("feedback").className="feedback good"; speak(`כל הכבוד ${name}. ${item.praise}`); $("nextButton").classList.remove("hidden");
}
function start(){ $("mission").classList.remove("hidden"); $("complete").classList.add("hidden"); index=0; render(); $("mission").scrollIntoView({behavior:"smooth",block:"start"}); speak(cases[0].text); }
function finish(){ $("mission").classList.add("hidden"); $("complete").classList.remove("hidden"); $("completeTitle").textContent=`כל הכבוד, ${name}!`; $("completeText").textContent=`טיפלת בכל ${cases.length} הקריאות. הגעת לדרגת ${rank()} וצברת ${points} נקודות.`; speak(`כל הכבוד ${name}. סיימת את המשמרת. ${rank()}`); }
$("nameForm").addEventListener("submit",(e)=>{e.preventDefault(); name=$("childName").value.trim(); if(!name)return; localStorage.setItem("policeReaderChildName",name); $("welcomeName").textContent=name; $("welcomeModal").classList.add("hidden"); soundOn=true; localStorage.setItem("policeReaderSound","on"); speak(`שלום ${name}. ברוך הבא למוקד מאה.`);});
if(name){ $("welcomeName").textContent=name; $("welcomeModal").classList.add("hidden"); } save();
$("startButton").addEventListener("click",start); $("listenMission").addEventListener("click",()=>speak(cases[index].text)); $("listenKeyword").addEventListener("click",()=>speak(cases[index].keyword)); $("nextButton").addEventListener("click",()=>{if(index<cases.length-1){index++;render();speak(cases[index].text);}else finish();}); $("restartButton").addEventListener("click",start);
$("soundButton").addEventListener("click",()=>{soundOn=!soundOn; localStorage.setItem("policeReaderSound",soundOn?"on":"off"); $("soundButton").textContent=soundOn?"🔊":"🔇"; $("soundButton").setAttribute("aria-pressed",String(soundOn));});
