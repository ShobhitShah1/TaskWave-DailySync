package {{PACKAGE_NAME}}

import android.app.Activity
import android.app.KeyguardManager
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.widget.TextView

class AlarmActivity : Activity() {

    companion object {
        private const val TAG = "AlarmActivity"
        private const val AUTO_SNOOZE_DELAY_MS = 60_000L
        private const val ALARM_NOTIFICATION_ID = 999
        private const val MAIN_APP_LAUNCH_FINISH_DELAY_MS = 350L
    }

    private val autoSnoozeHandler = Handler(Looper.getMainLooper())
    private var actionHandled = false
    private var currentTitle = "Alarm"
    private var currentBody = ""
    private var currentAlarmId = ""
    private var currentMode = "solo"
    private var currentTone = "default"
    private var currentBufferMinutes = "5"
    private var currentAlarmNotes = "[]"
    private var currentSnoozeNoteIndex = "0"
    private val autoSnoozeRunnable = Runnable {
        if (!actionHandled && currentAlarmId.isNotBlank()) {
            handleUserAction(
                "snooze-alarm",
                currentAlarmId,
                currentMode,
                currentTone,
                currentBufferMinutes,
                currentTitle,
                currentBody,
                currentAlarmNotes,
                currentSnoozeNoteIndex
            )
        }
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
        var bodyText = ""
        var alarmId = ""
        var mode = "solo"
        var tone = "default"
        var bufferMinutes = "5"
        var alarmNotes = "[]"
        var snoozeNoteIndex = "0"
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
                alarmNotes = extras.getString("alarmNotes") ?: "[]"
                snoozeNoteIndex = extras.getString("snoozeNoteIndex") ?: "0"
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
                        alarmNotes = dataBundle.getString("alarmNotes") ?: alarmNotes
                        snoozeNoteIndex = dataBundle.getString("snoozeNoteIndex") ?: snoozeNoteIndex
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error parsing intent extras", e)
        }

        Log.d(TAG, "🏁 AlarmActivity: title=$titleText, mode=$mode, action=$requestedAction, buffer=$bufferMinutes, notes=$alarmNotes, index=$snoozeNoteIndex")

        currentTitle = titleText
        currentBody = bodyText
        currentAlarmId = alarmId
        currentMode = mode
        currentTone = tone
        currentBufferMinutes = bufferMinutes
        currentAlarmNotes = alarmNotes
        currentSnoozeNoteIndex = snoozeNoteIndex

        // If the activity was started directly with a dismiss or snooze action (from notification buttons)
        if (requestedAction == "dismiss-alarm" || requestedAction == "snooze-alarm") {
            Log.d(TAG, "⚡ Notification action received: $requestedAction")
            handleUserAction(requestedAction, alarmId, mode, tone, bufferMinutes, titleText, bodyText, alarmNotes, snoozeNoteIndex)
            return
        }

        // START the AlarmService to play sound/vibration if this is a fresh ringing
        startAlarmMedia(titleText, bodyText, alarmId, mode, tone, bufferMinutes, alarmNotes, snoozeNoteIndex)
        scheduleAutoSnooze()

        findViewById<TextView>(R.id.alarmTitle).text = titleText
        val bodyView = findViewById<TextView>(R.id.alarmBody)
        if (bodyText.isBlank() || bodyText == "Wake up!") {
            bodyView.visibility = View.GONE
        } else {
            bodyView.text = bodyText
            bodyView.visibility = View.VISIBLE
        }

        findViewById<View>(R.id.dismissButton).setOnClickListener {
            Log.d(TAG, "🔘 Dismiss button clicked")
            handleUserAction("dismiss-alarm", alarmId, mode, tone, bufferMinutes, titleText, bodyText, alarmNotes, snoozeNoteIndex)
        }

