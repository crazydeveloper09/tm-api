import Preacher from "./models/preacher.js";
import { Expo } from "expo-server-sdk";
import i18n from "i18n";

// Initialize Expo SDK
const expo = new Expo();

// Function to add a push token to a user
async function addPushToken(userId, pushToken) {
  try {
    const user = await Preacher.findByIdAndUpdate(
      userId,
      { $addToSet: { pushTokens: pushToken } },
      { new: true }
    );
    if (!user) {
      throw new Error('Preacher not found');
    }
    return user;
  } catch (error) {
    console.error('Error adding push token:', error);
    throw error;
  }
}

// Function to remove a push token from a user
async function removePushToken(userId, pushToken) {
  try {
    const user = await Preacher.findByIdAndUpdate(
      userId,
      { $pull: { pushTokens: pushToken } },
      { new: true }
    );
    if (!user) {
      throw new Error('Preacher not found');
    }
    return user;
  } catch (error) {
    console.error('Error removing push token:', error);
    throw error;
  }
}

// Function to send notifications to a user (potentially multiple devices)
async function sendNotificationToPreacher(userId, description, date, data = {}) {
  try {
    const user = await Preacher.findById(userId);
    if (user && user.pushTokens.length > 0) {
          const messages = user.pushTokens.map(pushToken => ({
              to: pushToken,
              sound: 'default',
              title: i18n.__("notificationTitle"),
              body: `${i18n.__("notificationBodyPart1")} ${description} ${date.toLocaleDateString("pl-PL")}. ${i18n.__("notificationBodyPart2")}`,
              data: { ...data, userId },
            }));
    
        
            const chunks = expo.chunkPushNotifications(messages);
            const tickets = [];
        
            for (let chunk of chunks) {
              try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
              } catch (error) {
                console.error('Error sending notification chunk:', error);
              }
            }
        
            // Process the tickets
            const receiptIds = tickets
              .filter(ticket => ticket.id)
              .map(ticket => ticket.id);
        
            const receipts = await expo.getPushNotificationReceiptsAsync(receiptIds);
        
            // Handle any errors
            for (let receiptId in receipts) {
              const { status, message, details } = receipts[receiptId];
              if (status === 'error') {
                console.error(
                  `There was an error sending a notification: ${message}`
                );
                if (details && details.error) {
                  console.error(`The error code is ${details.error}`);
                  // You might want to remove invalid tokens here
                  if (details.error === 'DeviceNotRegistered') {
                    const invalidToken = messages.find(m => m.to === receiptId).to;
                    await removePushToken(userId, invalidToken);
                  }
                }
              }
            }
        
        
            return tickets;
    }

    return;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

export {
  addPushToken,
  removePushToken,
  sendNotificationToPreacher
};