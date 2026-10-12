package expo.modules.parkdliveupdates
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
class ParkdLiveUpdatesModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ParkdLiveUpdates")
    AsyncFunction("show") { spotId: Double, title: String, body: String, compact: String, returning: Boolean, force: Boolean, labels: Map<String, String> ->
      ParkingNotifications.show(appContext.reactContext ?: throw IllegalStateException("App context unavailable"), spotId, title, body, compact, returning, force, labels)
    }
    AsyncFunction("displayCapability") {
      val context = appContext.reactContext ?: throw IllegalStateException("App context unavailable")
      if (android.os.Build.VERSION.SDK_INT < 36) "old"
      else if (!(context.getSystemService(android.content.Context.NOTIFICATION_SERVICE) as android.app.NotificationManager).canPostPromotedNotifications()) "disabled"
      else "supported"
    }
    AsyncFunction("openDisplaySettings") {
      val context = appContext.reactContext ?: throw IllegalStateException("App context unavailable")
      val intent = android.content.Intent("android.settings.APP_NOTIFICATION_PROMOTION_SETTINGS")
        .putExtra("android.provider.extra.APP_PACKAGE", context.packageName)
        .addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
      try { context.startActivity(intent) }
      catch (_: android.content.ActivityNotFoundException) {
        context.startActivity(android.content.Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS, android.net.Uri.parse("package:${context.packageName}")).addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK))
      }
    }
    AsyncFunction("requestWidget") {
      val context = appContext.reactContext ?: throw IllegalStateException("App context unavailable")
      val manager = android.appwidget.AppWidgetManager.getInstance(context)
      if (android.os.Build.VERSION.SDK_INT >= 26 && manager.isRequestPinAppWidgetSupported)
        manager.requestPinAppWidget(android.content.ComponentName(context, ParkdParkingWidget::class.java), null, null)
      else false
    }
    AsyncFunction("clear") { labels: Map<String, String> ->
      ParkingNotifications.clear(appContext.reactContext ?: throw IllegalStateException("App context unavailable"), labels)
    }
  }
}
