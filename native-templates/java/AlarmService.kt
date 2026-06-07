package {{PACKAGE_NAME}}

import android.app.Notification
import android.app.NotificationChannel
import android.app.KeyguardManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log
import android.content.pm.ServiceInfo
import androidx.core.app.NotificationCompat

class AlarmService : Service() {

    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null

    companion object {
        private const val TAG = "AlarmService"
        private const val CHANNEL_ID = "daily-sync-alarm-v6"
        private const val NOTIFICATION_ID = 999
        const val ACTION_STOP = "STOP_ALARM_SERVICE"
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "⚡ onStartCommand: action=${intent?.action}")
        
        if (intent?.action == ACTION_STOP) {
            Log.d(TAG, "⏹️ Stopping AlarmService via ACTION_STOP")
            stopAlarmMedia()
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
            return START_NOT_STICKY
        }

        val title = intent?.getStringExtra("title") ?: "Alarm"
        val body = intent?.getStringExtra("body") ?: "Wake up!"
        val alarmId = intent?.getStringExtra("alarmId") ?: ""
        val mode = intent?.getStringExtra("mode") ?: "solo"
        val tone = intent?.getStringExtra("tone") ?: "default"
        val bufferMinutes = intent?.getStringExtra("bufferMinutes") ?: "5"
        val alarmNotes = intent?.getStringExtra("alarmNotes") ?: "[]"
        val snoozeNoteIndex = intent?.getStringExtra("snoozeNoteIndex") ?: "0"

        Log.d(TAG, "📢 AlarmService extras: alarmId=$alarmId, notes=$alarmNotes, index=$snoozeNoteIndex")
        Log.d(TAG, "📢 Triggering alarm: $title, tone: $tone, buffer: $bufferMinutes")
        showForegroundNotification(title, body, alarmId, mode, tone, bufferMinutes, alarmNotes, snoozeNoteIndex)
        startAlarmMedia(tone)

