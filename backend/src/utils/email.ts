import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

const getTransporter = () => {
  const config: EmailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  };

  return nodemailer.createTransport(config);
};

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = getTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

interface FeedbackData {
  childName: string;
  mathScore?: number;
  englishScore?: number;
  mathTime?: string;
  englishTime?: string;
  feedback?: string;
  date: string;
  centerName: string;
}

const formatTime = (minutes: string | number | null): string => {
  if (!minutes) return 'N/A';
  const mins = typeof minutes === 'string' ? parseInt(minutes, 10) : minutes;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }
  return `${mins}m`;
};

export const generateFeedbackEmailHtml = (parentName: string, feedbacks: FeedbackData[]): string => {
  const feedbackRows = feedbacks
    .map(
      (f) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
          <strong>${f.childName}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">
          ${f.mathScore !== undefined && f.mathScore !== null ? f.mathScore : '-'}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">
          ${formatTime(f.mathTime)}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">
          ${f.englishScore !== undefined && f.englishScore !== null ? f.englishScore : '-'}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">
          ${formatTime(f.englishTime)}
        </td>
      </tr>
      ${
        f.feedback
          ? `<tr>
        <td colspan="5" style="padding: 12px; border-bottom: 1px solid #e0e0e0; background-color: #f9f9f9;">
          <em>Notes for ${f.childName}:</em> ${f.feedback}
        </td>
      </tr>`
          : ''
      }
    `
    )
    .join('');

  const centerName = feedbacks[0]?.centerName || 'Kumon Centre';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #0066cc; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Daily Learning Update</h1>
    <p style="color: #cce0ff; margin: 5px 0 0 0;">${centerName}</p>
  </div>

  <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
    <p>Dear ${parentName},</p>

    <p>Here is today's progress report for your child${feedbacks.length > 1 ? 'ren' : ''}:</p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #0066cc;">Student</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #0066cc;">Math Score</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #0066cc;">Math Time</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #0066cc;">English Score</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #0066cc;">English Time</th>
        </tr>
      </thead>
      <tbody>
        ${feedbackRows}
      </tbody>
    </table>

    <p style="color: #666; font-size: 14px;">
      Keep encouraging your child${feedbacks.length > 1 ? 'ren' : ''} to continue their learning journey!
    </p>

    <p>Best regards,<br><strong>${centerName}</strong></p>
  </div>

  <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none;">
    <p style="margin: 0; font-size: 12px; color: #666;">
      This is an automated message from your Kumon Centre.
    </p>
  </div>
</body>
</html>
  `;
};

export const generateFeedbackEmailText = (parentName: string, feedbacks: FeedbackData[]): string => {
  const centerName = feedbacks[0]?.centerName || 'Kumon Centre';

  const feedbackLines = feedbacks
    .map((f) => {
      let line = `\n${f.childName}:\n`;
      line += `  Math: Score ${f.mathScore ?? '-'}, Time ${formatTime(f.mathTime)}\n`;
      line += `  English: Score ${f.englishScore ?? '-'}, Time ${formatTime(f.englishTime)}`;
      if (f.feedback) {
        line += `\n  Notes: ${f.feedback}`;
      }
      return line;
    })
    .join('\n');

  return `
Daily Learning Update - ${centerName}

Dear ${parentName},

Here is today's progress report for your child${feedbacks.length > 1 ? 'ren' : ''}:
${feedbackLines}

Keep encouraging your child${feedbacks.length > 1 ? 'ren' : ''} to continue their learning journey!

Best regards,
${centerName}

---
This is an automated message from your Kumon Centre.
  `.trim();
};
