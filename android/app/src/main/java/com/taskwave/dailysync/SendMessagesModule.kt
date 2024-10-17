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
                Log.d("attachment LOG", "sendMail: $attachment")

                if (attachment.exists()) {
                    val uri = FileProvider.getUriForFile(
                        reactApplicationContext,
                        "com.taskwave.dailysync.provider",
                        attachment
                    )
                    Log.d("uri LOG", "sendMail: $uri")
                    attachmentUris.add(uri)
                } else {
                    Log.e("SendMail", "Attachment file does not exist: $path")
                }
            }

            if (attachmentUris.isNotEmpty()) {
                emailIntent.putParcelableArrayListExtra(Intent.EXTRA_STREAM, attachmentUris)
                emailIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
        }

        if (isAppInstalled("com.google.android.gm")) {
            Log.d("isAppInstalled LOG", "sendMail: ${isAppInstalled("com.google.android.gm")}")
            emailIntent.setPackage("com.google.android.gm")
        } else {
            Log.d("isAppInstalledFALSE", "sendMail: NOT AppInstalled")
        }

        try {
            reactApplicationContext.currentActivity?.startActivity(Intent.createChooser(emailIntent, "Send email..."))
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
fun sendWhatsapp(
    numbers: String,
    message: String,
    attachmentPaths: String,
    audioPaths: String,
    isWhatsapp: Boolean
) {
    Log.d("SendMessagesModule", "sendWhatsapp: Start")
    Log.d(
        "SendMessagesModule",
        "Numbers: $numbers, Message: $message, AttachmentPaths: $attachmentPaths, AudioPaths: $audioPaths, isWhatsapp: $isWhatsapp"
    )

    // Choose the correct intent based on attachments
    val whatsappIntent = if (attachmentPaths.isEmpty() && audioPaths.isEmpty()) {
        // No attachments, send only text
        Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
        }
    } else {
        // Attachments available, send media and text
        Intent(Intent.ACTION_SEND_MULTIPLE).apply {
            type = "image/*"
        }
    }

    whatsappIntent.putExtra(Intent.EXTRA_TEXT, message)

    // Format the phone number
    val formattedNumbers = numbers.split(",").map { it.replace("+", "").replace(" ", "") }
    whatsappIntent.putExtra("jid", "${formattedNumbers.first()}@s.whatsapp.net")

    val uris = ArrayList<Uri>()

    // Process attachments
    if (attachmentPaths.isNotEmpty()) {
        val attachments = attachmentPaths.split(",")
        for (path in attachments) {
            val attachment = File(path.trim())
            Log.d("SendMessagesModule", "Attachment: $attachment")

            if (attachment.exists()) {
                val uri = FileProvider.getUriForFile(
                    reactApplicationContext,
                    "com.taskwave.dailysync.provider",
                    attachment
                )
                uris.add(uri)
            } else {
                Log.e("SendMessagesModule", "Attachment does not exist: $attachment")
            }
        }
    }

    // Process audio paths
    if (audioPaths.isNotEmpty()) {
        val audioPath = audioPaths.trim().replace("file://", "")
        val audioFile = File(audioPath)

        if (audioFile.exists()) {
            val uri = FileProvider.getUriForFile(
                reactApplicationContext,
                "com.taskwave.dailysync.provider",
                audioFile
            )
            Log.d("sendMessageModule", "AudioURI: $uri")
            uris.add(uri)
        } else {
            Log.e("SendMessagesModule", "Audio attachment does not exist: ${audioFile.absolutePath}")
        }
    }

    Log.d("SendMessagesModule", "URIS: $uris")

    // Attach the URIs to the intent if there are any
    if (uris.isNotEmpty()) {
        whatsappIntent.putParcelableArrayListExtra(Intent.EXTRA_STREAM, uris)
        whatsappIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }

    val packageName = if (isWhatsapp) "com.whatsapp" else "com.whatsapp.w4b"
    Log.d("SendMessagesModule", "WhatsApp Package: $packageName")

    if (isAppInstalled(packageName)) {
        whatsappIntent.setPackage(packageName)

        try {
            reactApplicationContext.currentActivity?.startActivity(whatsappIntent)
            Log.d("SendMessagesModule", "WhatsApp intent sent successfully")
        } catch (e: Exception) {
            Log.e("SendMessagesModule", "Error starting WhatsApp Intent", e)
        }
    } else {
        Log.d(
            "SendMessagesModule",
            if (isWhatsapp) "WhatsApp not installed" else "WhatsApp Business not installed"
        )
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