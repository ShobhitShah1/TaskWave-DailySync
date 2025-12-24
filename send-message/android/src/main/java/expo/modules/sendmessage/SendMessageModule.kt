package expo.modules.sendmessage

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL
import android.content.Intent
import android.net.Uri
import android.util.Log
import androidx.core.content.FileProvider
import java.io.File
import android.widget.Toast

class SendMessageModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SendMessage")

    Function("sendMail") { recipients: String, subject: String, body: String, attachmentPaths: String ->
      val context = appContext.reactContext ?: return@Function
      val emailIntent = Intent(Intent.ACTION_SEND_MULTIPLE)
      emailIntent.type = "message/rfc822"
      emailIntent.putExtra(Intent.EXTRA_EMAIL, arrayOf(recipients))
      emailIntent.putExtra(Intent.EXTRA_SUBJECT, subject)
      emailIntent.putExtra(Intent.EXTRA_TEXT, body)
      if (attachmentPaths.isNotEmpty()) {
        val attachmentUris = ArrayList<Uri>()
        val paths = attachmentPaths.split(",")
        for (path in paths) {
          val attachment = File(path.trim())
          if (attachment.exists()) {
            val uri = FileProvider.getUriForFile(
              context,
              context.packageName + ".provider",
              attachment
            )
            attachmentUris.add(uri)
          }
        }
        if (attachmentUris.isNotEmpty()) {
          emailIntent.putParcelableArrayListExtra(Intent.EXTRA_STREAM, attachmentUris)
          emailIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
      }
      if (isAppInstalled(context, "com.google.android.gm")) {
        emailIntent.setPackage("com.google.android.gm")
      }
      try {
        appContext.currentActivity?.startActivity(
          Intent.createChooser(emailIntent, "Send email...")
        )
      } catch (e: Exception) {
        Log.e("SendMail", "Error starting email intent: ${e.message}")
      }
    }

    Function("sendSms") { numbers: List<String>, message: String, firstAttachment: String? ->
      val context = appContext.reactContext ?: return@Function
      val numbersList = numbers.filter { it.isNotEmpty() }
      if (numbersList.isEmpty()) return@Function
      val smsUri = Uri.parse("smsto:${numbersList.joinToString(";")}")
      val intent = Intent(Intent.ACTION_SENDTO, smsUri)
      if (isAppInstalled(context, "com.google.android.apps.messaging")) {
        intent.setPackage("com.google.android.apps.messaging")
      }
      intent.putExtra("sms_body", message)
      try {
        appContext.currentActivity?.startActivity(intent)
      } catch (e: Exception) {
        Log.e("SMSModule", "Error occurred while sending SMS: ${e.message}")
      }
    }

    Function("isAppInstalled") { packageId: String ->
      val context = appContext.reactContext ?: return@Function false
      isAppInstalled(context, packageId)
    }

    Function("sendWhatsapp") { numbers: String, message: String, attachmentPaths: String, audioPaths: String, isWhatsapp: Boolean ->
      val context = appContext.reactContext ?: return@Function
      val whatsappIntent = if (attachmentPaths.isEmpty() && audioPaths.isEmpty()) {
        Intent(Intent.ACTION_SEND).apply { type = "text/plain" }
      } else {
        Intent(Intent.ACTION_SEND_MULTIPLE).apply { type = "image/*" }
      }
      whatsappIntent.putExtra(Intent.EXTRA_TEXT, message)
      val formattedNumbers = numbers.split(",").map { it.replace("+", "").replace(" ", "") }
      whatsappIntent.putExtra("jid", "${formattedNumbers.first()}@s.whatsapp.net")
      val uris = ArrayList<Uri>()
      if (attachmentPaths.isNotEmpty()) {
        val attachments = attachmentPaths.split(",")
        for (path in attachments) {
          val attachment = File(path.trim())
          if (attachment.exists()) {
            val uri = FileProvider.getUriForFile(
              context,
              context.packageName + ".provider",
              attachment
            )
            uris.add(uri)
          }
        }
      }
      if (audioPaths.isNotEmpty()) {
        val audioPath = audioPaths.trim().replace("file://", "")
        val audioFile = File(audioPath)
        if (audioFile.exists()) {
          val uri = FileProvider.getUriForFile(
            context,
            context.packageName + ".provider",
            audioFile
          )
          uris.add(uri)
        }
      }
      if (uris.isNotEmpty()) {
        whatsappIntent.putParcelableArrayListExtra(Intent.EXTRA_STREAM, uris)
        whatsappIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
      val packageName = if (isWhatsapp) "com.whatsapp" else "com.whatsapp.w4b"
      if (isAppInstalled(context, packageName)) {
        whatsappIntent.setPackage(packageName)
        try {
          appContext.currentActivity?.startActivity(whatsappIntent)
        } catch (e: Exception) {
          Log.e("SendMessagesModule", "Error starting WhatsApp Intent", e)
        }
      }
    }

    Function("sendTelegramMessage") { username: String, message: String ->
      val context = appContext.reactContext ?: return@Function
      val telegramPackage = "org.telegram.messenger"
      if (!isAppInstalled(context, telegramPackage)) {
        Toast.makeText(context, "Telegram app is not installed", Toast.LENGTH_SHORT).show()
        return@Function
      }
      val telegramDeepLink = "tg://resolve?domain=$username&text=${Uri.encode(message)}"
      val intent = Intent(Intent.ACTION_VIEW).apply {
        data = Uri.parse(telegramDeepLink)
        setPackage(telegramPackage)
      }
      try {
        appContext.currentActivity?.startActivity(intent)
      } catch (e: Exception) {
        Toast.makeText(context, "Error sending message to Telegram", Toast.LENGTH_SHORT).show()
      }
    }
  }

  private fun isAppInstalled(context: android.content.Context, packageName: String): Boolean {
    return try {
      context.packageManager.getPackageInfo(packageName, 0)
      true
    } catch (e: Exception) {
      false
    }
  }
}
