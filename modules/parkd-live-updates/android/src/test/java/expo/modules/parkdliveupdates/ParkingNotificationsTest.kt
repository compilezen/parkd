package expo.modules.parkdliveupdates

import android.Manifest
import android.app.Notification
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [32])
class ParkingNotificationsTest {
  private val context: Context get() = RuntimeEnvironment.getApplication()
  private val manager: NotificationManager get() = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
  @Before fun reset() { ParkingNotifications.clear(context) }
  private fun show(id: Double = 1.0, returning: Boolean = false, force: Boolean = false) =
    ParkingNotifications.show(context, id, "parkd", "B1 · Zone X · Space 142", "B1", returning, force)

  @Test fun oneCardUpdatesAndClears() {
    assertEquals("active", show())
    var notification = shadowOf(manager).getNotification(PARKING_NOTIFICATION_ID)
    assertEquals(0, notification.flags and Notification.FLAG_ONGOING_EVENT)
    assertEquals(NotificationManager.IMPORTANCE_LOW, manager.getNotificationChannel(PARKING_CHANNEL).importance)
    assertEquals("parkd://find", shadowOf(notification.contentIntent).savedIntent.data.toString())
    assertEquals("active", show(returning = true))
    notification = shadowOf(manager).getNotification(PARKING_NOTIFICATION_ID)
    assertTrue(notification.flags and Notification.FLAG_ONGOING_EVENT != 0)
    assertEquals(1, shadowOf(manager).allNotifications.size)
    ParkingNotifications.clear(context)
    assertEquals(0, shadowOf(manager).allNotifications.size)
  }
  @Test fun hidePersistsUntilExplicitRestoreAndOldHideCannotRemoveNewSpot() {
    show()
    val oldHide = shadowOf(shadowOf(manager).getNotification(PARKING_NOTIFICATION_ID).deleteIntent).savedIntent
    show(id = 2.0)
    HideParkingUpdateReceiver().onReceive(context, oldHide)
    assertEquals(1, shadowOf(manager).allNotifications.size)
    val currentHide = shadowOf(shadowOf(manager).getNotification(PARKING_NOTIFICATION_ID).deleteIntent).savedIntent
    HideParkingUpdateReceiver().onReceive(context, currentHide)
    assertEquals(0, shadowOf(manager).allNotifications.size)
    assertEquals("hidden", show(id = 2.0, returning = true))
    assertEquals("active", show(id = 2.0, force = true))
  }
  @Test @Config(sdk = [33]) fun permissionDeniedKeepsCardOff() {
    shadowOf(RuntimeEnvironment.getApplication()).denyPermissions(Manifest.permission.POST_NOTIFICATIONS)
    assertEquals("denied", show())
    assertEquals(0, shadowOf(manager).allNotifications.size)
  }
}
