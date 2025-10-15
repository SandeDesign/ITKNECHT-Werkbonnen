# Firebase Cloud Messaging Setup Guide

Deze handleiding helpt je om Firebase Cloud Messaging (FCM) te configureren voor push notificaties in de IT Knecht applicatie.

## Overzicht

De applicatie gebruikt Firebase Cloud Messaging om push notificaties te versturen naar gebruikers, zowel op desktop browsers als op mobiele apparaten wanneer de PWA geïnstalleerd is. De notificaties worden beheerd via Supabase en verzonden via een Supabase Edge Function.

## Vereisten

- Een Firebase project (al aanwezig: `it-knecht`)
- Toegang tot de Firebase Console
- Toegang tot de Supabase Dashboard voor het project

## Stap 1: Firebase Console - FCM Server Key

1. **Login op Firebase Console**
   - Ga naar [https://console.firebase.google.com](https://console.firebase.google.com)
   - Selecteer je project: `it-knecht`

2. **Navigeer naar Project Settings**
   - Klik op het tandwiel icoon (⚙️) naast "Project Overview"
   - Selecteer "Project settings"

3. **Open Cloud Messaging Tab**
   - Klik op de "Cloud Messaging" tab

4. **Verkrijg Server Key**
   - Scroll naar beneden naar "Cloud Messaging API (Legacy)"
   - Als de API nog niet is ingeschakeld:
     - Klik op de drie puntjes (...) naast "Cloud Messaging API (Legacy)"
     - Klik op "Manage API in Google Cloud Console"
     - Klik op "Enable" om de API in te schakelen
   - Kopieer de **Server key** (dit is een lange string die begint met `AAAA...`)
   - Bewaar deze key veilig - je hebt hem nodig voor de Supabase configuratie

## Stap 2: Firebase Console - VAPID Key (Verificatie)

De VAPID key is al geconfigureerd in de applicatie, maar het is belangrijk om te verifiëren dat deze correct is:

1. **Controleer Web Push Certificates**
   - Blijf in de "Cloud Messaging" tab
   - Scroll naar "Web Push certificates"
   - Controleer of er een key pair bestaat

2. **Huidige VAPID Key in de Code**
   ```
   BO2CnzWnp-XxTjp4EgaLh1xygtdB96kkFW3KGs6RlAe4hNZZhHoYYA_YbJisTeW54YSWhw1__vUNp1oCWnY5ysM
   ```
   - Deze staat in: `src/services/NotificationService.ts`
   - Verifieer dat deze overeenkomt met de key in Firebase Console
   - Als deze niet overeenkomt, kopieer de nieuwe key en update deze in de code

## Stap 3: Supabase Dashboard - Environment Variables

Nu moet je de FCM Server Key toevoegen aan Supabase zodat de Edge Function deze kan gebruiken.

1. **Login op Supabase Dashboard**
   - Ga naar [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecteer je IT Knecht project

2. **Navigeer naar Edge Functions Secrets**
   - Klik in het linker menu op "Edge Functions"
   - Klik op het tabblad "Secrets" bovenaan

3. **Voeg FCM_SERVER_KEY toe**
   - Klik op "Add new secret"
   - Name: `FCM_SERVER_KEY`
   - Value: [Plak hier de Server Key die je hebt gekopieerd in Stap 1]
   - Klik op "Add secret"

## Stap 4: Test de Configuratie

### 4.1 Test via Firebase Console

1. **Ga naar Cloud Messaging**
   - In Firebase Console, ga naar "Cloud Messaging"
   - Klik op "Send your first message"

2. **Stel Test Bericht In**
   - Notification title: "Test Notificatie"
   - Notification text: "Dit is een test vanuit Firebase"
   - Klik op "Send test message"

3. **Verkrijg FCM Token**
   - Open de IT Knecht applicatie in je browser
   - Open de browser console (F12)
   - Zoek naar logs die beginnen met "FCM token received:"
   - Kopieer het token (lange string)
   - Plak dit in het "Add an FCM registration token" veld in Firebase Console
   - Klik op het + icoon om het token toe te voegen
   - Klik op "Test"

4. **Verificatie**
   - Je zou een notificatie moeten ontvangen in de browser
   - Als je de notificatie ontvangt, werkt FCM correct!

### 4.2 Test via Applicatie

1. **Enable Notificaties in de App**
   - Login in de IT Knecht applicatie
   - Ga naar Settings (Instellingen)
   - Enable "Push notificaties"
   - Geef toestemming wanneer de browser erom vraagt

2. **Test met Admin Account**
   - Login als admin gebruiker
   - Maak een nieuwe taak aan en wijs deze toe aan een medewerker
   - De medewerker zou een notificatie moeten ontvangen

3. **Test met Taak Voltooiing**
   - Login als medewerker
   - Voltooi een taak vanuit de agenda
   - Admin gebruikers zouden een notificatie moeten ontvangen

## Stap 5: PWA Installatie Testen

### iOS (Safari)

1. **Open de App in Safari**
   - Ga naar je IT Knecht URL in Safari op iOS

2. **Voeg toe aan Home Screen**
   - Tik op het Share icoon (vierkant met pijl omhoog)
   - Scroll naar beneden en tik op "Add to Home Screen"
   - Tik op "Add"

3. **Test Notificaties**
   - Open de app vanaf je home screen
   - Enable notificaties in de app settings
   - Test of je notificaties ontvangt wanneer de app gesloten is

**Let op**: iOS Safari heeft beperkingen voor web push notifications. Push notifications werken alleen wanneer:
- De PWA is geïnstalleerd op het home screen
- De gebruiker heeft toestemming gegeven
- iOS 16.4 of hoger is geïnstalleerd

### Android (Chrome)

1. **Open de App in Chrome**
   - Ga naar je IT Knecht URL in Chrome op Android

2. **Installeer de PWA**
   - Chrome zal automatisch een "Add to Home screen" prompt tonen
   - Of tik op het menu (drie puntjes) en selecteer "Add to Home screen"
   - Tik op "Add"

3. **Test Notificaties**
   - Open de app vanaf je home screen
   - Enable notificaties in de app settings
   - Test of je notificaties ontvangt wanneer de app gesloten is

### Desktop (Chrome/Edge)

1. **Open de App in Chrome of Edge**
   - Ga naar je IT Knecht URL

2. **Installeer de PWA**
   - Klik op het installatie icoon in de adresbalk (computer icoon met pijl)
   - Of ga naar menu → "Install IT Knecht"
   - Klik op "Install"

3. **Test Notificaties**
   - Open de geïnstalleerde app
   - Enable notificaties in de app settings
   - Test of je notificaties ontvangt wanneer de app gesloten is

## Troubleshooting

### Geen Notificaties Ontvangen

1. **Controleer Browser Console**
   - Open Developer Tools (F12)
   - Kijk naar de Console tab voor error messages
   - Zoek naar logs die beginnen met "🔔" of "[service-worker]"

2. **Verifieer FCM Token**
   - In de console, controleer of je een "FCM token received:" bericht ziet
   - Als je geen token ziet, controleer of:
     - De VAPID key correct is
     - Notificatie permissies zijn toegestaan
     - Service Worker correct is geregistreerd

3. **Controleer Supabase Edge Function**
   - Ga naar Supabase Dashboard → Edge Functions
   - Klik op "send-fcm-notification"
   - Controleer de logs voor errors
   - Verifieer dat FCM_SERVER_KEY secret correct is ingesteld

4. **Controleer Firebase Quota**
   - Ga naar Firebase Console → Cloud Messaging
   - Controleer of je niet over je quota heen bent

### Service Worker Registratie Problemen

1. **Clear Service Worker**
   - Open Developer Tools (F12)
   - Ga naar Application tab (Chrome) of Storage tab (Firefox)
   - Klik op "Service Workers" in het linker menu
   - Klik op "Unregister" naast de service worker
   - Refresh de pagina

2. **Clear Cache**
   - In dezelfde Application/Storage tab
   - Klik op "Clear storage"
   - Klik op "Clear site data"
   - Refresh de pagina

### PWA Installatie Problemen

1. **iOS Safari**
   - Controleer iOS versie (minimum 16.4 voor web push)
   - Verifieer dat manifest.json correct is
   - Check of icons correct worden geladen

2. **Android Chrome**
   - Controleer of de site HTTPS gebruikt
   - Verifieer manifest.json
   - Check Service Worker registratie

## Notificatie Types en Voorkeuren

De applicatie ondersteunt verschillende notificatie types die gebruikers kunnen in/uitschakelen:

### Voor Medewerkers
- **TASK_ASSIGNED**: Nieuwe taak toegewezen
- **TASK_UPDATED**: Taak geüpdatet
- **TASK_DUE_SOON**: Taak verloopt binnenkort
- **SYSTEM**: Systeemberichten

### Voor Admins (extra types)
- **TASK_COMPLETED**: Medewerker heeft taak voltooid
- **USER_REGISTERED**: Nieuwe gebruiker geregistreerd
- **WORKORDER_CREATED**: Nieuwe werkorder aangemaakt

Gebruikers kunnen deze voorkeuren aanpassen in: **Settings → Notificaties**

## Security Considerations

1. **Never Commit Secrets**
   - De FCM Server Key moet ALLEEN in Supabase secrets staan
   - Commit deze NOOIT in de code
   - Gebruik environment variables voor gevoelige data

2. **VAPID Key**
   - De VAPID public key kan veilig in de frontend code
   - De private key moet altijd geheim blijven

3. **Token Management**
   - Tokens worden automatisch vernieuwd
   - Oude/inactieve tokens worden na 90 dagen verwijderd
   - Gebruikers kunnen tokens intrekken via settings

## Monitoring

### Firebase Console

1. **Cloud Messaging Dashboard**
   - Bekijk verzonden berichten
   - Check success/failure rates
   - Monitor actieve devices

### Supabase Dashboard

1. **Edge Function Logs**
   - Bekijk logs voor send-fcm-notification functie
   - Check voor errors in verzending
   - Monitor response times

2. **Database Monitoring**
   - Query `fcm_devices` tabel voor actieve devices
   - Query `notifications` tabel voor verzonden notificaties
   - Check `notification_preferences` voor gebruiker voorkeuren

## Support

Voor vragen of problemen:
1. Check de browser console voor errors
2. Bekijk Supabase Edge Function logs
3. Controleer Firebase Console voor quota en errors
4. Verifieer dat alle secrets correct zijn ingesteld

## Useful Queries

### Actieve Devices per Gebruiker
```sql
SELECT user_id, device_type, device_name, last_used
FROM fcm_devices
WHERE is_active = true
ORDER BY last_used DESC;
```

### Notificatie Statistieken
```sql
SELECT type, COUNT(*) as count,
       SUM(CASE WHEN read THEN 1 ELSE 0 END) as read_count
FROM notifications
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY type;
```

### Test Notification Verzenden
```sql
SELECT create_notification_with_preferences(
  'user-id-here',
  'SYSTEM',
  'Test Notificatie',
  'Dit is een test notificatie',
  '{}'::jsonb,
  '/dashboard'
);
```

---

**Laatste Update**: 2025-10-15
**Versie**: 1.0
