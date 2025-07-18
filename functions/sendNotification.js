const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Cloud Function die wordt geactiveerd wanneer een nieuwe taak wordt aangemaakt
 * en een pushmelding stuurt naar de toegewezen gebruiker
 */
exports.sendTaskNotification = functions.firestore
  .document('todos/{todoId}')
  .onCreate(async (snapshot, context) => {
    try {
      const todoData = snapshot.data();
      const assignedUserId = todoData.assignedTo;
      const createdBy = todoData.createdBy;
      
      // Controleer of de taak is toegewezen aan een andere gebruiker dan de maker
      if (!assignedUserId || assignedUserId === createdBy) {
        console.log('Taak is niet toegewezen of is door dezelfde gebruiker aangemaakt');
        return null;
      }
      
      // Haal de gebruikersgegevens op
      const userDoc = await admin.firestore().collection('users').doc(assignedUserId).get();
      
      if (!userDoc.exists) {
        console.log('Gebruiker bestaat niet:', assignedUserId);
        return null;
      }
      
      const userData = userDoc.data();
      
      // Controleer of de gebruiker notificaties heeft ingeschakeld
      if (!userData.notificationsEnabled) {
        console.log('Gebruiker heeft notificaties uitgeschakeld:', assignedUserId);
        return null;
      }
      
      // Haal de FCM-tokens van de gebruiker op
      const fcmTokens = userData.fcmTokens || {};
      const tokens = Object.keys(fcmTokens).filter(token => fcmTokens[token] === true);
      
      if (tokens.length === 0) {
        console.log('Geen geldige FCM-tokens gevonden voor gebruiker:', assignedUserId);
        return null;
      }
      
      // Haal de naam van de maker op
      let creatorName = 'Een collega';
      if (createdBy) {
        const creatorDoc = await admin.firestore().collection('users').doc(createdBy).get();
        if (creatorDoc.exists) {
          creatorName = creatorDoc.data().name || 'Een collega';
        }
      }
      
      // Bericht opstellen
      const message = {
        notification: {
          title: 'Nieuwe taak toegewezen',
          body: `${creatorName} heeft je een nieuwe taak toegewezen: ${todoData.description}`
        },
        data: {
          todoId: context.params.todoId,
          url: '/dashboard/tasks',
          type: 'task_assigned'
        },
        tokens: tokens
      };
      
      // Stuur de pushmelding
      const response = await admin.messaging().sendMulticast(message);
      console.log('Notificaties verzonden:', response.successCount, 'succesvol,', response.failureCount, 'mislukt');
      
      // Verwerk mislukte berichten
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });
        
        console.log('Lijst van mislukte tokens:', failedTokens);
        
        // Verwijder ongeldige tokens
        const updates = {};
        failedTokens.forEach(token => {
          updates[`fcmTokens.${token}`] = false;
        });
        
        if (Object.keys(updates).length > 0) {
          await admin.firestore().collection('users').doc(assignedUserId).update(updates);
          console.log('Ongeldige tokens verwijderd');
        }
      }
      
      return { success: true, sent: response.successCount };
    } catch (error) {
      console.error('Fout bij verzenden van notificatie:', error);
      return { error: error.message };
    }
  });

/**
 * Cloud Function die wordt geactiveerd wanneer een werkbon status wordt bijgewerkt
 * en een pushmelding stuurt naar de eigenaar van de werkbon
 */
