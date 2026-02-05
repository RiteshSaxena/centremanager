import moment from 'moment';

interface FeedbackData {
  childName: string;
  parentName: string;
  schoolYear?: string;
  mathScore?: number;
  englishScore?: number;
  mathTime?: string;
  englishTime?: string;
  feedback?: string;
  feedbackAuthor?: string;
  date: string;
  centerName: string;
  isFollowUpRequired?: boolean;
}

const formatTime = (minutes: string | number | null | undefined): string => {
  if (minutes === null || minutes === undefined) return '-';
  const mins = typeof minutes === 'string' ? parseInt(minutes, 10) : minutes;
  if (isNaN(mins)) return '-';
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins} min` : `${hours}h`;
  }
  return `${mins} min`;
};

const getScoreClass = (score: number | undefined | null): string => {
  if (score === null || score === undefined) return 'neutral';
  if (score >= 80) return 'success';
  if (score >= 50) return 'warning';
  return 'warning';
};

const formatScore = (score: number | undefined | null): string => {
  if (score === null || score === undefined) return '-';
  return String(score);
};

const formatDate = (date: string): string => {
  return moment(date).format('dddd, MMMM D, YYYY');
};

export const generateFeedbackEmailHtml = (feedback: FeedbackData): string => {
  const {
    childName,
    parentName,
    schoolYear,
    mathScore,
    englishScore,
    mathTime,
    englishTime,
    feedback: feedbackText,
    feedbackAuthor,
    date,
    centerName,
    isFollowUpRequired,
  } = feedback;

  const formattedDate = formatDate(date);
  const mathScoreClass = getScoreClass(mathScore);
  const englishScoreClass = getScoreClass(englishScore);
  const mathTimeClass = mathTime ? 'success' : 'neutral';
  const englishTimeClass = englishTime ? 'success' : 'neutral';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Feedback Report</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            color: #333333;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
        }
        .header p {
            margin: 8px 0 0 0;
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
        }
        .content {
            padding: 30px 20px;
        }
        .info-card {
            background: linear-gradient(to right, #f0f4ff, #e8f0ff);
            border-left: 4px solid #667eea;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .info-row {
            margin-bottom: 10px;
        }
        .info-row:last-child {
            margin-bottom: 0;
        }
        .info-label {
            font-weight: 600;
            color: #555555;
            font-size: 14px;
            display: inline-block;
            width: 100px;
        }
        .info-value {
            color: #333333;
            font-size: 14px;
        }
        .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #666666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 15px 0;
        }
        .performance-grid {
            margin-bottom: 25px;
        }
        .performance-card {
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            background-color: #ffffff;
            margin-bottom: 15px;
        }
        .performance-card.math {
            border-top: 3px solid #3b82f6;
        }
        .performance-card.english {
            border-top: 3px solid #8b5cf6;
        }
        .subject-header {
            margin-bottom: 15px;
        }
        .subject-icon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            display: inline-block;
            text-align: center;
            line-height: 36px;
            margin-right: 10px;
            font-size: 16px;
        }
        .subject-icon.math {
            background-color: #dbeafe;
            color: #3b82f6;
        }
        .subject-icon.english {
            background-color: #ede9fe;
            color: #8b5cf6;
        }
        .subject-name {
            font-size: 16px;
            font-weight: 700;
            color: #1f2937;
            display: inline-block;
            vertical-align: middle;
        }
        .score-row {
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        .score-row:last-child {
            border-bottom: none;
        }
        .score-label {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
            display: inline-block;
            width: 60px;
        }
        .score-value {
            font-size: 24px;
            font-weight: 700;
            display: inline-block;
        }
        .score-value.success {
            color: #10b981;
        }
        .score-value.warning {
            color: #f59e0b;
        }
        .score-value.neutral {
            color: #9ca3af;
        }
        .time-value {
            font-size: 18px;
            font-weight: 600;
            display: inline-block;
        }
        .time-value.success {
            color: #10b981;
        }
        .time-value.warning {
            color: #f59e0b;
        }
        .time-value.neutral {
            color: #9ca3af;
        }
        .feedback-card {
            background-color: #f9fafb;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .feedback-header {
            margin-bottom: 12px;
        }
        .feedback-icon {
            color: #6b7280;
            margin-right: 10px;
            font-size: 18px;
        }
        .feedback-title {
            font-size: 16px;
            font-weight: 700;
            color: #1f2937;
        }
        .feedback-author {
            font-size: 14px;
            color: #6b7280;
            font-weight: 400;
            margin-left: 8px;
        }
        .feedback-text {
            font-size: 15px;
            line-height: 1.6;
            color: #374151;
            margin: 0;
        }
        .feedback-empty {
            font-size: 14px;
            color: #9ca3af;
            font-style: italic;
        }
        .alert-card {
            background-color: #fef2f2;
            border-left: 4px solid #ef4444;
            border-radius: 8px;
            padding: 15px 20px;
            margin-bottom: 25px;
        }
        .alert-card p {
            margin: 0;
            color: #991b1b;
            font-size: 14px;
            font-weight: 600;
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 5px 0;
            color: #6b7280;
            font-size: 13px;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Student Performance Report</h1>
            <p>${centerName}</p>
        </div>

        <div class="content">
            <div class="info-card">
                <div class="info-row">
                    <span class="info-label">Student:</span>
                    <span class="info-value">${childName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Parent:</span>
                    <span class="info-value">${parentName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Date:</span>
                    <span class="info-value">${formattedDate}</span>
                </div>
                ${
                  schoolYear
                    ? `<div class="info-row">
                    <span class="info-label">School Year:</span>
                    <span class="info-value">${schoolYear}</span>
                </div>`
                    : ''
                }
            </div>

            ${
              isFollowUpRequired
                ? `<div class="alert-card">
                <p>In-person follow-up required</p>
            </div>`
                : ''
            }

            <div>
                <h2 class="section-title">Performance - ${formattedDate}</h2>

                <div class="performance-grid">
                    <div class="performance-card math">
                        <div class="subject-header">
                            <span class="subject-icon math">M</span>
                            <span class="subject-name">Mathematics</span>
                        </div>
                        <div class="score-row">
                            <span class="score-label">Score:</span>
                            <span class="score-value ${mathScoreClass}">${formatScore(mathScore)}</span>
                        </div>
                        <div class="score-row">
                            <span class="score-label">Time:</span>
                            <span class="time-value ${mathTimeClass}">${formatTime(mathTime)}</span>
                        </div>
                    </div>

                    <div class="performance-card english">
                        <div class="subject-header">
                            <span class="subject-icon english">E</span>
                            <span class="subject-name">English</span>
                        </div>
                        <div class="score-row">
                            <span class="score-label">Score:</span>
                            <span class="score-value ${englishScoreClass}">${formatScore(englishScore)}</span>
                        </div>
                        <div class="score-row">
                            <span class="score-label">Time:</span>
                            <span class="time-value ${englishTimeClass}">${formatTime(englishTime)}</span>
                        </div>
                    </div>
                </div>
            </div>

            ${
              feedbackText
                ? `<div class="feedback-card">
                <div class="feedback-header">
                    <span class="feedback-icon">&#128172;</span>
                    <span class="feedback-title">Instructor Feedback</span>
                    ${feedbackAuthor ? `<span class="feedback-author">by ${feedbackAuthor}</span>` : ''}
                </div>
                <p class="feedback-text">${feedbackText}</p>
            </div>`
                : ''
            }
        </div>

        <div class="footer">
            <p>This is an automated report from ${centerName}</p>
            <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
                Generated with Centre Manager
            </p>
        </div>
    </div>
</body>
</html>`;
};

export const generateFeedbackEmailText = (feedback: FeedbackData): string => {
  const {
    childName,
    parentName,
    schoolYear,
    mathScore,
    englishScore,
    mathTime,
    englishTime,
    feedback: feedbackText,
    feedbackAuthor,
    date,
    centerName,
    isFollowUpRequired,
  } = feedback;

  const formattedDate = formatDate(date);

  let text = `Student Performance Report - ${centerName}

Student: ${childName}
Parent: ${parentName}
Date: ${formattedDate}`;

  if (schoolYear) {
    text += `\nSchool Year: ${schoolYear}`;
  }

  if (isFollowUpRequired) {
    text += `\n\n*** In-person follow-up required ***`;
  }

  text += `

Performance - ${formattedDate}
--------------------------------

Mathematics:
  Score: ${formatScore(mathScore)}
  Time: ${formatTime(mathTime)}

English:
  Score: ${formatScore(englishScore)}
  Time: ${formatTime(englishTime)}`;

  if (feedbackText) {
    text += `\n\nInstructor Feedback${feedbackAuthor ? ` (by ${feedbackAuthor})` : ''}:
${feedbackText}`;
  }

  text += `

---
This is an automated report from ${centerName}
Generated with Centre Manager`;

  return text;
};
