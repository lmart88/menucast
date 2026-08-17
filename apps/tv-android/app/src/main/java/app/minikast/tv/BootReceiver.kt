package app.minikast.tv

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * BootReceiver: Automatically launches the miniKast TV player when the TV or Fire Stick powers on.
 */
class BootReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "miniKastBoot"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        Log.d(TAG, "Received boot event: $action")

        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == "com.htc.intent.action.QUICKBOOT_POWERON"
        ) {
            try {
                val launchIntent = Intent(context, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
                }
                context.startActivity(launchIntent)
                Log.d(TAG, "miniKast TV player launched successfully on boot.")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to launch miniKast on boot", e)
            }
        }
    }
}