exports.sendWorkOrderStatusNotification = functions.firestore
  .document('workOrders/{workOrderId}')
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      
      // Controleer of de status is gewijzigd
      if (beforeData.status === afterData.status) {
        console.log('Werkbon status is niet gewijzigd');
        return null;
      }
      
      const userId = afterData.userId;
      
      if (!userId) {
        console.log('Geen gebruiker gekoppeld aan werkbon');
        return null;
      }
      
      // Haal de gebruikersgegevens op
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        console.log('Gebruiker bestaat niet:', userId);
        return null;
      }
      
      const userData = userDoc.data();
      
      // Controleer of de gebruiker notificaties heeft ingeschakeld
      if (!userData.notificationsEnabled) {
        console.log('Gebruiker heeft notificaties uitgeschakeld:', userId);
        return null;
      }
      
      // Haal de FCM-tokens van de gebruiker op
      const fcmTokens = userData.fcmTokens || {};
      const tokens = Object.keys(fcmTokens).filter(token => fcmTokens[token] === true);
      
      if (tokens.length === 0) {
        console.log('Geen geldige FCM-tokens gevonden voor gebruiker:', userId);
        return null;
      }
      
      // Bepaal het bericht op basis van de nieuwe status
      let title = 'Werkbon status bijgewerkt';
      let body = 'De status van je werkbon is bijgewerkt.';

      switch (afterData.status) {
        case 'draft':
          // Only send notification if status was changed from a different status to draft
          if (beforeData.status !== 'draft') {
            title = 'Werkbon teruggezet naar concept';
            body = 'Je werkbon is teruggezet naar concept status en vereist je aandacht.';
          } else {
            // If it was already draft, don't send a notification
            console.log('Werkbon was al in concept status, geen notificatie verzonden');
            return null;
          }
          break;
        case 'ready_to_send':
          title = 'Werkbon gecontroleerd';
          body = 'Je werkbon is gecontroleerd en klaar om verzonden te worden.';
          break;
        case 'sent':
          title = 'Werkbon verzonden';
          body = 'Je werkbon is succesvol verzonden.';
          break;
        case 'processed':
          title = 'Werkbon verwerkt';
          body = 'Je werkbon is volledig verwerkt.';
          break;
      }
      
      // Bericht opstellen
      const message = {
        notification: {
          title: title,
          body: body
        },
        data: {
          workOrderId: context.params.workOrderId,
          url: '/dashboard/werkbonnen',
          type: 'workorder_status_changed',
          status: afterData.status
        },
        tokens: tokens
      };
      
      // Stuur de pushmelding
      const response = await admin.messaging().sendMulticast(message);
      console.log('Notificaties verzonden:', response.successCount, 'succesvol,', response.failureCount, 'mislukt');
      
      // Verwerk mislukte berichten
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });
        
        console.log('Lijst van mislukte tokens:', failedTokens);
        
        // Verwijder ongeldige tokens
        const updates = {};
        failedTokens.forEach(token => {
          updates[`fcmTokens.${token}`] = false;
        });
        
        if (Object.keys(updates).length > 0) {
          await admin.firestore().collection('users').doc(userId).update(updates);
          console.log('Ongeldige tokens verwijderd');
        }
      }
      
      return { success: true, sent: response.successCount };
    } catch (error) {
      console.error('Fout bij verzenden van notificatie:', error);
      return { error: error.message };
    }
  });

/**
 * Cloud Function die wordt geactiveerd wanneer een nieuwsbericht met hoge prioriteit wordt aangemaakt
 * en een pushmelding stuurt naar alle gebruikers
 */
exports.sendHighPriorityNewsNotification = functions.firestore
  .document('news/{newsId}')
  .onCreate(async (snapshot, context) => {
    try {
      const newsData = snapshot.data();
      
      // Controleer of het nieuwsbericht hoge prioriteit heeft
      if (newsData.priority !== 'high') {
        console.log('Nieuwsbericht heeft geen hoge prioriteit');
        return null;
      }
      
      // Haal alle gebruikers op die notificaties hebben ingeschakeld
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where('notificationsEnabled', '==', true)
        .get();
      
      if (usersSnapshot.empty) {
        console.log('Geen gebruikers met ingeschakelde notificaties gevonden');
        return null;
      }
      
      // Verzamel alle geldige tokens
      const tokens = [];
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        const fcmTokens = userData.fcmTokens || {};
        
        Object.entries(fcmTokens).forEach(([token, isActive]) => {
          if (isActive) {
            tokens.push(token);
          }
        });
      });
      
      if (tokens.length === 0) {
        console.log('Geen geldige FCM-tokens gevonden');
        return null;
      }
      
      // Bericht opstellen
      const message = {
        notification: {
          title: 'Belangrijk bericht',
          body: newsData.title
        },
        data: {
          newsId: context.params.newsId,
          url: '/dashboard',
          type: 'high_priority_news'
        },
        tokens: tokens
      };
      
      // Stuur de pushmelding
      const response = await admin.messaging().sendMulticast(message);
      console.log('Notificaties verzonden:', response.successCount, 'succesvol,', response.failureCount, 'mislukt');
      
      return { success: true, sent: response.successCount };
    } catch (error) {
      console.error('Fout bij verzenden van notificatie:', error);
      return { error: error.message };
    }
  });