# תחנת קריאה משטרתית

אב־טיפוס של תוכנת Windows ללימוד קריאה וכתיבה בעברית, בעיצוב של מערכת משטרתית מעודדת.

## הפעלה למפתח

```bash
npm install
npm start
```

## יצירת קובץ Windows

```bash
npm run package:win
```

המתקין ייווצר בתיקיית `dist`. במהלך ההתקנה מסומן כברירת מחדל ליצור קיצור דרך על שולחן העבודה ובתפריט Start.

## העלאה ל-GitHub

אחרי שיוצרים מאגר ריק ב-GitHub בשם `police-reader`, מריצים מתיקיית הפרויקט:

```bash
git remote add origin https://github.com/USERNAME/police-reader.git
git branch -M main
git push -u origin main
```

## מה כלול באב־טיפוס

- לוח משימות יומי עם התקדמות, ניקוד ורצף ימים.
- תרגיל זיהוי מילה מול תמונת ניידת משטרה.
- תרגיל כתיבה: השלמת האות החסרה במילה “משטרה”.
- דוח הצלחה עם היסטוריית משימות.
- הקראת מילים, מצב עזרה, שמירת ניקוד מקומית ותמיכה במקלדת.
- משוב קולי: צלילי לחיצה, הצלחה וניסיון נוסף, בנוסף להקראת מילים בעברית.
- ממשק RTL בעברית, טקסט גדול וניגודיות ברורה.

האב־טיפוס אינו תחליף לתוכנית טיפול או הוראה מקצועית. לפני שימוש קבוע מומלץ להתאים את רמת הקושי והתרגילים יחד עם קלינאי תקשורת או מורה לחינוך מיוחד.

## עקרונות פדגוגיים שנוספו

התרגילים מבוססים על עקרונות שנמצאו במחקר ובמשאבי הוראה מקצועיים: מודעות פונולוגית, הוראה מפורשת של קשר אות–צליל, הרבה הזדמנויות תגובה קצרות, משוב מיידי, תמיכה חזותית וקולית, והתקדמות מדורגת. בהתאם לכך נוספו שלושה סבבי קריאה, רמזים, מעבדת צלילים והקראה איטית בעברית.

מקורות:

- [National Center on Improving Literacy — Phonological Awareness](https://improvingliteracy.org/resource/phonological-awareness-what-is-it-and-how-does-it-relate-to-phonemic-awareness/)
- [National Center on Improving Literacy — Phonics](https://improvingliteracy.org/resource/phonics-what-is-it-and-why-is-it-important/)
- [NCII — Opportunities to Respond](https://intensiveintervention.org/resource/intensifying-intervention-opportunities-to-respond)
- [ASHA — Augmentative and Alternative Communication](https://www.asha.org/practice-portal/professional-issues/augmentative-and-alternative-communication/)
