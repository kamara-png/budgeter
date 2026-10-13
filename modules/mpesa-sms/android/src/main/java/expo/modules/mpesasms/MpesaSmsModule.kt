package expo.modules.mpesasms

import android.content.ContentResolver
import android.provider.Telephony
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class ReadMessagesOptions : Record {
  @Field val since: Long? = null
  @Field val limit: Int? = null
  @Field val senderContains: String? = null
}

class MpesaSmsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MpesaSms")

    AsyncFunction("readMessagesAsync") { options: ReadMessagesOptions ->
      val context = appContext.reactContext
        ?: return@AsyncFunction emptyList<Map<String, Any>>()

      val resolver: ContentResolver = context.contentResolver
      val since = options.since ?: 0L
      val limit = options.limit ?: 500
      val senderFilter = (options.senderContains ?: "mpesa").lowercase()

      val projection = arrayOf(
        Telephony.Sms._ID,
        Telephony.Sms.ADDRESS,
        Telephony.Sms.BODY,
        Telephony.Sms.DATE,
      )
      val selection = "${Telephony.Sms.DATE} >= ?"
      val selectionArgs = arrayOf(since.toString())
      val sortOrder = "${Telephony.Sms.DATE} DESC"

      val messages = mutableListOf<Map<String, Any>>()
      resolver.query(
        Telephony.Sms.Inbox.CONTENT_URI,
        projection,
        selection,
        selectionArgs,
        sortOrder,
      )?.use { cursor ->
        val idIndex = cursor.getColumnIndexOrThrow(Telephony.Sms._ID)
        val addressIndex = cursor.getColumnIndexOrThrow(Telephony.Sms.ADDRESS)
        val bodyIndex = cursor.getColumnIndexOrThrow(Telephony.Sms.BODY)
        val dateIndex = cursor.getColumnIndexOrThrow(Telephony.Sms.DATE)

        while (messages.size < limit && cursor.moveToNext()) {
          val address = cursor.getString(addressIndex) ?: ""
          if (senderFilter.isNotEmpty() && !address.lowercase().contains(senderFilter)) {
            continue
          }
          messages.add(
            mapOf(
              "id" to (cursor.getString(idIndex) ?: ""),
              "address" to address,
              "body" to (cursor.getString(bodyIndex) ?: ""),
              "date" to cursor.getLong(dateIndex),
            ),
          )
        }
      }

      return@AsyncFunction messages
    }
  }
}
