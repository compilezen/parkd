package expo.modules.parkdliveupdates

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.View
import android.widget.RemoteViews

class ParkdParkingWidget : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    for (id in ids) manager.updateAppWidget(id, ParkingWidgets.views(context))
  }
}
internal object ParkingWidgets {
  fun snapshot(context: Context, title: String?, body: String?, labels: Map<String, String>) {
    context.getSharedPreferences(PARKING_PREFS, Context.MODE_PRIVATE).edit()
      .putBoolean("widgetSaved", title != null)
      .putString("widgetTitle", title ?: labels["emptyTitle"] ?: context.getString(R.string.parkd_widget_empty_title))
      .putString("widgetBody", body ?: labels["emptyBody"] ?: context.getString(R.string.parkd_widget_empty_body))
      .putBoolean("widgetRtl", labels["rtl"] == "true").apply()
    val manager = AppWidgetManager.getInstance(context)
    for (id in manager.getAppWidgetIds(ComponentName(context, ParkdParkingWidget::class.java))) manager.updateAppWidget(id, views(context))
  }
  fun views(context: Context): RemoteViews {
    val prefs = context.getSharedPreferences(PARKING_PREFS, Context.MODE_PRIVATE)
    val views = RemoteViews(context.packageName, R.layout.parkd_parking_widget)
    views.setTextViewText(R.id.parkd_widget_title, prefs.getString("widgetTitle", context.getString(R.string.parkd_widget_empty_title)))
    views.setTextViewText(R.id.parkd_widget_body, prefs.getString("widgetBody", context.getString(R.string.parkd_widget_empty_body)))
    views.setInt(R.id.parkd_widget_root, "setLayoutDirection", if (prefs.getBoolean("widgetRtl", false)) View.LAYOUT_DIRECTION_RTL else View.LAYOUT_DIRECTION_LTR)
    val uri = if (prefs.getBoolean("widgetSaved", false)) "parkd://find" else "parkd://"
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri)).setPackage(context.packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    val open = PendingIntent.getActivity(context, 4204, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    views.setOnClickPendingIntent(R.id.parkd_widget_root, open)
    return views
  }
}
