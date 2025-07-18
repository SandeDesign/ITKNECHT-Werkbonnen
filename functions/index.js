const taskNotifications = require('./sendNotification');

// Exporteer alle functies
exports.sendTaskNotification = taskNotifications.sendTaskNotification;
exports.sendWorkOrderStatusNotification = taskNotifications.sendWorkOrderStatusNotification;
exports.sendHighPriorityNewsNotification = taskNotifications.sendHighPriorityNewsNotification;