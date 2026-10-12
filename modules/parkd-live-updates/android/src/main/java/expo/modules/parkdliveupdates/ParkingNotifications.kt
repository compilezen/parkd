package expo.modules.parkdliveupdates

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.drawable.Icon
import android.net.Uri
import android.os.Build
import android.os.Bundle

internal const val PARKING_NOTIFICATION_ID = 4201
internal const val PARKING_CHANNEL = "parkd-parking-v1"
internal const val PARKING_PREFS = "parkd-live-updates"

internal object ParkingNotifications {
  fun show(context: Context, spotId: Double, title: String, body: String, compact: String, returning: Boolean, force: Boolean, labels: Map<String, String> = emptyMap()): String {
      ParkingWidgets.snapshot(context, labels["summary"] ?: title, labels["widgetBody"] ?: body, labels)
      val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      val prefs = context.getSharedPreferences(PARKING_PREFS, Context.MODE_PRIVATE)
      val id = spotId.toLong()
      if (!force && prefs.getLong("hiddenSpotId", -1L) == id) return "hidden"
      if (force) prefs.edit().remove("hiddenSpotId").apply()
      if (Build.VERSION.SDK_INT >= 33 && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return "denied"
      if (!manager.areNotificationsEnabled()) return "denied"
      if (Build.VERSION.SDK_INT >= 26) {
        val channel = NotificationChannel(PARKING_CHANNEL, labels["channel"] ?: "Parking memory", NotificationManager.IMPORTANCE_LOW)
        channel.description = labels["description"] ?: "Your saved spot and the steps back to your car"
        channel.setSound(null, null)
        channel.enableVibration(false)
        channel.setShowBadge(false)
        manager.createNotificationChannel(channel)
        if (manager.getNotificationChannel(PARKING_CHANNEL)?.importance == NotificationManager.IMPORTANCE_NONE) return "denied"
      }
      val openIntent = Intent(Intent.ACTION_VIEW, Uri.parse("parkd://find"))
        .setPackage(context.packageName)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      val open = PendingIntent.getActivity(context, 4202, openIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      val hideIntent = Intent(context, HideParkingUpdateReceiver::class.java)
        .setAction("${context.packageName}.HIDE_PARKING_UPDATE")
        .setData(Uri.parse("parkd://updates/hide/$id"))
        .putExtra("spotId", id)
      val hide = PendingIntent.getBroadcast(context, 4203, hideIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      val builder = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(context, PARKING_CHANNEL) else Notification.Builder(context)
      builder.setSmallIcon(R.drawable.ic_parkd_parking)
        .setContentTitle(title)
        .setContentText(body.lineSequence().firstOrNull() ?: body)
        .setStyle(Notification.BigTextStyle().bigText(body))
        .setColor(Color.rgb(65, 98, 246))
        .setOngoing(returning)
        .setCategory(if (returning) Notification.CATEGORY_NAVIGATION else Notification.CATEGORY_REMINDER)
        .setOnlyAlertOnce(true)
        .setAutoCancel(false)
        .setShowWhen(false)
        .setVisibility(Notification.VISIBILITY_PUBLIC)
        .setContentIntent(open)
        .setDeleteIntent(hide)
        .addAction(Notification.Action.Builder(Icon.createWithResource(context, R.drawable.ic_parkd_parking), labels["return"] ?: "Your way back", open).build())
        .addAction(Notification.Action.Builder(Icon.createWithResource(context, android.R.drawable.ic_menu_close_clear_cancel), labels["hide"] ?: "Hide", hide).build())
      if (Build.VERSION.SDK_INT >= 26) builder.setColorized(false)
      // API 36.1 and supporting OEMs recognize this documented extra. Older
      // versions retain the standard notification without claiming promotion.
      if (returning && Build.VERSION.SDK_INT >= 36) {
        builder.addExtras(Bundle().apply { putBoolean("android.requestPromotedOngoing", true) })
        builder.setShortCriticalText(compact.take(7))
      }
      prefs.edit().putLong("spotId", id).apply()
      return try { manager.notify(PARKING_NOTIFICATION_ID, builder.build()); "active" }
      catch (_: SecurityException) { "denied" }
  }
  fun clear(context: Context, labels: Map<String, String> = emptyMap()) {
    ParkingWidgets.snapshot(context, null, null, labels)
    (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).cancel(PARKING_NOTIFICATION_ID)
    context.getSharedPreferences(PARKING_PREFS, Context.MODE_PRIVATE).edit().remove("spotId").remove("hiddenSpotId").apply()
  }
}
