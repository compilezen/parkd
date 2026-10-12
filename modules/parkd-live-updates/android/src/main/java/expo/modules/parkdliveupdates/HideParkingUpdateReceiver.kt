package expo.modules.parkdliveupdates

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class HideParkingUpdateReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != "${context.packageName}.HIDE_PARKING_UPDATE") return
    val prefs = context.getSharedPreferences(PARKING_PREFS, Context.MODE_PRIVATE)
    val id = intent.getLongExtra("spotId", -1L)
    // An old notification's delete intent must not hide a newer parking spot.
    if (id < 0 || prefs.getLong("spotId", -2L) != id) return
    prefs.edit().putLong("hiddenSpotId", id).apply()
    (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).cancel(PARKING_NOTIFICATION_ID)
  }
}
