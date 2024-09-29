package com.taskwave.dailysync

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.util.Log
import android.webkit.MimeTypeMap
import androidx.core.content.FileProvider
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import java.io.File
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise
import android.widget.Toast

class SendMessagesModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "SendMessagesModule"
    }

    // Mail Module
    @ReactMethod
    fun sendMail(
        recipients: String,
        subject: String,
        body: String,
        attachmentPaths: String,
    ) {
        Log.d(
            "Check Data",
            "${recipients ?: "null"} ${subject ?: "null"} ${body ?: "null"} ${attachmentPaths ?: "null"}"
        )

        val emailIntent = Intent(Intent.ACTION_SEND)

        emailIntent.putExtra(Intent.EXTRA_EMAIL, arrayOf(recipients))
        emailIntent.putExtra(Intent.EXTRA_SUBJECT, subject)
        emailIntent.putExtra(Intent.EXTRA_TEXT, body)

        if (attachmentPaths.isNotEmpty()) {
            val attachment = File(reactApplicationContext.filesDir, attachmentPaths)
            Log.d("attachment LOG", "sendMail: $attachment")

            if (attachment.exists()) {
                val uri = FileProvider.getUriForFile(
                    reactApplicationContext, "com.taskwave.dailysync.provider", attachment
                )
                Log.d("uri LOG", "sendMail: $uri")

                emailIntent.putExtra(Intent.EXTRA_STREAM, uri)
                Log.d(
                    "MIME TYPE:", "sendMail: ${
                        MimeTypeMap.getSingleton().getMimeTypeFromExtension(attachment.extension)
                    }"
                )
                emailIntent.type =
                    MimeTypeMap.getSingleton().getMimeTypeFromExtension(attachment.extension)

                emailIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                emailIntent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
            } else {
                Log.e("SendMail", "Attachment file does not exist.")
            }
        } else {
            emailIntent.action = Intent.ACTION_SENDTO
            emailIntent.data = Uri.parse("mailto:")
        }

        if (isAppInstalled("com.google.android.gm")) {
            Log.d("isAppInstalled LOG", "sendMail: ${isAppInstalled("com.google.android.gm")}")

            emailIntent.setPackage("com.google.android.gm")
        } else {
            Log.d("isAppInstalledFALSE", "sendMail: NOT AppInstalled")
            emailIntent.setType("message/rfc32")
        }

        try {
            reactApplicationContext.currentActivity?.startActivity(emailIntent)
        } catch (e: ActivityNotFoundException) {
            e.printStackTrace()
            Log.e("SendMail", "No activity found to handle email intent.")
        } catch (e: Exception) {
            Log.e("SendMail", "Error starting email intent: ${e.message}")
        }
    }

    // SMS Module
    @ReactMethod
    fun sendSms(numbers: ReadableArray, message: String, firstAttachment: String?) {
        val numbersList = mutableListOf<String>()

        try {
            for (i in 0 until numbers.size()) {
                val number = numbers.getString(i)
                if (!number.isNullOrEmpty()) {
                    Log.d("SMSModule", "Number added: $number")
                    numbersList.add(number)
                }
            }

            if (numbersList.isEmpty()) {
                Log.e("SMSModule", "No valid phone numbers provided.")
                return
            }

            val smsUri = Uri.parse("smsto:${numbersList.joinToString(";")}")
            val intent = Intent(Intent.ACTION_SENDTO, smsUri)

            // Check if Google Messaging app is installed and log the status
            if (isGoogleMessagingAppInstalled(reactApplicationContext)) {
                Log.d("SMSModule", "Google Messaging App is installed, setting package.")
                intent.setPackage("com.google.android.apps.messaging")
            }

            // Add message and firstAttachment to the intent and log it
            intent.putExtra("sms_body", message)
            Log.d("SMSModule", "SMS message set: $message")
            Log.d("SMSModule", "Attachment: $firstAttachment")

            // Check if current activity is available
            val currentActivity = reactApplicationContext.currentActivity
            if (currentActivity != null) {
                currentActivity.startActivity(intent)
                Log.d("SMSModule", "SMS intent sent successfully.")
            } else {
                Log.e("SMSModule", "Current activity is null, cannot send SMS.")
            }

        } catch (e: Exception) {
            Log.e("SMSModule", "Error occurred while sending SMS: ${e.message}")
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun sendWhatsapp(
        number: String, message: String, attachmentPaths: String, isWhatsapp: Boolean
    ) {
        Log.d("Check Data", "Number: $number, Message: $message, Attachment Paths: $attachmentPaths, isWhatsApp: $isWhatsapp")

        val whatsappIntent = Intent(Intent.ACTION_SEND)

        whatsappIntent.putExtra(Intent.EXTRA_TEXT, message)
        val formattedNumber = number.replace("+", "").replace(" ", "")
        Log.d("Formated Number", "$formattedNumber")
        whatsappIntent.putExtra("jid", "$formattedNumber@s.whatsapp.net")

        if (attachmentPaths.isNotEmpty()) {
            val attachment = File(reactApplicationContext.filesDir, attachmentPaths)
            Log.d("Attachment LOG", "Attachment Path: $attachment")

            if (attachment.exists()) {
                val uri = FileProvider.getUriForFile(
                    reactApplicationContext,
                    "com.taskwave.dailysync.provider",
                    attachment
                )
                Log.d("URI LOG", "Attachment URI: $uri")

                whatsappIntent.putExtra(Intent.EXTRA_STREAM, uri)
                val mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(attachment.extension)
                whatsappIntent.type = mimeType ?: "application/octet-stream"  // Fallback MIME type
                Log.d("MIME Type LOG", "MIME Type: $mimeType")

                whatsappIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                whatsappIntent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
            } else {
                Log.e("SendMail", "Attachment file does not exist: $attachment")
            }
        } else {
            whatsappIntent.type = "text/plain"
        }

        val packageName = if (isWhatsapp) "com.whatsapp" else "com.whatsapp.w4b"
        Log.d("Package Name LOG", "WhatsApp Package: $packageName")

        if (isAppInstalled(packageName)) {
            whatsappIntent.setPackage(packageName)

            try {
                Log.d("WhatsApp Intent LOG", "Starting WhatsApp with Intent: $whatsappIntent")
                reactApplicationContext.currentActivity?.startActivity(whatsappIntent)
            } catch (e: Exception) {
                Log.e("SendWhatsApp", "Error starting WhatsApp Intent", e)
            }
        } else {
            Log.d("TAG", if (isWhatsapp) "WhatsApp not installed" else "WhatsApp Business not installed")
        }
    }

    @ReactMethod
    fun isAppInstalled(packageId: String): Boolean {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                reactApplicationContext.packageManager.getApplicationInfo(
                    packageId, PackageManager.ApplicationInfoFlags.of(0)
                )
            } else {
                reactApplicationContext.packageManager.getApplicationInfo(packageId, 0)
            }
            true
        } catch (e: PackageManager.NameNotFoundException) {
            false
        }
    }

    @ReactMethod
    fun CheckisAppInstalled(packageId: String, promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                reactApplicationContext.packageManager.getApplicationInfo(
                    packageId, PackageManager.ApplicationInfoFlags.of(0)
                )
            } else {
                reactApplicationContext.packageManager.getApplicationInfo(packageId, 0)
            }
            promise.resolve(true)
        } catch (e: PackageManager.NameNotFoundException) {
            promise.resolve(false)
        }
    }


    private fun ReadableArray.toStringArray(): Array<String> {
        val result = mutableListOf<String>()
        for (i in 0 until size()) {
            getString(i)?.let { result.add(it) }
        }
        return result.toTypedArray()
    }

    private fun isGoogleMessagingAppInstalled(context: Context): Boolean {
        return isPackageInstalled("com.google.android.apps.messaging", context)
    }

    private fun isPackageInstalled(packageName: String, context: Context): Boolean {
        return try {
            val packageManager = context.packageManager
            packageManager.getPackageInfo(packageName, PackageManager.GET_ACTIVITIES)
            true
        } catch (e: PackageManager.NameNotFoundException) {
            false
        }
    }
}