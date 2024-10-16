import Preacher from "./models/preacher.js";
import {
    Expo
} from "expo-server-sdk";
import i18n from "i18n";
import admin from 'firebase-admin';
import apn from 'apn';
import serviceAccount from './congregation-planner-firebase-adminsdk-9agxd-594e8a280e.json'

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})

const apnProvider = new apn.Provider({
    token: {
      key: './AuthKey_RK97HAB8TC.p8',
      keyId: 'RK97HAB8TC',
      teamId: '9V23KDCG5Z',
    },
    production: true // Set to true for production
});
// Initialize Expo SDK
const expo = new Expo();

// Function to add a push token to a user
async function addPushToken(userId, pushToken) {
    try {
        const user = await Preacher.findByIdAndUpdate(
            userId, {
                $addToSet: {
                    pushTokens: pushToken
                }
            }, {
                new: true
            }
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
            userId, {
                $pull: {
                    pushTokens: pushToken
                }
            }, {
                new: true
            }
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
async function sendNotificationToPreacher(userId, description, date, data = {}) {
    try {
        const user = await Preacher.findById(userId);
        if (user && user.pushTokens && user.pushTokens.length > 0) {
            const expoMessages = [];
            const fcmMessages = [];
            const apnsTokens = [];

            user.pushTokens.forEach(token => {
                const message = {
                    title: i18n.__("notificationTitle"),
                    body: `${i18n.__("notificationBodyPart1")} ${description} ${date.toLocaleDateString()}. ${i18n.__("notificationBodyPart2")}`,
                    data: {
                        ...data,
                        userId
                    },
                };

                if (Expo.isExpoPushToken(token)) {
                    expoMessages.push({
                        ...message,
                        to: token,
                        sound: 'default'
                    });
                } else if (token.length === 64) {
                    // APNs tokens are 64 characters long
                    apnsTokens.push(token);
                } else {
                    fcmMessages.push({
                        ...message,
                        token
                    });
                }
            });

            const results = await Promise.all([
                sendExpoNotifications(expoMessages),
                sendFCMNotifications(fcmMessages),
                sendAPNsNotifications(apnsTokens, message)
            ]);


            return results.flat();
        }

        return [];
    } catch (error) {
        console.error('Error sending notification:', error);
        throw error;
    }
}

async function sendExpoNotifications(messages) {
    if (messages.length === 0) return [];

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (let chunk of chunks) {
        try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            console.error('Error sending Expo notification chunk:', error);
        }
    }

    // Process the tickets
    const receiptIds = tickets.filter(ticket => ticket.id).map(ticket => ticket.id);
    const receipts = await expo.getPushNotificationReceiptsAsync(receiptIds);

    // Handle any errors
    for (let receiptId in receipts) {
        const {
            status,
            message,
            details
        } = receipts[receiptId];
        if (status === 'error') {
            console.error(`There was an error sending an Expo notification: ${message}`);
            if (details && details.error) {
                console.error(`The error code is ${details.error}`);
                if (details.error === 'DeviceNotRegistered') {
                    const invalidToken = messages.find(m => m.to === receiptId).to;
                    await removePushToken(userId, invalidToken);
                }
            }
        }
    }

    return tickets;
}

async function sendFCMNotifications(messages) {
    if (messages.length === 0) return [];

    const results = await Promise.all(messages.map(async (message) => {
        try {
            const result = await admin.messaging().send(message);
            return {
                id: result,
                status: 'ok'
            };
        } catch (error) {
            console.error('Error sending FCM notification:', error);
            if (error.code === 'messaging/registration-token-not-registered') {
                await removePushToken(message.data.userId, message.token);
            }
            return {
                error: error.code,
                status: 'error'
            };
        }
    }));

    return results;
}


async function sendAPNsNotifications(tokens, message) {
    if (tokens.length === 0) return [];

    const notification = new apn.Notification({
        alert: {
            title: message.title,
            body: message.body,
        },
        sound: 'default',
        payload: message.data,
    });

    const results = await Promise.all(tokens.map(async (token) => {
        try {
            const result = await apnProvider.send(notification, token);
            if (result.failed.length > 0) {
                console.error('Error sending APNs notification:', result.failed[0].response);
                if (result.failed[0].status === '410' || result.failed[0].status === '400') {
                    await removePushToken(message.data.userId, token);
                }
                return {
                    error: result.failed[0].response.reason,
                    status: 'error'
                };
            }
            return {
                id: result.sent[0].device,
                status: 'ok'
            };
        } catch (error) {
            console.error('Error sending APNs notification:', error);
            return {
                error: error.message,
                status: 'error'
            };
        }
    }));

    return results;
}


export {
    addPushToken,
    removePushToken,
    sendNotificationToPreacher
};