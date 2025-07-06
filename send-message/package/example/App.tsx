import React, { useState } from 'react';
import { Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import sendMessage from 'send-message';

export default function App() {
  const [isInstalled, setIsInstalled] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.group}>
        <Text style={styles.header}>SendMessage Native Functions Example</Text>
        <Button
          title="Send Mail"
          onPress={() =>
            sendMessage.sendMail(
              'test@example.com',
              'Test Subject',
              'This is the body of the email.',
              '/path/to/attachment.pdf',
            )
          }
        />
        <Button
          title="Send SMS"
          onPress={() =>
            sendMessage.sendSms(
              ['+1234567890'],
              'This is a test SMS message.',
              '/path/to/firstAttachment.jpg',
            )
          }
        />
        <Button
          title="Check if WhatsApp is Installed"
          onPress={async () => {
            const installed = await sendMessage.isAppInstalled('com.whatsapp');
            setIsInstalled(installed ? 'WhatsApp is installed' : 'WhatsApp is NOT installed');
          }}
        />
        <Text style={styles.result}>{isInstalled}</Text>
        <Button
          title="Send WhatsApp Message"
          onPress={() =>
            sendMessage.sendWhatsapp(
              '+1234567890',
              'This is a WhatsApp message.',
              '/path/to/attachment.pdf',
              '/path/to/audio.mp3',
              true,
            )
          }
        />
        <Button
          title="Send Telegram Message"
          onPress={() => sendMessage.sendTelegramMessage('username', 'This is a Telegram message.')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    margin: 20,
    textAlign: 'center',
  },
  group: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  result: {
    marginTop: 20,
    fontSize: 18,
    color: 'blue',
  },
});
