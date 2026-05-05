package {{PACKAGE_NAME}}

import android.app.Activity
import android.app.KeyguardManager
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView

class AlarmActivity : Activity() {

    companion object {
        private const val TAG = "AlarmActivity"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        Log.d(TAG, "⏰ AlarmActivity: onCreate")

        // Ensure the activity shows over the lockscreen and wakes the screen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
            keyguardManager.requestDismissKeyguard(this, null)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
            )
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS)

        setContentView(R.layout.activity_alarm)

        var titleText = "Alarm"
        var bodyText = "Wake up!"
        var alarmId = ""
        var mode = "solo"
        var tone = "default"
        var bufferMinutes = "5"
        var requestedAction: String? = null

        try {
            val extras = intent.extras
            if (extras != null) {
                // 1. Direct extras (from our AlarmService)
                titleText = extras.getString("title") ?: titleText
                bodyText = extras.getString("body") ?: bodyText
                alarmId = extras.getString("alarmId") ?: alarmId
                mode = extras.getString("mode") ?: mode
                tone = extras.getString("tone") ?: tone
                bufferMinutes = extras.getString("bufferMinutes") ?: bufferMinutes
                requestedAction = extras.getString("alarm_action")

                // 2. Notifee-specific extras (from Local Trigger notifications)
                if (extras.containsKey("notification")) {
                    Log.d(TAG, "📦 Detected Notifee notification payload")
                    val notifBundle = extras.getBundle("notification")
                    val dataBundle = notifBundle?.getBundle("data")
                    if (dataBundle != null) {
                        Log.d(TAG, "📦 Extracting data from Notifee bundle")
                        titleText = dataBundle.getString("title") ?: titleText
                        bodyText = dataBundle.getString("body") ?: bodyText
                        alarmId = dataBundle.getString("alarmId") ?: alarmId
                        mode = dataBundle.getString("mode") ?: mode
                        tone = dataBundle.getString("tone") ?: tone
                        bufferMinutes = dataBundle.getString("bufferMinutes") ?: bufferMinutes
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error parsing intent extras", e)
        }

        Log.d(TAG, "🏁 AlarmActivity: title=$titleText, mode=$mode, action=$requestedAction, buffer=$bufferMinutes")

        // If the activity was started directly with a dismiss or snooze action (from notification buttons)
        if (requestedAction == "dismiss-alarm" || requestedAction == "snooze-alarm") {
            Log.d(TAG, "⚡ Notification action received: $requestedAction")
            handleUserAction(requestedAction, alarmId, mode, tone, bufferMinutes, titleText, bodyText)
            return
        }

        // START the AlarmService to play sound/vibration if this is a fresh ringing
        startAlarmMedia(titleText, bodyText, alarmId, mode, tone, bufferMinutes)

        findViewById<TextView>(R.id.alarmTitle).text = titleText
        findViewById<TextView>(R.id.alarmBody).text = bodyText

        findViewById<Button>(R.id.dismissButton).setOnClickListener {
            Log.d(TAG, "🔘 Dismiss button clicked")
            handleUserAction("dismiss-alarm", alarmId, mode, tone, bufferMinutes, titleText, bodyText)
        }

        findViewById<Button>(R.id.snoozeButton).setOnClickListener {
            Log.d(TAG, "🔘 Snooze button clicked")
            handleUserAction("snooze-alarm", alarmId, mode, tone, bufferMinutes, titleText, bodyText)
        }
    }

    private fun startAlarmMedia(title: String, body: String, alarmId: String, mode: String, tone: String, bufferMinutes: String) {
        Log.d(TAG, "🎺 Starting AlarmService: tone=$tone")
        val serviceIntent = Intent(this, AlarmService::class.java).apply {
            putExtra("title", title)
            putExtra("body", body)
            putExtra("alarmId", alarmId)
            putExtra("mode", mode)
            putExtra("tone", tone)
            putExtra("bufferMinutes", bufferMinutes)
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent)
            } else {
                startService(serviceIntent)
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error starting AlarmService", e)
        }
    }

    private fun handleUserAction(action: String, alarmId: String, mode: String, tone: String, bufferMinutes: String, title: String, body: String) {
        cancelNotifications()
        launchMainApp(action, alarmId, mode, tone, bufferMinutes, title, body)
        finish()
    }

    private fun cancelNotifications() {
        Log.d(TAG, "🔕 Stopping AlarmService and cancelling notification")
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.cancelAll()

        // Stop the service by sending the STOP action
        val stopServiceIntent = Intent(this, AlarmService::class.java).apply {
            action = AlarmService.ACTION_STOP
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(stopServiceIntent)
            } else {
                startService(stopServiceIntent)
            }
            // Explicitly stop the service as well
            stopService(stopServiceIntent)
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error stopping AlarmService", e)
        }
    }

    private fun launchMainApp(action: String, alarmId: String, mode: String, tone: String, bufferMinutes: String, title: String, body: String) {
        Log.d(TAG, "🚀 Preparing app launch: action=$action, buffer=$bufferMinutes")
        
        // Save to SharedPreferences using COMMIT (synchronous) to ensure it's written before launch
        getSharedPreferences(AlarmLauncherModule.PREFS_NAME, 0)
            .edit()
            .putString(AlarmLauncherModule.KEY_ACTION, action)
            .putString(AlarmLauncherModule.KEY_ALARM_ID, alarmId)
            .putString(AlarmLauncherModule.KEY_MODE, mode)
            .putString("tone", tone)
            .putString("bufferMinutes", bufferMinutes)
            .putString(AlarmLauncherModule.KEY_TITLE, title)
            .putString(AlarmLauncherModule.KEY_BODY, body)
            .commit()

        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        if (launchIntent != null) {
            launchIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            launchIntent.putExtra("alarm_action", action)
            launchIntent.putExtra("alarmId", alarmId)
            launchIntent.putExtra("mode", mode)
            launchIntent.putExtra("tone", tone)
            launchIntent.putExtra("bufferMinutes", bufferMinutes)
            launchIntent.putExtra("title", title)
            launchIntent.putExtra("body", body)
            Log.d(TAG, "📦 Starting Main Activity")
            startActivity(launchIntent)
        } else {
            Log.e(TAG, "❌ Fatal: Could not find launch intent for $packageName")
        }
    }
}
