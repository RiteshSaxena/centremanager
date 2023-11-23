export default {
  async afterUpdate(event) {
    if (event.result && event.result.id) {
      if (event.result.statusLog && event.result.statusLog.length > 0) {
        const lastStatusLog = event.result.statusLog[event.result.statusLog.length - 1];
        if (lastStatusLog.to !== event.result.status) {
          event.result.statusLog.push({
            from: lastStatusLog.to,
            to: event.result.status,
            date: new Date(),
          });
          await strapi.entityService.update('api::child.child', event.result.id, {
            data: {
              statusLog: event.result.statusLog,
            },
          });
        }
      }
    }
  },
};
