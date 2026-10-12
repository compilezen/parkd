package expo.modules.parkdliveupdates
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
class ParkdLiveUpdatesModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ParkdLiveUpdates")
    AsyncFunction("show") { spotId: Double, title: String, body: String, compact: String, returning: Boolean, force: Boolean ->
      ParkingNotifications.show(appContext.reactContext ?: throw IllegalStateException("App context unavailable"), spotId, title, body, compact, returning, force)
    }
    AsyncFunction("clear") {
      ParkingNotifications.clear(appContext.reactContext ?: throw IllegalStateException("App context unavailable"))
    }
  }
}
