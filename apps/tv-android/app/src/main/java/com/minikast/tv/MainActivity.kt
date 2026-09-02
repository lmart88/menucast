package com.minikast.tv

import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.Context
import android.content.SharedPreferences
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.http.SslError
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.SslErrorHandler
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.minikast.tv.databinding.ActivityMainBinding
import java.net.URI

class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "miniKastTV"
        private const val PREFS_NAME = "minikast_prefs"
        private const val KEY_SERVER_URL = "server_url"
        private const val AUTO_RETRY_DELAY_MS = 5000L
        private const val FADE_TRANSITION_DURATION_MS = 300L
    }

    private lateinit var binding: ActivityMainBinding
    private lateinit var prefs: SharedPreferences
    private val mainHandler = Handler(Looper.getMainLooper())
    private var isPageLoadedSuccessfully = false
    private var isRetrying = false
    private var connectivityManager: ConnectivityManager? = null
    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private var pulseAnimator: ObjectAnimator? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. Keep TV screen on 24/7 (Prevent sleep/standby)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        // 2. Configure fullscreen immersive mode
        hideSystemUI()

        // 3. Configure Hardware-Accelerated WebView
        setupWebView()

        // 4. Setup Action buttons
        binding.retryButton.setOnClickListener {
            loadPlayerUrl()
        }
        binding.settingsButton.setOnClickListener {
            showServerUrlDialog()
        }

        // 5. Setup Network Watchdog
        setupNetworkCallback()

        // 6. Load the TV player
        loadPlayerUrl()
    }

    override fun onResume() {
        super.onResume()
        hideSystemUI()
        binding.webView.onResume()
    }

    override fun onPause() {
        super.onPause()
        binding.webView.onPause()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopPulsingAnimation()
        networkCallback?.let { connectivityManager?.unregisterNetworkCallback(it) }
        binding.webView.destroy()
    }

    private fun hideSystemUI() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let { controller ->
                controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                controller.systemBarsBehavior =
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                )
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        // Enable Chrome remote inspection only in debug builds
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true)
        }

        val webView = binding.webView
        val settings = webView.settings

        // Enable JavaScript and local storage capabilities
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true

        // Disable safe browsing check for private local IPs in debug only
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.safeBrowsingEnabled = !BuildConfig.DEBUG
        }

        // Cache configuration for fast reload & offline fallback
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        // Mixed content configuration
        settings.mixedContentMode = if (BuildConfig.DEBUG) {
            WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        } else {
            WebSettings.MIXED_CONTENT_NEVER_ALLOW
        }

        // TV hardware acceleration
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        webView.isFocusable = true
        webView.isFocusableInTouchMode = true

        // WebChromeClient for console logging and JS alerts
        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                Log.d(TAG, "[WebView Console] ${consoleMessage?.message()} (${consoleMessage?.sourceId()}:${consoleMessage?.lineNumber()})")
                return true
            }
        }

        // WebViewClient for navigation and error handling
        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                Log.d(TAG, "Starting URL load: $url")
                if (!isPageLoadedSuccessfully) {
                    binding.loadingOverlay.alpha = 1f
                    binding.loadingOverlay.visibility = View.VISIBLE
                    binding.errorOverlay.visibility = View.GONE
                    startPulsingAnimation()
                }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                Log.d(TAG, "Finished loading URL: $url")
                isPageLoadedSuccessfully = true
                isRetrying = false
                stopPulsingAnimation()
                binding.errorOverlay.visibility = View.GONE

                // Smooth 300ms alpha crossfade to reveal live player
                binding.loadingOverlay.animate()
                    .alpha(0f)
                    .setDuration(FADE_TRANSITION_DURATION_MS)
                    .withEndAction {
                        binding.loadingOverlay.visibility = View.GONE
                    }
                    .start()
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                // Only handle main frame navigation errors
                if (request?.isForMainFrame == true) {
                    val errorCode = error?.errorCode ?: -1
                    val description = error?.description ?: "Unknown error"
                    Log.e(TAG, "Main frame error ($errorCode): $description for ${request.url}")
                    showErrorAndScheduleRetry("Failed to load: $description\n(${request.url})")
                }
            }

            override fun onReceivedHttpError(
                view: WebView?,
                request: WebResourceRequest?,
                errorResponse: android.webkit.WebResourceResponse?
            ) {
                if (request?.isForMainFrame == true) {
                    val statusCode = errorResponse?.statusCode ?: -1
                    Log.e(TAG, "HTTP error ($statusCode) for ${request.url}")
                    showErrorAndScheduleRetry("HTTP Error $statusCode for ${request.url}")
                }
            }

            override fun onReceivedSslError(
                view: WebView?,
                handler: SslErrorHandler?,
                error: SslError?
            ) {
                if (BuildConfig.DEBUG) {
                    Log.w(TAG, "SSL Certificate Notice (Debug): $error. Proceeding for local dev...")
                    handler?.proceed()
                } else {
                    Log.e(TAG, "SSL Certificate Error (Release): $error. Cancelling navigation.")
                    handler?.cancel()
                    showErrorAndScheduleRetry("SSL Security Error: Untrusted certificate.")
                }
            }
        }
    }

    private fun loadPlayerUrl() {
        val serverUrl = getServerUrl()
        val displayHost = getDisplayHostName(serverUrl)
        Log.d(TAG, "Loading miniKast TV player from: $serverUrl (Host: $displayHost)")

        binding.loadingStatusText.text = getString(R.string.connecting_to_server, displayHost)
        binding.loadingOverlay.alpha = 1f
        binding.loadingOverlay.visibility = View.VISIBLE
        binding.errorOverlay.visibility = View.GONE
        startPulsingAnimation()

        binding.webView.loadUrl(serverUrl)
    }

    private fun getDisplayHostName(urlStr: String): String {
        return try {
            val uri = URI(urlStr)
            val host = uri.host
            if (host.isNullOrBlank() || host.contains("minikast.com", ignoreCase = true)) {
                "miniKast.com"
            } else {
                host
            }
        } catch (e: Exception) {
            "miniKast.com"
        }
    }

    private fun startPulsingAnimation() {
        pulseAnimator?.cancel()
        pulseAnimator = ObjectAnimator.ofFloat(
            binding.loadingStatusText,
            View.ALPHA,
            1.0f,
            0.45f,
            1.0f
        ).apply {
            duration = 2000L
            repeatCount = ValueAnimator.INFINITE
            start()
        }
    }

    private fun stopPulsingAnimation() {
        pulseAnimator?.cancel()
        pulseAnimator = null
        binding.loadingStatusText.alpha = 1.0f
    }

    private fun getServerUrl(): String {
        val saved = prefs.getString(KEY_SERVER_URL, null)
        if (!saved.isNullOrBlank()) {
            return saved
        }
        return getString(R.string.default_server_url)
    }

    private fun setServerUrl(newUrl: String) {
        prefs.edit().putString(KEY_SERVER_URL, newUrl.trim()).apply()
        isPageLoadedSuccessfully = false
        loadPlayerUrl()
    }

    private fun showErrorAndScheduleRetry(message: String) {
        stopPulsingAnimation()
        binding.loadingOverlay.visibility = View.GONE
        binding.errorOverlay.visibility = View.VISIBLE
        binding.errorMessageText.text = "Connection lost: $message\nRetrying automatically in 5s…"

        if (!isRetrying) {
            isRetrying = true
            mainHandler.postDelayed({
                if (binding.errorOverlay.visibility == View.VISIBLE) {
                    Log.d(TAG, "Auto-retry triggering reload…")
                    loadPlayerUrl()
                }
            }, AUTO_RETRY_DELAY_MS)
        }
    }

    private fun setupNetworkCallback() {
        connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                Log.d(TAG, "Internet connection restored!")
                mainHandler.post {
                    if (binding.errorOverlay.visibility == View.VISIBLE) {
                        loadPlayerUrl()
                    }
                }
            }
        }

        connectivityManager?.registerNetworkCallback(request, networkCallback!!)
    }

    // Remote Control Key Handling
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            KeyEvent.KEYCODE_MENU -> {
                // Menu button on Fire TV remote -> Show Server URL settings
                showServerUrlDialog()
                return true
            }
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE, KeyEvent.KEYCODE_R -> {
                // Play/Pause or R key -> Refresh player
                Toast.makeText(this, "Refreshing player…", Toast.LENGTH_SHORT).show()
                binding.webView.reload()
                return true
            }
            KeyEvent.KEYCODE_BACK -> {
                // Prevent accidental exit on remote Back click
                if (binding.webView.canGoBack()) {
                    binding.webView.goBack()
                    return true
                }
                showExitConfirmationDialog()
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    private fun showServerUrlDialog() {
        val input = EditText(this).apply {
            setText(getServerUrl())
            setSelection(text.length)
        }

        AlertDialog.Builder(this)
            .setTitle(R.string.change_server_url)
            .setMessage("Enter the URL of your miniKast TV web client:")
            .setView(input)
            .setPositiveButton("Save & Reload") { _, _ ->
                val newUrl = input.text.toString().trim()
                if (newUrl.isNotEmpty()) {
                    setServerUrl(newUrl)
                }
            }
            .setNeutralButton("Reset Default") { _, _ ->
                prefs.edit().remove(KEY_SERVER_URL).apply()
                loadPlayerUrl()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showExitConfirmationDialog() {
        AlertDialog.Builder(this)
            .setTitle("Exit miniKast TV?")
            .setMessage("Are you sure you want to close the display player?")
            .setPositiveButton("Exit") { _, _ -> finish() }
            .setNegativeButton("Stay", null)
            .show()
    }
}
