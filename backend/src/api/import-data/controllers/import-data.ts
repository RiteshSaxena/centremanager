/**
 * A set of functions called "actions" for `import-data`
 */
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import moment from 'moment';
import { createHash } from 'node:crypto';
import utils from '@strapi/utils';

const { ValidationError, ApplicationError } = utils.errors;

export default {
  importData: async (ctx) => {
    if (!ctx.request.files || !ctx.request.files.file) {
      throw new ValidationError('No file to upload');
    }

    if (ctx.request.files.file.length) {
      throw new ValidationError('Only one file is allowed to upload');
    }

    if (ctx.request.files.file.type !== 'text/csv') {
      throw new ValidationError('Only csv files are allowed to upload');
    }

    const csvFile = fs.readFileSync(ctx.request.files.file.path, 'utf-8');

    const records = parse(csvFile.trim(), {
      skip_empty_lines: true,
      columns: true,
    });

    console.log('Records Length ' + records.length);

    const center = await strapi.entityService.findMany('api::center.center', {
      limit: 1,
    });

    if (!center.length) {
      throw new ApplicationError('Center not found');
    }

    const latestDate = center[0].lastImportDate ? new Date(center[0].lastImportDate) : null;
    let newLatestDate = latestDate;
    console.log('Latest Date: ' + latestDate);

    for (let i = 0; i < records.length; i++) {
      try {
        //Child
        const childFirstName = records[i]['Child Details: First Name'].trim();
        const childLastName = records[i]['Child Details: Last Name'].trim();
        const childGender = records[i]['Child Details: Gender'].trim();
        const childHouseNumber = records[i]['Child Details: House number or name'].trim();
        const childStreetName = records[i]['Child Details: Street Name'].trim();
        const childTownCity = records[i]['Child Details: Town/City'].trim();
        const childPostcode = records[i]['Child Details: Postcode'].trim();
        const schoolYear = records[i]['School: School year'].trim();

        if (!childFirstName) {
          continue;
        }

        //Enquiry Status
        const statusChangeKeys = Object.keys(records[i]).filter((key) => key.startsWith('Status Change'));
        statusChangeKeys.sort();
        const statusLog = [];
        statusChangeKeys.forEach((key) => {
          const statusChange = records[i][key].trim();
          if (statusChange) {
            const statusChangeDate = records[i][`Date ${key}`].trim();
            const statusChangeDateObj = statusChangeDate ? moment(statusChangeDate, 'DD/MM/YYYY HH:mm').toDate() : null;
            statusLog.push({
              status: statusChange,
              date: statusChangeDateObj,
            });
          }
        });

        const enquiryDate = records[i]['Enquiry Date'].trim()
          ? moment(records[i]['Enquiry Date'].trim(), 'DD/MM/YYYY HH:mm').toDate()
          : null;

        let childLatestDate = null;
        if (statusLog.length) {
          childLatestDate = statusLog[statusLog.length - 1].date;
        } else {
          childLatestDate = enquiryDate;
        }

        if (childLatestDate <= latestDate) {
          console.log('Skipping Record ' + (i + 1), childLatestDate, latestDate);
          continue;
        }
        if (childLatestDate > newLatestDate) {
          newLatestDate = childLatestDate;
        }

        //School
        const schoolName = records[i]['School: School'].trim();
        const schoolTownCity = records[i]['School: Town/City'].trim();
        const schoolPostcode = records[i]['School: Postcode'].trim();
        let schoolId: null | number | string = null;
        if (schoolName) {
          const existingSchool = await strapi.entityService.findMany('api::school.school', {
            filters: { name: schoolName, city: schoolTownCity, postcode: schoolPostcode },
            limit: 1,
          });

          if (existingSchool.length) {
            schoolId = existingSchool[0].id;
          } else {
            console.log('Creating School');
            const entry = await strapi.entityService.create('api::school.school', {
              data: { name: schoolName, city: schoolTownCity, postcode: schoolPostcode },
            });
            schoolId = entry.id;
          }
        }

        //Subjects
        const allSubjectsName = records[i]['Subjects'].trim();
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
        const parentFirstName = records[i]['Parent/Guardian Details: First name'].trim();
        const parentLastName = records[i]['Parent/Guardian Details: Last name'].trim();
        const parentEmail = records[i]['Parent/Guardian Details: Email address'].trim().toLowerCase();
        const parentContactNumber = records[i]['Parent/Guardian Details: Contact number'];
        const parentMobileNumber = records[i]['Parent/Guardian Details: Mobile phone number'];
        let parentNumber = (parentContactNumber ? parentContactNumber : parentMobileNumber)
          .trim()
          .replace(/^\s+|\s+$/g, '')
          .replace('+44', '');

        if (parentNumber.startsWith('0')) {
          parentNumber = parentNumber.substring(1);
        }

        if (parentNumber) {
          parentNumber = '+44' + parentNumber;
        }

        let parentId: null | number | string = null;

        const existingParent = await strapi.entityService.findMany('api::parent.parent', {
          filters: {
            firstName: parentFirstName,
            email: parentEmail,
            contactNumber: parentNumber,
            center: center[0],
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
              contactNumber: parentNumber,
              center: center[0].id,
            },
          });
          parentId = entry.id;
        }

        const formType = records[i]['Form Type (Origin)'].trim();
        const referralCode = records[i]['Referral Code'].trim();
        const notes = records[i]['Notes'].trim();

        const hashString = childFirstName + parentFirstName + parentEmail + parentNumber;
        const md5hash = createHash('md5').update(hashString).digest('hex');

        const existingChild = await strapi.entityService.findMany('api::child.child', {
          filters: { childHash: md5hash },
          limit: 1,
        });

        const child: any = {
          firstName: childFirstName,
          lastName: childLastName,
          houseNumber: childHouseNumber,
          streetName: childStreetName,
          childTownCity: childTownCity,
          postcode: childPostcode,
          schoolYear,
          childHash: md5hash,
          center: center[0].id,
          school: schoolId,
          subjects: childSubjects,
          formType,
          referralCode,
          enquiryDate,
          notes,
        };

        if (childGender) {
          child.gender = childGender;
        }

        if (existingChild.length) {
          const pastStatues = statusLog.map((status) => status.status);
          const latestStatus = pastStatues.pop();
          if (pastStatues.includes(existingChild[0].status)) {
            child.status = latestStatus;
            child.statusLog = statusLog.map((status, index) => {
              if (index === 0) {
                return {
                  to: status.status,
                  date: status.date,
                };
              }
              return {
                from: statusLog[index - 1].status,
                to: status.status,
                date: status.date,
              };
            });
          }

          console.log('Updating Child');
          await strapi.entityService.update('api::child.child', existingChild[0].id, {
            data: {
              ...child,
            },
          });
        } else {
          child.parents = [parentId];
          child.status = statusLog[statusLog.length - 1].status;
          if (!child.status) {
            child.status = 'New';
          }
          child.statusLog = statusLog.map((status, index) => {
            if (index === 0) {
              return {
                to: status.status,
                date: status.date,
              };
            }
            return {
              from: statusLog[index - 1].status,
              to: status.status,
              date: status.date,
            };
          });

          console.log('Creating Child');
          await strapi.entityService.create('api::child.child', {
            data: {
              ...child,
            },
          });
        }

        console.log('Record ' + (i + 1) + ' imported');
      } catch (err) {
        console.log('Error in record ' + (i + 1));
        console.log(err);
      }
    }

    await strapi.entityService.update('api::center.center', center[0].id, {
      data: {
        lastImportDate: newLatestDate,
      },
    });

    return true;
  },
};
