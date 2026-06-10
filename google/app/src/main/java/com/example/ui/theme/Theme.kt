package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp

private val DarkColorScheme =
  darkColorScheme(
    primary = DarkPrimary,
    secondary = RedLight,
    background = DarkBg,
    surface = DarkCard,
    onPrimary = Color.Black,
    onBackground = DarkText,
    onSurface = DarkText
  )

private val LightColorScheme =
  lightColorScheme(
    primary = RedPrimary,
    secondary = RedDark,
    tertiary = RedLight,
    background = ScreenBgLight,
    surface = CardBgLight,
    onPrimary = Color.White,
    onBackground = TextDark,
    onSurface = TextDark
  )

@Composable
fun MyApplicationTheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  // Disable dynamic color by default to preserve specialized LifeLink brand colors
  dynamicColor: Boolean = false,
  content: @Composable () -> Unit,
) {
  val colorScheme =
    when {
      dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
        val context = LocalContext.current
        if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
      }

      darkTheme -> DarkColorScheme
      else -> LightColorScheme
    }

  MaterialTheme(
    colorScheme = colorScheme,
    typography = Typography,
    content = content
  )
}

fun Modifier.frostedGlassBackground(isDark: Boolean = false): Modifier = this.drawBehind {
    if (isDark) {
        // Dark Theme Mesh background
        drawRect(color = Color(0xFF111115))
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(Color(0xFF991B1B).copy(alpha = 0.22f), Color.Transparent),
                center = Offset(size.width * -0.1f, size.height * -0.1f),
                radius = size.minDimension * 0.75f
            ),
            center = Offset(size.width * -0.1f, size.height * -0.1f),
            radius = size.minDimension * 0.75f
        )
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(Color(0xFF881337).copy(alpha = 0.25f), Color.Transparent),
                center = Offset(size.width * 1.15f, size.height * 0.85f),
                radius = size.minDimension * 0.85f
            ),
            center = Offset(size.width * 1.15f, size.height * 0.85f),
            radius = size.minDimension * 0.85f
        )
    } else {
        // Light Theme Mesh background `#FDF7F7` with tailwind red-400 and rose-300 blur-blobs
        drawRect(color = Color(0xFFFDF7F7))
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(Color(0xFFF87171).copy(alpha = 0.26f), Color.Transparent),
                center = Offset(size.width * -0.1f, size.height * -0.1f),
                radius = size.minDimension * 0.7f
            ),
            center = Offset(size.width * -0.1f, size.height * -0.1f),
            radius = size.minDimension * 0.7f
        )
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(Color(0xFFFDA4AF).copy(alpha = 0.32f), Color.Transparent),
                center = Offset(size.width * 1.15f, size.height * 0.85f),
                radius = size.minDimension * 0.8f
            ),
            center = Offset(size.width * 1.15f, size.height * 0.85f),
            radius = size.minDimension * 0.8f
        )
    }
}

@Composable
fun glassCardColors(darkTheme: Boolean = isSystemInDarkTheme()) = CardDefaults.cardColors(
    containerColor = if (darkTheme) Color(0x2BFFFFFF) else Color(0x73FFFFFF),
    contentColor = if (darkTheme) Color(0xFFEEEEEE) else Color(0xFF1E293B)
)

@Composable
fun glassCardBorder(darkTheme: Boolean = isSystemInDarkTheme()) = BorderStroke(
    width = 1.2.dp,
    color = if (darkTheme) Color(0x35FFFFFF) else Color(0x90FFFFFF)
)

val GlassCardShape = RoundedCornerShape(24.dp)
val GlassLargeCardShape = RoundedCornerShape(32.dp)
