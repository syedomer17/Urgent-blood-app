package com.example.data.api

import android.content.Context
import android.content.SharedPreferences
import com.example.data.model.User
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory

class SessionManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("lifelink_session", Context.MODE_PRIVATE)
    private val moshi: Moshi = Moshi.Builder().addLast(KotlinJsonAdapterFactory()).build()
    private val userAdapter = moshi.adapter(User::class.java)

    var token: String?
        get() = prefs.getString("jwt_token", null)
        set(value) {
            prefs.edit().putString("jwt_token", value).apply()
        }

    var user: User?
        get() {
            val json = prefs.getString("user_profile", null) ?: return null
            return try {
                userAdapter.fromJson(json)
            } catch (e: Exception) {
                null
            }
        }
        set(value) {
            if (value == null) {
                prefs.edit().remove("user_profile").apply()
            } else {
                try {
                    val json = userAdapter.toJson(value)
                    prefs.edit().putString("user_profile", json).apply()
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }

    fun clear() {
        prefs.edit().clear().apply()
    }

    val isLoggedIn: Boolean
        get() = token != null && user != null
}