        findViewById<View>(R.id.snoozeButton).setOnClickListener {
            Log.d(TAG, "🔘 Snooze button clicked")
            handleUserAction("snooze-alarm", alarmId, mode, tone, bufferMinutes, titleText, bodyText, alarmNotes, snoozeNoteIndex)
        }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        Log.d(TAG, "⏰ AlarmActivity: onNewIntent")

        try {
            val extras = intent?.extras
            if (extras != null) {
                val requestedAction = extras.getString("alarm_action")
                if (requestedAction == "dismiss-alarm" || requestedAction == "snooze-alarm") {
                    Log.d(TAG, "⚡ Notification action received in onNewIntent: $requestedAction")
                    
                    val titleText = extras.getString("title") ?: "Alarm"
                    val bodyText = extras.getString("body") ?: ""
                    val alarmId = extras.getString("alarmId") ?: ""
                    val mode = extras.getString("mode") ?: "solo"
                    val tone = extras.getString("tone") ?: "default"
                    val bufferMinutes = extras.getString("bufferMinutes") ?: "5"
                    val alarmNotes = extras.getString("alarmNotes") ?: "[]"
                    val snoozeNoteIndex = extras.getString("snoozeNoteIndex") ?: "0"
                    Log.d(TAG, "⚡ Action: $requestedAction, notes: $alarmNotes, index: $snoozeNoteIndex")
                    currentTitle = titleText
                    currentBody = bodyText
                    currentAlarmId = alarmId
                    currentMode = mode
                    currentTone = tone
                    currentBufferMinutes = bufferMinutes
                    currentAlarmNotes = alarmNotes
                    currentSnoozeNoteIndex = snoozeNoteIndex
                    handleUserAction(requestedAction, alarmId, mode, tone, bufferMinutes, titleText, bodyText, alarmNotes, snoozeNoteIndex)
                } else {
                    val alarmId = extras.getString("alarmId") ?: ""
                    if (alarmId.isNotBlank() && alarmId == currentAlarmId) {
                        cancelAlarmNotificationOnly()
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error parsing intent extras in onNewIntent", e)
        }
    }

    private fun startAlarmMedia(title: String, body: String, alarmId: String, mode: String, tone: String, bufferMinutes: String, alarmNotes: String, snoozeNoteIndex: String) {
        Log.d(TAG, "🎺 Starting AlarmService: tone=$tone")

        if (AlarmLauncherModule.isAlarmLaunchSuppressed(this, alarmId)) {
            return
        }

        val serviceIntent = Intent(this, AlarmService::class.java).apply {
            putExtra("title", title)
            putExtra("body", body)
            putExtra("alarmId", alarmId)
            putExtra("mode", mode)
            putExtra("tone", tone)
            putExtra("bufferMinutes", bufferMinutes)
            putExtra("alarmNotes", alarmNotes)
            putExtra("snoozeNoteIndex", snoozeNoteIndex)
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

    private fun handleUserAction(action: String, alarmId: String, mode: String, tone: String, bufferMinutes: String, title: String, body: String, alarmNotes: String, snoozeNoteIndex: String) {
        if (actionHandled) {
            return
        }

        actionHandled = true
        if (action == "dismiss-alarm") {
            AlarmLauncherModule.suppressAlarmLaunch(this, alarmId)
        }
        cancelAutoSnooze()
        cancelNotifications()
        savePendingAction(action, alarmId, mode, tone, bufferMinutes, title, body, alarmNotes, snoozeNoteIndex)
        val appLaunchStarted = launchMainApp(
            action,
            alarmId,
            mode,
            tone,
            bufferMinutes,
            title,
            body,
            alarmNotes,
            snoozeNoteIndex
        )

        if (appLaunchStarted) {
            autoSnoozeHandler.postDelayed(
                { if (!isFinishing) finish() },
                MAIN_APP_LAUNCH_FINISH_DELAY_MS
            )
        } else {
            finish()
        }
    }

    private fun scheduleAutoSnooze() {
        cancelAutoSnooze()
        autoSnoozeHandler.postDelayed(autoSnoozeRunnable, AUTO_SNOOZE_DELAY_MS)
    }

    private fun cancelAutoSnooze() {
        autoSnoozeHandler.removeCallbacks(autoSnoozeRunnable)
    }

    private fun autoDismissOnExit() {
        if (actionHandled || currentAlarmId.isBlank()) {
            return
        }

        Log.d(TAG, "Auto-dismissing alarm after AlarmActivity exit: $currentAlarmId")
        actionHandled = true
        AlarmLauncherModule.suppressAlarmLaunch(this, currentAlarmId)
        cancelAutoSnooze()
        cancelNotifications()
        savePendingAction(
            "dismiss-alarm",
            currentAlarmId,
            currentMode,
            currentTone,
            currentBufferMinutes,
            currentTitle,
            currentBody,
            currentAlarmNotes,
            currentSnoozeNoteIndex
        )
    }

    override fun onBackPressed() {
        autoDismissOnExit()
        super.onBackPressed()
    }

    override fun onStop() {
        if (!isChangingConfigurations) {
            autoDismissOnExit()
        }
        super.onStop()
    }

    override fun onDestroy() {
        if (!isChangingConfigurations) {
            autoDismissOnExit()
        }
        cancelAutoSnooze()
        super.onDestroy()
    }

    private fun cancelNotifications() {
        Log.d(TAG, "🔕 Stopping AlarmService and cancelling notification")
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.cancel(ALARM_NOTIFICATION_ID)

        // Stop the service by sending the STOP action
        val stopServiceIntent = Intent(this, AlarmService::class.java).apply {
            action = AlarmService.ACTION_STOP
        }
        try {
            startService(stopServiceIntent)
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error stopping AlarmService", e)
            stopService(stopServiceIntent)
        }
    }

    private fun cancelAlarmNotificationOnly() {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.cancel(ALARM_NOTIFICATION_ID)
    }

    private fun savePendingAction(action: String, alarmId: String, mode: String, tone: String, bufferMinutes: String, title: String, body: String, alarmNotes: String, snoozeNoteIndex: String) {
        getSharedPreferences(AlarmLauncherModule.PREFS_NAME, 0)
            .edit()
            .putString(AlarmLauncherModule.KEY_ACTION, action)
            .putString(AlarmLauncherModule.KEY_ALARM_ID, alarmId)
            .putString(AlarmLauncherModule.KEY_MODE, mode)
            .putString("tone", tone)
            .putString("bufferMinutes", bufferMinutes)
            .putString("alarmNotes", alarmNotes)
            .putString("snoozeNoteIndex", snoozeNoteIndex)
            .putString(AlarmLauncherModule.KEY_TITLE, title)
            .putString(AlarmLauncherModule.KEY_BODY, body)
            .commit()
    }

    private fun launchMainApp(action: String, alarmId: String, mode: String, tone: String, bufferMinutes: String, title: String, body: String, alarmNotes: String, snoozeNoteIndex: String): Boolean {
        Log.d(TAG, "🚀 Preparing app launch: action=$action, buffer=$bufferMinutes")

        return try {
            val launchIntent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP or
                    Intent.FLAG_ACTIVITY_NO_ANIMATION
            }
            launchIntent.putExtra("alarm_action", action)
            launchIntent.putExtra("alarmId", alarmId)
            launchIntent.putExtra("mode", mode)
            launchIntent.putExtra("tone", tone)
            launchIntent.putExtra("bufferMinutes", bufferMinutes)
            launchIntent.putExtra("title", title)
            launchIntent.putExtra("body", body)
            launchIntent.putExtra("alarmNotes", alarmNotes)
            launchIntent.putExtra("snoozeNoteIndex", snoozeNoteIndex)
            Log.d(TAG, "📦 Starting Main Activity")
            startActivity(launchIntent)
            overridePendingTransition(0, 0)
            true
        } catch (e: Exception) {
            Log.e(TAG, "❌ Fatal: Could not launch MainActivity", e)
            false
        }
    }
}
