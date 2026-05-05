package {{PACKAGE_NAME}}

import android.content.Intent
import android.os.Build
import android.util.Log
import android.app.NotificationManager
import android.net.Uri
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments

class AlarmLauncherModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val PREFS_NAME = "DailySyncAlarmActions"
        const val KEY_ACTION = "action"
        const val KEY_ALARM_ID = "alarmId"
        const val KEY_MODE = "mode"
        const val KEY_TITLE = "title"
        const val KEY_BODY = "body"
    }

    override fun getName(): String = "AlarmLauncher"

    @ReactMethod
    fun launch(title: String, body: String, alarmId: String, mode: String, tone: String, bufferMinutes: String) {
        Log.d("AlarmLauncher", "🚀 [NEW BUILD] launch called: title=$title, alarmId=$alarmId, tone=$tone, buffer=$bufferMinutes")
        
        val serviceIntent = Intent(reactApplicationContext, AlarmService::class.java).apply {
            putExtra("title", title)
            putExtra("body", body)
            putExtra("alarmId", alarmId)
            putExtra("mode", mode)
            putExtra("tone", tone)
            putExtra("bufferMinutes", bufferMinutes)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactApplicationContext.startForegroundService(serviceIntent)
        } else {
            reactApplicationContext.startService(serviceIntent)
        }
    }

    @ReactMethod
    fun launchAlarmActivity(alarmId: String, title: String, body: String, mode: String, tone: String, bufferMinutes: String) {
        val intent = Intent(reactApplicationContext, AlarmActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("alarmId", alarmId)
            putExtra("title", title)
            putExtra("body", body)
            putExtra("mode", mode)
            putExtra("tone", tone)
            putExtra("bufferMinutes", bufferMinutes)
        }
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun canDrawOverlays(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(reactApplicationContext))
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${reactApplicationContext.packageName}")
            )
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
        }
    }

    @ReactMethod
    fun getInitialAction(promise: Promise) {
        val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, 0)
        val action = prefs.getString(KEY_ACTION, null)

        if (action == null) {
            promise.resolve(null)
            return
        }

        val result: WritableMap = Arguments.createMap()
        result.putString("action", action)
        result.putString("alarmId", prefs.getString(KEY_ALARM_ID, ""))
        result.putString("mode", prefs.getString(KEY_MODE, "solo"))
        result.putString("title", prefs.getString(KEY_TITLE, "Alarm"))
        result.putString("body", prefs.getString(KEY_BODY, "Wake up!"))
        result.putString("tone", prefs.getString("tone", "default"))
        result.putString("bufferMinutes", prefs.getString("bufferMinutes", "5"))
        result.putString("title", prefs.getString("title", "Alarm"))
        result.putString("body", prefs.getString("body", "Wake up!"))

        prefs.edit().clear().apply()
        promise.resolve(result)
    }

    @ReactMethod
    fun canUseFullScreenIntent(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            promise.resolve(true)
            return
        }

        val notificationManager =
            reactApplicationContext.getSystemService(NotificationManager::class.java)
        promise.resolve(notificationManager.canUseFullScreenIntent())
    }

    @ReactMethod
    fun openFullScreenIntentSettings() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            return
        }

        val intent = Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT).apply {
            data = Uri.parse("package:${reactApplicationContext.packageName}")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun stopService() {
        Log.d("AlarmLauncher", "⏹️ stopService called from JS")
        val serviceIntent = Intent(reactApplicationContext, AlarmService::class.java).apply {
            action = AlarmService.ACTION_STOP
        }
        reactApplicationContext.stopService(serviceIntent)
    }
}
