export default {
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
