/**
 * A set of functions called "actions" for `import-data`
 */
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';

// [
//   "Enquiry Date",
//   "Kumon Region",
//   "Centre",
//   "Form Type (Origin)",
//   "Referral Code",
//   "Child Details: First Name",
//   "Child Details: Last Name",
//   "Child Details: Gender",
//   "Child Details: House number or name",
//   "Child Details: Street Name",
//   "Child Details: Town/City",
//   "Child Details: Postcode",
//   "Subjects",
//   "Parent/Guardian Details: First name",
//   "Parent/Guardian Details: Last name",
//   "Parent/Guardian Details: Email address",
//   "Parent/Guardian Details: Contact number",
//   "Parent/Guardian Details: Mobile phone number",
//   "School: School year",
//   "School: School",
//   "School: Town/City",
//   "School: Postcode",
//   "Notes",
//   "Status Change 1",
//   "Date Status Change 1",
//   "Status Change 2",
//   "Date Status Change 2"
// ],

export default {
  importData: async (ctx, next) => {
    try {

      if (!ctx.request.files || !ctx.request.files.file) {
        throw new Error('No file to upload');
      }

      if (ctx.request.files.file.length) {
        throw new Error('Only one file is allowed to upload');
      }

      if (ctx.request.files.file.type !== 'text/csv') {
        throw new Error('Only csv files are allowed to upload');
      }

      const csvFile = fs.readFileSync(ctx.request.files.file.path, 'utf-8')

      const records = parse(csvFile.trim(), {
        skip_empty_lines: true
      });

      records.shift();

      for (let i = 0; i < records.length; i++) {
        const enquiryDate = records[i][0];
        const centreRegion = records[i][1];
        const centreName = records[i][2];
        const formType = records[i][3];
        const referralCode = records[i][4];
        const childFirstName = records[i][5];
        const childLastName = records[i][6];
        const childGender = records[i][7];
        const childHouseNumber = records[i][8];
        const childStreetName = records[i][9];
        const childTownCity = records[i][10];
        const childPostcode = records[i][11];
        const subjects = records[i][12];
        const parentFirstName = records[i][13];
        const parentLastName = records[i][14];
        const parentEmail = records[i][15];
        const parentContactNumber = records[i][16];
        const parentMobileNumber = records[i][17];
        const schoolYear = records[i][18];
        const schoolName = records[i][19];
        const schoolTownCity = records[i][20];
        const schoolPostcode = records[i][21];
        const notes = records[i][22];
        const statusChange1 = records[i][23];
        const dateStatusChange1 = records[i][24];
        const statusChange2 = records[i][25];
        const dateStatusChange2 = records[i][26];
      }
      return records;
    } catch (err) {
      ctx.body = err;
    }
  }
};