        return START_REDELIVER_INTENT
    }

    private fun showForegroundNotification(title: String, body: String, alarmId: String, mode: String, tone: String, bufferMinutes: String, alarmNotes: String, snoozeNoteIndex: String) {
        Log.d(TAG, "🛠️ Building notification for channel: $CHANNEL_ID")
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val enabled = notificationManager.areNotificationsEnabled()
            Log.d(TAG, "🔔 Notification permission enabled: $enabled")
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Log.d(TAG, "📺 Creating notification channel")
            val channel = NotificationChannel(
                CHANNEL_ID,
                "DailySync Alarm",
                NotificationManager.IMPORTANCE_MAX
            ).apply {
                setBypassDnd(true)
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
                enableLights(true)
                enableVibration(true)
                setSound(null, null)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        val fullScreenIntent = Intent(this, AlarmActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("title", title)
            putExtra("body", body)
            putExtra("alarmId", alarmId)
            putExtra("mode", mode)
            putExtra("tone", tone)
            putExtra("bufferMinutes", bufferMinutes)
            putExtra("alarmNotes", alarmNotes)
            putExtra("snoozeNoteIndex", snoozeNoteIndex)
            putExtra("title", title)
            putExtra("body", body)
        }
        val fullScreenPendingIntent = PendingIntent.getActivity(this, 0, fullScreenIntent, pendingIntentFlags)

        val dismissIntent = Intent(this, AlarmActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("alarm_action", "dismiss-alarm")
            putExtra("alarmId", alarmId)
            putExtra("mode", mode)
            putExtra("tone", tone)
            putExtra("bufferMinutes", bufferMinutes)
            putExtra("alarmNotes", alarmNotes)
            putExtra("snoozeNoteIndex", snoozeNoteIndex)
            putExtra("title", title)
            putExtra("body", body)
        }
        val dismissPendingIntent = PendingIntent.getActivity(this, 1, dismissIntent, pendingIntentFlags)

        val snoozeIntent = Intent(this, AlarmActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("alarm_action", "snooze-alarm")
            putExtra("alarmId", alarmId)
            putExtra("mode", mode)
            putExtra("tone", tone)
            putExtra("bufferMinutes", bufferMinutes)
            putExtra("alarmNotes", alarmNotes)
            putExtra("snoozeNoteIndex", snoozeNoteIndex)
            putExtra("title", title)
            putExtra("body", body)
        }
        val snoozePendingIntent = PendingIntent.getActivity(this, 2, snoozeIntent, pendingIntentFlags)

        val notificationIcon = resources.getIdentifier("notification_icon", "drawable", packageName)
        val finalIcon = if (notificationIcon != 0) notificationIcon else android.R.drawable.ic_lock_idle_alarm
        
        val notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(finalIcon)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(false)
            .setOngoing(true)
            .setSound(null)
            .setContentIntent(fullScreenPendingIntent)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Dismiss", dismissPendingIntent)
            .addAction(android.R.drawable.ic_menu_recent_history, "Snooze", snoozePendingIntent)

        val notification = notificationBuilder.build()

        notification.flags = notification.flags or
                Notification.FLAG_ONGOING_EVENT or
                Notification.FLAG_NO_CLEAR or
                Notification.FLAG_INSISTENT

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        // Always launch AlarmActivity directly (like a native clock app)
        // Whether locked or unlocked, the full-screen alarm UI should appear
        try {
            val activityIntent = Intent(this, AlarmActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("title", title)
                putExtra("body", body)
                putExtra("alarmId", alarmId)
                putExtra("mode", mode)
                putExtra("tone", tone)
                putExtra("bufferMinutes", bufferMinutes)
                putExtra("alarmNotes", alarmNotes)
                putExtra("snoozeNoteIndex", snoozeNoteIndex)
            }
            startActivity(activityIntent)
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to launch AlarmActivity", e)
        }
    }

    private fun isDeviceLocked(): Boolean {
        val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
        return keyguardManager.isKeyguardLocked
    }



    private fun startAlarmMedia(tone: String) {
        Log.d(TAG, "🎵 Initializing media for tone: $tone")
        
        stopAlarmMedia()

        try {
            mediaPlayer = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                isLooping = true
            }

            if (tone != "default") {
                val resId = resources.getIdentifier(tone, "raw", packageName)
                if (resId != 0) {
                    Log.d(TAG, "🎹 Playing custom raw resource: $tone (resId=$resId)")
                    val afd = resources.openRawResourceFd(resId)
                    mediaPlayer?.setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
                    afd.close()
                } else {
                    Log.d(TAG, "⚠️ Raw resource not found for tone: $tone, falling back to default")
                    loadDefaultAlarmSound()
                }
            } else {
                loadDefaultAlarmSound()
            }

            mediaPlayer?.prepare()
            mediaPlayer?.start()

            startVibration()
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error playing alarm sound", e)
        }
    }

    private fun startVibration() {
        try {
            vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as android.os.VibratorManager
                vibratorManager.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }

            if (vibrator?.hasVibrator() == true) {
                Log.d(TAG, "📳 Starting vibration")
                val pattern = longArrayOf(0, 500, 500)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator?.vibrate(pattern, 0)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error starting vibration", e)
        }
    }

    private fun stopAlarmMedia() {
        Log.d(TAG, "🔇 stopAlarmMedia called")
        try {
            mediaPlayer?.let {
                if (it.isPlaying) it.stop()
                it.release()
            }
            mediaPlayer = null
        } catch (e: Exception) {
            Log.e(TAG, "Error releasing media player", e)
        }
        try {
            vibrator?.cancel()
        } catch (e: Exception) {
            Log.e(TAG, "Error cancelling vibration", e)
        }
    }

    private fun loadDefaultAlarmSound() {
        val alarmUri: Uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
        
        Log.d(TAG, "🎹 Playing system default sound: $alarmUri")
        mediaPlayer?.setDataSource(applicationContext, alarmUri)
    }

    override fun onDestroy() {
        stopAlarmMedia()
        super.onDestroy()
    }
}
