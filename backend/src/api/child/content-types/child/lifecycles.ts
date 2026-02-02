import utils from '@strapi/utils';

const { ValidationError } = utils.errors;

export default {
  beforeCreate(event) {
    const { data } = event.params;
    if (!(typeof data.center === 'number' || data.center?.connect?.length)) {
      throw new ValidationError('Center is required');
    }
  },
  async afterUpdate(event) {
    if (event.result && event.result.documentId) {
      if (event.result.statusLog && event.result.statusLog.length > 0) {
        const lastStatusLog = event.result.statusLog[event.result.statusLog.length - 1];
        if (lastStatusLog.to !== event.result.status) {
          event.result.statusLog.push({
            from: lastStatusLog.to,
            to: event.result.status,
            date: new Date(),
          });
          await strapi.documents('api::child.child').update({
            documentId: event.result.documentId,
            data: {
              statusLog: event.result.statusLog,
            },
          });
        }
      }
    }
  },
};
