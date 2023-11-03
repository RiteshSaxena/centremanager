/**
 * A set of functions called "actions" for `import-data`
 */
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import { factories } from '@strapi/strapi';
import importData from '../routes/import-data';
import { createHash } from 'node:crypto';
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

      const csvFile = fs.readFileSync(ctx.request.files.file.path, 'utf-8');

      const records = parse(csvFile.trim(), {
        skip_empty_lines: true,
      });

      records.shift();

      const centrerArr = [];
      const schoolArr = [];
      const subjectArr = [];
      const childArr = [];
      const parentArr = [];

      console.log('Records Length ' + records.length);

      for (let i = 0; i < records.length; i++) {
        //Center
        const centreRegion = records[i][1].trim();
        const centreName = records[i][2].trim();
        if (centreName) {
          const center = { region: centreRegion, name: centreName };
          const existingCenter = centrerArr.some((obj) => {
            return Object.keys(obj).every((key) => obj.hasOwnProperty(key) && obj[key] === center[key]);
          });

          if (!existingCenter) {
            centrerArr.push(center);
          }
        }

        //School
        const schoolName = records[i][19].trim();
        const schoolTownCity = records[i][20].trim();
        const schoolPostcode = records[i][21].trim();
        if (schoolName) {
          const school = { name: schoolName, city: schoolTownCity, postcode: schoolPostcode };
          const existingSchool = schoolArr.some((obj) => {
            return Object.keys(obj).every((key) => obj.hasOwnProperty(key) && obj[key] === school[key]);
          });

          if (!existingSchool) {
            schoolArr.push(school);
          }
        }

        //Subjects
        const allSubjectsName = records[i][12].trim();
        const subjectNameArr = allSubjectsName.split(',');
        for (let j = 0; j < subjectNameArr.length; j++) {
          const subjectName = subjectNameArr[j].trim();
          if (subjectName) {
            const subject = { name: subjectName };
            const existingSubject = subjectArr.some((obj) => {
              return Object.keys(obj).every((key) => obj.hasOwnProperty(key) && obj[key] === subject[key]);
            });

            if (!existingSubject) {
              subjectArr.push(subject);
            }
          }
        }

        //Parents
        const parentFirstName = records[i][13].trim();
        const parentLastName = records[i][14].trim();
        const parentEmail = records[i][15].trim().toLowerCase();
        const parentContactNumber = records[i][16];
        const parentMobileNumber = records[i][17];

        //Child
        const childFirstName = records[i][5].trim();
        const childLastName = records[i][6].trim();
        const childGender = records[i][7].trim();
        const childHouseNumber = records[i][8].trim();
        const childStreetName = records[i][9].trim();
        const childTownCity = records[i][10].trim();
        const childPostcode = records[i][11].trim();
        const schoolYear = records[i][18].trim();

        //Enquiry
        const formType = records[i][3].trim();
        const referralCode = records[i][4].trim();
        const enquiryDate = records[i][0].trim();
        const notes = records[i][22].trim();

        //Enquiry Status
        const statusChange1 = records[i][23].trim();
        const dateStatusChange1 = records[i][24].trim();
        const statusChange2 = records[i][25];
        const dateStatusChange2 = records[i][26];

        if (
          childFirstName &&
          childFirstName.length > 0 &&
          parentFirstName &&
          parentEmail.length > 0 &&
          parentEmail &&
          parentEmail.length > 0 &&
          ((parentContactNumber && parentContactNumber.length > 0) ||
            (parentMobileNumber.length && parentMobileNumber.length > 0))
        ) {
          const contNumber = (parentContactNumber ? parentContactNumber : parentMobileNumber)
            .trim()
            .replace(/^\s+|\s+$/g, '')
            .replace('+44', '');
          var parentPrimaryNumber = contNumber.indexOf('0') == 0 ? contNumber.substring(1) : contNumber;

          const hashString = childFirstName + parentFirstName + parentEmail + parentPrimaryNumber;
          const mdHash = createHash('md5').update(hashString).digest('hex');

          const existingChild = childArr.some((obj) => {
            //return Object.keys(obj).every((key) => obj.hasOwnProperty(key) && obj[key] === school[key]);
            return obj['childHash'] === mdHash;
          });

          if (!existingChild) {
            const child = {
              firstName: childFirstName,
              lastName: childLastName,
              houseNumber: childHouseNumber,
              streetName: childStreetName,
              childTownCity: childTownCity,
              postcode: childPostcode,
              childHash: mdHash,
              schoolYear,
              status: statusChange2 ? statusChange2 : statusChange1,
              statusChange1,
              statusChange2,
              dateStatusChange1,
              dateStatusChange2,
              allSubjectsName: allSubjectsName,
              centre: {
                name: centreName,
                region: centreRegion,
              },
              school: { name: schoolName, city: schoolTownCity, postcode: schoolPostcode },
              parent: {
                firstName: parentFirstName,
                lastName: parentLastName,
                email: parentEmail,
                contactNumber: parentPrimaryNumber,
              },
              enquiry: {
                formType,
                referralCode,
                enquiryDate,
                notes,
              },
            };

            if (childGender) {
              child['gender'] = childGender;
            }

            if (!child.status) {
              child.status = 'New';
            }

            if (child.dateStatusChange1) {
              var dateParts = child.dateStatusChange1.split('/');
              child.dateStatusChange1 = dateParts[1] + '/' + dateParts[0] + '/' + dateParts[2];
            }

            if (child.dateStatusChange2) {
              var dateParts = child.dateStatusChange2.split('/');
              child.dateStatusChange2 = dateParts[1] + '/' + dateParts[0] + '/' + dateParts[2];
            }

            childArr.push(child);
          }
        }
      }

      for (let i = 0; i < centrerArr.length; i++) {
        const centre = centrerArr[i];

        const existingCenter = await strapi
          .query('api::center.center')
          .findOne({ where: { name: centre.name, region: centre.region } });

        if (!existingCenter) {
          await strapi.query('api::center.center').create({
            data: {
              name: centre.name,
              region: centre.region,
            },
          });
        }
      }

      for (let i = 0; i < schoolArr.length; i++) {
        const school = schoolArr[i];

        const existingSchool = await strapi
          .query('api::school.school')
          .findOne({ where: { name: school.name, city: school.city, postcode: school.postcode } });

        if (!existingSchool) {
          await strapi.query('api::school.school').create({
            data: { name: school.name, city: school.city, postcode: school.postcode },
          });
        }
      }

      for (let i = 0; i < subjectArr.length; i++) {
        const subject = subjectArr[i];

        const existingSubject = await strapi.query('api::subject.subject').findOne({ where: { name: subject.name } });

        if (!existingSubject) {
          await strapi.query('api::subject.subject').create({
            data: { name: subject.name },
          });
        }
      }

      console.log(`Total Childs are ${childArr.length}`);

      let centreId = '';
      for (let i = 0; i < childArr.length; i++) {
        const child = childArr[i];

        const existingChild = await strapi.query('api::child.child').findOne({ where: { childHash: child.childHash } });

        if (!existingChild) {
          let {
            firstName,
            lastName,
            gender,
            houseNumber,
            streetName,
            childTownCity,
            postcode,
            childHash,
            schoolYear,
            status,
          } = child;
          const newChild = {
            firstName,
            lastName,
            gender,
            houseNumber,
            streetName,
            childTownCity,
            postcode,
            childHash,
            schoolYear,
            status,
          };

          if (child.centre) {
            const existingCenter = await strapi
              .query('api::center.center')
              .findOne({ where: { name: child.centre.name, region: child.centre.region } });

            if (existingCenter) {
              newChild['center'] = existingCenter.id;
              centreId = existingCenter.id;
            }
          }

          if (child.allSubjectsName) {
            const subjectNameArr = child.allSubjectsName.split(',');
            if (subjectNameArr.length > 0) {
              newChild['subjects'] = [];
              for (let j = 0; j < subjectNameArr.length; j++) {
                const subjectName = subjectNameArr[j].trim();
                const existingSubject = await strapi
                  .query('api::subject.subject')
                  .findOne({ where: { name: subjectName } });
                if (existingSubject) {
                  newChild['subjects'].push(existingSubject.id);
                }
              }
            }
          }

          if (child.school) {
            const existingSchool = await strapi.query('api::school.school').findOne({
              where: { name: child.school.name, city: child.school.city, postcode: child.school.postcode },
            });

            if (existingSchool) {
              newChild['school'] = existingSchool.id;
            }
          }

          if (child.parent) {
            newChild['parents'] = [];
            let existingParent = await strapi.query('api::parent.parent').findOne({
              where: {
                firstName: child.parent.firstName,
                email: child.parent.email,
                contactNumber: child.parent.contactNumber,
              },
            });
            if (!existingParent) {
              existingParent = await strapi.query('api::parent.parent').create({
                data: {
                  firstName: child.parent.firstName,
                  lastName: child.parent.lastName,
                  email: child.parent.email,
                  contactNumber: child.parent.contactNumber,
                  center: centreId,
                },
              });
            }
            newChild['parents'].push(existingParent.id);
          }

          if (child.enquiry) {
            if (child.enquiry.enquiryDate) {
              var dateParts = child.enquiry.enquiryDate.split('/');
              child.enquiry.enquiryDate = new Date(dateParts[1] + '/' + dateParts[0] + '/' + dateParts[2]);
            }

            const newEnquiry = await strapi.query('api::enquiry.enquiry').create({
              data: {
                formType: child.enquiry.formType,
                referralCode: child.enquiry.referralCode,
                notes: child.enquiry.notes,
                center: centreId,
                enquiryDate: child.enquiry.enquiryDate,
              },
            });
            newChild['enquiry'] = newEnquiry.id;
          }

          if (child.statusChange2) {
            newChild['statusLog'] = [];
            newChild['statusLog'].push({
              from: child.statusChange1,
              to: child.statusChange2,
              date: new Date(child.dateStatusChange2),
            });
          }

          const result = await strapi.entityService.create('api::child.child', {
            data: newChild,
          });
        }
      }

      return true;
    } catch (err) {
      console.log(err);
      ctx.body = err;
    }
  },
};
