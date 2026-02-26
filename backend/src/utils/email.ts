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
  centerEmail?: string;
  centerPhone?: string;
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
    centerEmail,
    centerPhone,
    isFollowUpRequired,
  } = feedback;

  const formattedDate = formatDate(date);
  const mathScoreClass = getScoreClass(mathScore);
  const englishScoreClass = getScoreClass(englishScore);

  // Time classes based on minutes
  const getMathTimeClass = () => {
    if (!mathTime) return 'neutral';
    const mins = typeof mathTime === 'string' ? parseInt(mathTime, 10) : mathTime;
    return mins <= 20 ? 'success' : 'warning';
  };

  const getEnglishTimeClass = () => {
    if (!englishTime) return 'neutral';
    const mins = typeof englishTime === 'string' ? parseInt(englishTime, 10) : englishTime;
    return mins <= 20 ? 'success' : 'warning';
  };

  const mathTimeClass = getMathTimeClass();
  const englishTimeClass = getEnglishTimeClass();

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light">
    <!--[if gte mso 9]>
    <xml>
        <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
    <title>Student Feedback Report</title>
    <style>
        :root {
            color-scheme: light only;
        }
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5 !important;
            color: #333333 !important;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff !important;
        }
        .content {
            background-color: #ffffff !important;
        }
        table {
            background-color: transparent !important;
        }
        td {
            background-color: transparent !important;
        }
        .header {
            background-color: #667eea;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 10px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 16px;
            font-weight: 700;
        }
        .header p {
            margin: 5px 0 0 0;
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
        }
        .content {
            padding: 30px 20px;
        }
        .info-card {
            background: #e8f0ff !important;
            background-color: #e8f0ff !important;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .info-row {
            display: flex;
            justify-content: center;
        }
        .info-row:last-child {
            margin-bottom: 0;
        }
        .info-label {
            font-weight: 600;
            color: #555555;
            font-size: 14px;
            display: inline-block;
        }
        .info-value {
            text-align: right;
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
            background-color: #ffffff !important;
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
            background-color: #dbeafe !important;
            color: #3b82f6 !important;
        }
        .subject-icon.english {
            background-color: #ede9fe !important;
            color: #8b5cf6 !important;
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
            background-color: #f9fafb !important;
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
            margin-right: 5px;
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
        }
        .feedback-text {
            font-size: 15px;
            line-height: 1.6;
            color: #374151;
            margin: 0;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .feedback-empty {
            font-size: 14px;
            color: #9ca3af;
            font-style: italic;
        }
        .alert-card {
            background-color: #fef2f2 !important;
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
            background-color: #f9fafb !important;
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

        /* Mobile Responsive Styles */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
            }
            .content {
                padding: 20px 15px !important;
            }
            .header {
                padding: 15px !important;
            }
            .header h1 {
                font-size: 18px !important;
            }
            .subject-icon {
                display: none !important;
            }
            .subject-name {
                font-size: 14px !important;
            }
            .info-card {
                padding: 15px !important;
            }
            .feedback-card {
                padding: 15px !important;
            }
            .score-value {
                font-size: 20px !important;
            }
            .time-value {
                font-size: 16px !important;
            }
            /* Stack cards vertically on mobile */
            table[width="100%"] > tbody > tr > td[width="48%"] {
                width: 100% !important;
                display: block !important;
                margin-bottom: 15px !important;
            }
            table[width="100%"] > tbody > tr > td[width="4%"] {
                display: none !important;
            }
            /* Maintain card padding on mobile */
            .performance-card {
                padding: 15px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <!--[if gte mso 9]>
            <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:90px;">
            <v:fill type="gradient" color="#667eea" color2="#764ba2" angle="135" />
            <v:textbox style="mso-fit-shape-to-text:true" inset="0,0,0,0">
            <![endif]-->
            <div>
                <h1>${childName}'s Performance Report</h1>
                <p>${centerName}</p>
            </div>
            <!--[if gte mso 9]>
            </v:textbox>
            </v:rect>
            <![endif]-->
        </div>

        <div class="content">
            <div class="info-card">
                <div class="info-row">
                    <span class="info-value"><b>${formattedDate}</b></span>
                </div>
            </div>

            ${
              isFollowUpRequired
                ? `<div class="alert-card">
                <p>In-person follow-up required</p>
            </div>`
                : ''
            }

            <div>
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
                    <tr>
                        <!-- Mathematics Card -->
                        <td width="48%" style="vertical-align: top;">
                            <table width="100%" cellpadding="20" cellspacing="0" border="0" style="border: 2px solid #e5e7eb; border-top: 3px solid #3b82f6; border-radius: 12px; background-color: #ffffff;">
                                <tr>
                                    <td style="padding: 20px !important;">
                                        <!-- Subject Header -->
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 15px;">
                                            <tr>
                                                <td class="subject-icon math" style="width: 36px; height: 36px; background-color: #dbeafe; color: #3b82f6; border-radius: 8px; text-align: center; font-size: 16px; font-weight: bold; vertical-align: middle;">
                                                    M
                                                </td>
                                                <td style="padding-left: 10px; font-size: 16px; font-weight: 700; color: #1f2937; vertical-align: middle;">
                                                    Mathematics
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Score Row -->
                                        <table width="100%" cellpadding="12" cellspacing="0" border="0" style="border-bottom: 1px solid #f3f4f6;">
                                            <tr>
                                                <td style="font-size: 16px; color: #6b7280; font-weight: 500; width: 60px;">
                                                    Score:
                                                </td>
                                                <td style="text-align: right; font-size: 24px; font-weight: 700; color: ${mathScoreClass === 'success' ? '#10b981' : mathScoreClass === 'warning' ? '#f59e0b' : '#9ca3af'};">
                                                    ${formatScore(mathScore)}
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Time Row -->
                                        <table width="100%" cellpadding="12" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 16px; color: #6b7280; font-weight: 500; width: 60px;">
                                                    Time:
                                                </td>
                                                <td style="text-align: right; font-size: 18px; font-weight: 600; color: ${mathTimeClass === 'success' ? '#10b981' : mathTimeClass === 'warning' ? '#f59e0b' : '#9ca3af'};">
                                                    ${formatTime(mathTime)}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>

                        <!-- Spacer -->
                        <td width="4%"></td>

                        <!-- English Card -->
                        <td width="48%" style="vertical-align: top;">
                            <table width="100%" cellpadding="20" cellspacing="0" border="0" style="border: 2px solid #e5e7eb; border-top: 3px solid #8b5cf6; border-radius: 12px; background-color: #ffffff;">
                                <tr>
                                    <td style="padding: 20px !important;">
                                        <!-- Subject Header -->
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 15px;">
                                            <tr>
                                                <td class="subject-icon english" style="width: 36px; height: 36px; background-color: #ede9fe; color: #8b5cf6; border-radius: 8px; text-align: center; font-size: 16px; font-weight: bold; vertical-align: middle;">
                                                    E
                                                </td>
                                                <td style="padding-left: 10px; font-size: 16px; font-weight: 700; color: #1f2937; vertical-align: middle;">
                                                    English
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Score Row -->
                                        <table width="100%" cellpadding="12" cellspacing="0" border="0" style="border-bottom: 1px solid #f3f4f6;">
                                            <tr>
                                                <td style="font-size: 16px; color: #6b7280; font-weight: 500; width: 60px;">
                                                    Score:
                                                </td>
                                                <td style="text-align: right; font-size: 24px; font-weight: 700; color: ${englishScoreClass === 'success' ? '#10b981' : englishScoreClass === 'warning' ? '#f59e0b' : '#9ca3af'};">
                                                    ${formatScore(englishScore)}
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Time Row -->
                                        <table width="100%" cellpadding="12" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size: 16px; color: #6b7280; font-weight: 500; width: 60px;">
                                                    Time:
                                                </td>
                                                <td style="text-align: right; font-size: 18px; font-weight: 600; color: ${englishTimeClass === 'success' ? '#10b981' : englishTimeClass === 'warning' ? '#f59e0b' : '#9ca3af'};">
                                                    ${formatTime(englishTime)}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>

            ${
              feedbackText
                ? `<div class="feedback-card">
                <div class="feedback-header">
                    <div>
                        <span class="feedback-icon">&#128172;</span>
                        <span class="feedback-title">Instructor Feedback</span>
                    </div>
                    ${feedbackAuthor ? `<div class="feedback-author" style="margin-top: 5px;"><b>by ${feedbackAuthor}</b></div>` : ''}
                </div>
                <p class="feedback-text" style="white-space: pre-wrap; word-wrap: break-word;">${feedbackText.replace(/\n/g, '<br>')}</p>
            </div>`
                : ''
            }
        </div>
        <div class="footer">
            <p>Contact Us</p>
            ${centerPhone || centerEmail ? `<p style="margin-top: 10px;">
                ${centerPhone ? `<a href="tel:${centerPhone}">${centerPhone}</a>` : ''}
                ${centerPhone && centerEmail ? ' | ' : ''}
                ${centerEmail ? `<a href="mailto:${centerEmail}">${centerEmail}</a>` : ''}
            </p>` : ''}
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
    centerEmail,
    centerPhone,
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

  if (centerPhone || centerEmail) {
    text += `\n\nContact Us:`;
    if (centerPhone) text += `\nPhone: ${centerPhone}`;
    if (centerEmail) text += `\nEmail: ${centerEmail}`;
  }

  return text;
};
