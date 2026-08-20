package app.minikast.tv

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
import app.minikast.tv.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "miniKastTV"
        private const val PREFS_NAME = "minikast_prefs"
        private const val KEY_SERVER_URL = "server_url"
        private const val AUTO_RETRY_DELAY_MS = 5000L
    }

    private lateinit var binding: ActivityMainBinding
    private lateinit var prefs: SharedPreferences
    private val mainHandler = Handler(Looper.getMainLooper())
    private var isPageLoadedSuccessfully = false
    private var isRetrying = false
    private var connectivityManager: ConnectivityManager? = null
    private var networkCallback: ConnectivityManager.NetworkCallback? = null

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
        // Enable Chrome remote inspection (chrome://inspect on Mac)
        WebView.setWebContentsDebuggingEnabled(true)

        val webView = binding.webView
        val settings = webView.settings

        // Enable JavaScript and local storage capabilities
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true

        // Disable safe browsing check for private local IPs (Android 8+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.safeBrowsingEnabled = false
        }

        // Cache configuration for fast reload & offline fallback
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        // Allow mixed content for local network development
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

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
                    binding.loadingOverlay.visibility = View.VISIBLE
                    binding.errorOverlay.visibility = View.GONE
                }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                Log.d(TAG, "Finished loading URL: $url")
                isPageLoadedSuccessfully = true
                isRetrying = false
                binding.loadingOverlay.visibility = View.GONE
                binding.errorOverlay.visibility = View.GONE
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
                Log.w(TAG, "SSL Certificate Notice on local development: $error. Proceeding...")
                // Allow self-signed SSL certificates for local network testing (e.g. 192.168.x.x)
                handler?.proceed()
            }
        }
    }

    private fun loadPlayerUrl() {
        val serverUrl = getServerUrl()
        Log.d(TAG, "Loading miniKast TV player from: $serverUrl")
        binding.loadingStatusText.text = "Connecting to $serverUrl…"
        binding.loadingOverlay.visibility = View.VISIBLE
        binding.errorOverlay.visibility = View.GONE
        binding.webView.loadUrl(serverUrl)
    }

    private fun getServerUrl(): String {
        val saved = prefs.getString(KEY_SERVER_URL, null)
        if (saved != null && (saved.contains("10.0.2.2") || saved.contains("192.168.4.117") || saved.isEmpty())) {
            prefs.edit().remove(KEY_SERVER_URL).apply()
            return getString(R.string.default_server_url)
        }
        return saved ?: getString(R.string.default_server_url)
    }

    private fun setServerUrl(newUrl: String) {
        prefs.edit().putString(KEY_SERVER_URL, newUrl.trim()).apply()
        isPageLoadedSuccessfully = false
        loadPlayerUrl()
    }

    private fun showErrorAndScheduleRetry(message: String) {
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
