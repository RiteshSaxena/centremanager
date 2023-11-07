/**
 * A set of functions called "actions" for `import-data`
 */
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import moment from 'moment';
import { createHash } from 'node:crypto';

export default {
  importData: async (ctx) => {
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

      console.log('Records Length ' + records.length);

      for (let i = 0; i < records.length; i++) {
        try {
          //Center
          const centreRegion = records[i][1].trim();
          const centreName = records[i][2].trim();
          let centerId: null | string | number = null;
          if (centreName && centreRegion) {
            const existingCenter = await strapi.entityService.findMany('api::center.center', {
              filters: { name: centreName, region: centreRegion },
              limit: 1,
            });

            if (existingCenter.length) {
              centerId = existingCenter[0].id;
            } else {
              console.log('Creating Center');
              const entry = await strapi.entityService.create('api::center.center', {
                data: {
                  name: centreName,
                  region: centreRegion,
                },
              });
              centerId = entry.id;
            }
          }

          //School
          const schoolName = records[i][19].trim();
          const schoolTownCity = records[i][20].trim();
          const schoolPostcode = records[i][21].trim();
          let schoolId: null | number | string = null;
          if (schoolName) {
            console.log('Creating School');
            const existingSchool = await strapi.entityService.findMany('api::school.school', {
              filters: { name: schoolName, city: schoolTownCity, postcode: schoolPostcode },
              limit: 1,
            });

            if (existingSchool.length) {
              schoolId = existingSchool[0].id;
            } else {
              const entry = await strapi.entityService.create('api::school.school', {
                data: { name: schoolName, city: schoolTownCity, postcode: schoolPostcode },
              });
              schoolId = entry.id;
            }
          }

          //Subjects
          const allSubjectsName = records[i][12].trim();
          const subjectNameArr = allSubjectsName.split(',');
          const childSubjects = [];
          for (let j = 0; j < subjectNameArr.length; j++) {
            const subjectName = subjectNameArr[j].trim();
            if (subjectName) {
              const existingSubject = await strapi.entityService.findMany('api::subject.subject', {
                filters: {
                  name: {
                    $eqi: subjectName,
                  },
                },
                limit: 1,
              });

              if (existingSubject.length) {
                childSubjects.push(existingSubject[0].id);
              } else {
                console.log('Creating Subject');
                const entry = await strapi.entityService.create('api::subject.subject', {
                  data: { name: subjectName },
                });
                childSubjects.push(entry.id);
              }
            }
          }

          //Parents
          const parentFirstName = records[i][13].trim();
          const parentLastName = records[i][14].trim();
          const parentEmail = records[i][15].trim().toLowerCase();
          const parentContactNumber = records[i][16];
          const parentMobileNumber = records[i][17];
          const parentNumber = (parentContactNumber ? parentContactNumber : parentMobileNumber)
            .trim()
            .replace(/^\s+|\s+$/g, '')
            .replace('+44', '');
          const parentPrimaryNumber = parentNumber.indexOf('0') == 0 ? parentNumber : '0' + parentNumber;

          let parentId: null | number | string = null;

          const existingParent = await strapi.entityService.findMany('api::parent.parent', {
            filters: {
              firstName: parentFirstName,
              email: parentEmail,
              contactNumber: parentPrimaryNumber,
              center: centerId as any,
            },
            limit: 1,
          });
          if (existingParent.length) {
            parentId = existingParent[0].id;
          } else {
            console.log('Creating Parent');
            const entry = await strapi.entityService.create('api::parent.parent', {
              data: {
                firstName: parentFirstName,
                lastName: parentLastName,
                email: parentEmail,
                contactNumber: parentPrimaryNumber,
                center: centerId,
              },
            });
            parentId = entry.id;
          }

          //Child
          const childFirstName = records[i][5].trim();
          const childLastName = records[i][6].trim();
          const childGender = records[i][7].trim();
          const childHouseNumber = records[i][8].trim();
          const childStreetName = records[i][9].trim();
          const childTownCity = records[i][10].trim();
          const childPostcode = records[i][11].trim();
          const schoolYear = records[i][18].trim();

          //Enquiry Status
          const statusChange1 = records[i][23].trim();
          let dateStatusChange1 = records[i][24].trim();
          dateStatusChange1 = dateStatusChange1 ? moment(dateStatusChange1, 'DD/MM/YYYY HH:mm').toDate() : null;
          //"DD MM YYYY hh:mm:ss"

          const statusChange2 = records[i][25].trim();
          let dateStatusChange2 = records[i][26].trim();
          dateStatusChange2 = dateStatusChange2 ? moment(dateStatusChange2, 'DD/MM/YYYY HH:mm').toDate() : null;

          const hashString = childFirstName + parentFirstName + parentEmail + parentPrimaryNumber;
          const md5hash = createHash('md5').update(hashString).digest('hex');

          const existingChild = await strapi.query('api::child.child').findOne({ where: { childHash: md5hash } });

          const child: any = {
            firstName: childFirstName,
            lastName: childLastName,
            houseNumber: childHouseNumber,
            streetName: childStreetName,
            childTownCity: childTownCity,
            postcode: childPostcode,
            schoolYear,
            childHash: md5hash,
            center: centerId,
            school: schoolId,
            subjects: childSubjects,
          };

          if (childGender) {
            child.gender = childGender;
          }

          let childId = null;
          if (existingChild) {
            if (existingChild.status === statusChange1 && statusChange2) {
              console.log(existingChild.statusLog);
              child.status = statusChange2;
              child.statusLog = existingChild.statusLog;
              child.statusLog.push({
                from: statusChange1,
                to: statusChange2,
                date: dateStatusChange2,
              });
            }

            console.log('Updating Child');
            const entry = await strapi.entityService.update('api::child.child', existingChild.id, {
              data: {
                ...child,
              },
            });
            childId = entry.id;
          } else {
            child.parents = [parentId];
            child.status = statusChange2 ? statusChange2 : statusChange1;
            if (!child.status) {
              child.status = 'New';
            }
            child.statusLog = [];
            if (statusChange1) {
              child.statusLog.push({
                to: statusChange1,
                date: dateStatusChange1,
              });
            }
            if (statusChange2) {
              child.statusLog.push({
                from: statusChange1,
                to: statusChange2,
                date: dateStatusChange2,
              });
            }

            console.log('Creating Child', child);
            const entry = await strapi.entityService.create('api::child.child', {
              data: {
                ...child,
              },
            });
            childId = entry.id;
          }

          //Enquiry
          const formType = records[i][3].trim();
          const referralCode = records[i][4].trim();
          const enquiryDate = moment(records[i][0].trim(), 'DD/MM/YYYY HH:mm').toDate();
          const notes = records[i][22].trim();

          const existingEnquiry = await strapi.entityService.findMany('api::enquiry.enquiry', {
            filters: {
              formType: formType,
              referralCode: referralCode,
              notes: notes,
              center: centerId as any,
              child: childId,
            },
            limit: 1,
          });

          if (!existingEnquiry.length) {
            console.log('Creating Enquiry');
            await strapi.query('api::enquiry.enquiry').create({
              data: {
                formType: formType,
                referralCode: referralCode,
                notes: notes,
                center: centerId,
                enquiryDate: enquiryDate,
                child: childId,
              },
            });
          }
          console.log('Record ' + (i + 1) + ' imported');
        } catch (err) {
          console.log('Error in record ' + (i + 1));
          console.log(err);
        }
      }

      return true;
    } catch (err) {
      console.log(err);
      console.log(err.stack);
      ctx.body = err;
    }
  },
};
