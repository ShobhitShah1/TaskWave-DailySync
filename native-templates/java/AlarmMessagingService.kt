package {{PACKAGE_NAME}}

import android.content.Intent
import android.os.Build
import android.util.Log
import com.google.firebase.messaging.RemoteMessage
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService

class AlarmMessagingService : ReactNativeFirebaseMessagingService() {

    companion object {
        private const val TAG = "AlarmMessagingService"
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        val data = remoteMessage.data
        val kind = data["kind"]

        Log.d(TAG, "onMessageReceived: kind=$kind, data=$data")

        if (kind == "alarm") {
            val title = data["title"] ?: "Alarm"
            val body = data["body"] ?: "Wake up!"
            val alarmId = data["alarmId"] ?: ""
            val mode = data["mode"] ?: "solo"
            val tone = data["tone"] ?: "default"
            val bufferMinutes = data["bufferMinutes"] ?: "5"

            if (AlarmLauncherModule.isAlarmLaunchSuppressed(this, alarmId)) {
                Log.d(TAG, "Ignoring recently dismissed alarm: $alarmId")
                return
            }

            val serviceIntent = Intent(this, AlarmService::class.java).apply {
                putExtra("title", title)
                putExtra("body", body)
                putExtra("alarmId", alarmId)
                putExtra("mode", mode)
                putExtra("tone", tone)
                putExtra("bufferMinutes", bufferMinutes)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent)
            } else {
                startService(serviceIntent)
            }
        } else {
            super.onMessageReceived(remoteMessage)
        }
    }
}
