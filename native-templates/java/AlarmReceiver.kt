package {{PACKAGE_NAME}}

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val alarmId = intent.getStringExtra("alarmId") ?: ""
        Log.d("AlarmReceiver", "Solo alarm triggered: $alarmId")

        if (AlarmLauncherModule.isAlarmLaunchSuppressed(context, alarmId)) {
            return
        }

        val serviceIntent = Intent(context, AlarmService::class.java).apply {
            putExtras(intent)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }
    }
}
