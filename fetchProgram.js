import axios from 'axios';
import StreamZip from 'node-stream-zip';
import { Buffer } from 'buffer';
import fs from 'fs/promises';
import { loadPub } from 'meeting-schedules-parser/dist/node/index.cjs';

const monthsBG = {
    'януари': 1,
    'февруари': 2,
    'март': 3,
    'април': 4,
    'май': 5,
    'юни': 6,
    'юли': 7,
    'август': 8,
    'септември': 9,
    'октомври': 10,
    'ноември': 11,
    'декември': 12
};

function getJWLanguageCode(languageQuery) {
    const languageMap = {
        'pl': 'P',
        'en': 'E',
        'fr': 'F',
        'de': 'G',
        'es': 'S',
        'it': 'I',
        'ru': 'R',
        'uk': 'U',
        'pt': 'T',
        'bg': 'BL'
    };
    const locale = languageQuery.split('-')[0];
    return languageMap[locale] || 'E';
}

function getCorrectIssueMonth(dateString, meetingKind) {
    const [day, month, year] = dateString.split('.').map(Number);
    const date = new Date(year, month - 1, day);

    if (meetingKind === "weekend") {
        const monday = new Date(date);
        const dayOfWeek = monday.getDay() || 7;
        monday.setDate(monday.getDate() - (dayOfWeek - 1));

        let issueMonth = monday.getMonth() + 1;
        let issueYear = monday.getFullYear();

        if (issueMonth === 12 && monday.getDate() <= 7) {
            // pierwsze dni grudnia — cofamy o 3 miesiące
            issueMonth -= 3;
            if (issueMonth <= 0) {
                issueMonth += 12;
                issueYear -= 1;
            }
        } else {
            // normalnie cofamy o 2 miesiące
            issueMonth -= 2;
            if (issueMonth <= 0) {
                issueMonth += 12;
                issueYear -= 1;
            }
        }

        return `${issueYear}${String(issueMonth).padStart(2, '0')}`;
    }

    const issueMonth = month % 2 === 0 ? month - 1 : month;
    return `${year}${String(issueMonth).padStart(2, '0')}`;
}

async function getJWPubUrl(issueMonth, language, meetingKind) {
    const symbol = meetingKind === "weekend" ? "w" : 'mwb';
    const apiUrl = `https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS?pub=${symbol}&issue=${issueMonth}&output=json&langwritten=${language}`;
    const response = await axios.get(apiUrl);
    const epubLink = response.data.files?.[language]?.JWPUB?.[0]?.file?.url;

    return epubLink;
}

function parseWeekDate(text, year) {
  text = text.toLowerCase();

  // Format: 28 юли — 3 август
  let match = text.match(/(\d{1,2})\s+([а-я]+)\s+[—–-]\s+(\d{1,2})\s+([а-я]+)/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = monthsBG[match[2]];
    if (!month) return null;
    return new Date(year, month - 1, day).toISOString().split('T')[0];
  }

  // Format: 11–17 август
  match = text.match(/(\d{1,2})[—–-](\d{1,2})\s+([а-я]+)/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = monthsBG[match[3]];
    if (!month) return null;
    return new Date(year, month - 1, day).toISOString().split('T')[0];
  }

  return null;
}


function parseStudyDate(studyString) {
  let text = studyString.toLowerCase();

  // Case 1: date range like "28 юли 2025 — 3 август 2025"
  let match = text.match(/(\d{1,2})\s+([а-я]+)\s+(\d{4})\s+[—-]\s+(\d{1,2})\s+([а-я]+)\s+(\d{4})/i);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = monthsBG[match[2]];
    const year = parseInt(match[3], 10);
    if (month) return new Date(year, month - 1, day + 1).toISOString().split('T')[0];
  }

  // Case 2: week range like "11-17 август 2025"
  match = text.match(/(\d{1,2})-(\d{1,2})\s+([а-я]+)\s+(\d{4})/i);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = monthsBG[match[3]];
    const year = parseInt(match[4], 10);
    if (month) return new Date(year, month - 1, day + 1).toISOString().split('T')[0];
  }

  return null;

}

export async function getWeekProgram(dateString, languageQuery, meetingKind) {
    const language = getJWLanguageCode(languageQuery);
    const issueMonth = getCorrectIssueMonth(dateString, meetingKind);
    const issueMonthNumber = Number(issueMonth);
    const weeks = []

    const epubUrl = await getJWPubUrl(issueMonth, language, meetingKind);
    if(epubUrl){
        const epubWeeks = await loadPub({ url: epubUrl });
        weeks.push(...epubWeeks)
    }

    const previousIssueMonth = meetingKind === "weekend" ? (issueMonthNumber - 1).toString() : (issueMonthNumber - 2).toString();
    const epubPreviousUrl = await getJWPubUrl(previousIssueMonth, language, meetingKind);
    if(epubPreviousUrl){
        const epubPreviousWeeks = await loadPub({ url: epubPreviousUrl });
        weeks.push(...epubPreviousWeeks)
    }

    const nextIssueMonth = meetingKind === "weekend" ? (issueMonthNumber + 1).toString() : (issueMonthNumber + 2).toString();
    const epubNextUrl = await getJWPubUrl(nextIssueMonth, language, meetingKind);
    if(epubNextUrl){
        const epubNextWeeks = await loadPub({ url: epubNextUrl });
        weeks.push(...epubNextWeeks)
    }
    

    const [d, m, y] = dateString.split('.').map(Number);
    const targetDate = new Date(y, m - 1, d);
    console.log(issueMonth.substring(0,4))

    const week = weeks.find((weekInside) => {
        const enhancedDate = meetingKind === "weekend" ? weekInside.w_study_date : weekInside.mwb_week_date;
        const notEnhancedDate = meetingKind === "weekend" ? parseStudyDate(weekInside.w_study_date) : parseWeekDate(weekInside.mwb_week_date, Number(issueMonth.substring(0,4)))
        const start = new Date(languageQuery === "bg" ? notEnhancedDate : enhancedDate); // mwb_week_date w formacie YYYY-MM-
        console.log(start);
        
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return targetDate >= start && targetDate <= end;
    });

    if (!week) throw new Error('Nie znaleziono programu na ten tydzień.');
    return week;
}
