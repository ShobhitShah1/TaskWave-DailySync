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

class SendMessagesModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
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
        Log.d("Check Data", "${recipients ?: "null"} ${subject ?: "null"} ${body ?: "null"} ${attachmentPaths ?: "null"}")

        val emailIntent = Intent(Intent.ACTION_SEND)

        emailIntent.putExtra(Intent.EXTRA_EMAIL, arrayOf(recipients))
        emailIntent.putExtra(Intent.EXTRA_SUBJECT, subject)
        emailIntent.putExtra(Intent.EXTRA_TEXT, body)

        if (attachmentPaths.isNotEmpty()) {
            val attachment = File(reactApplicationContext.filesDir, attachmentPaths)
            Log.d("attachment LOG", "sendMail: $attachment")

            if (attachment.exists()) {
                val uri = FileProvider.getUriForFile(reactApplicationContext, "com.taskwave.dailysync.provider", attachment)
                Log.d("uri LOG", "sendMail: $uri")

                emailIntent.putExtra(Intent.EXTRA_STREAM, uri)
                Log.d("MIME TYPE:", "sendMail: ${MimeTypeMap.getSingleton().getMimeTypeFromExtension(attachment.extension)}")
                emailIntent.type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(attachment.extension)

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
    fun sendSms(numbers: ReadableArray, message: String) {
        val numbersList = mutableListOf<String>()

        for (i in 0 until numbers.size()) {
            val number = numbers.getString(i)
            if (number.isNotEmpty()) {
                numbersList.add(number)
            }
        }

        if (numbersList.isEmpty()) {
            return
        }

        val smsUri = Uri.parse("smsto:${numbersList.joinToString(";")}")

        val intent = Intent(Intent.ACTION_SENDTO, smsUri)

        // Check if Google Messaging app is installed
        if (isGoogleMessagingAppInstalled(reactApplicationContext)) {
            intent.setPackage("com.google.android.apps.messaging")
        }

        intent.putExtra("sms_body", message)

        reactApplicationContext.currentActivity?.startActivity(intent)
    }

    @ReactMethod
    fun sendWhatsapp(number: String, message: String, attachmentPaths: String, isWhatsapp: Boolean) {
        Log.d("Check Data", "$number $message $attachmentPaths $isWhatsapp")

//        val attachment = File(reactApplicationContext.filesDir, attachmentPaths)
        val whatsappIntent = Intent(Intent.ACTION_SEND)

        whatsappIntent.putExtra(Intent.EXTRA_TEXT, message)
        whatsappIntent.putExtra("jid", "$number@s.whatsapp.net");

        if (attachmentPaths.isNotEmpty()) {
            val attachment = File(reactApplicationContext.filesDir, attachmentPaths)
            Log.d("attachment LOG", "sendMail: $attachment")

            if (attachment.exists()) {
                val uri = FileProvider.getUriForFile(reactApplicationContext, "com.taskwave.dailysync.provider", attachment)
                Log.d("uri LOG", "sendMail: $uri")

                whatsappIntent.putExtra(Intent.EXTRA_STREAM, uri)
                Log.d("MIME TYPE:", "sendMail: ${MimeTypeMap.getSingleton().getMimeTypeFromExtension(attachment.extension)}")
                whatsappIntent.type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(attachment.extension)

                whatsappIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                whatsappIntent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
            } else {
                Log.e("SendMail", "Attachment file does not exist.")
            }
        }
        else
            whatsappIntent.type = "text/plain"

        if (isAppInstalled(if (isWhatsapp) "com.whatsapp" else "com.whatsapp.w4b")) {
            whatsappIntent.setPackage(if (isWhatsapp) "com.whatsapp" else "com.whatsapp.w4b")

            try {
                reactApplicationContext.currentActivity?.startActivity(whatsappIntent)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        } else {
            Log.d("TAG", if (isWhatsapp) "Whatsapp Nathe" else "Whatsapp Business Nathe")
        }
    }
    @ReactMethod
    fun isAppInstalled(packageId: String): Boolean {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                reactApplicationContext.packageManager.getApplicationInfo(packageId, PackageManager.ApplicationInfoFlags.of(0))
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
                reactApplicationContext.packageManager.getApplicationInfo(packageId, PackageManager.ApplicationInfoFlags.of(0))
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