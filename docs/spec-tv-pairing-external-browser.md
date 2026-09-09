# Product Requirements Document (PRD) / Feature Spec: External Browser Launch for TV Pairing Link (No In-App Redirects)

**Document Status**: `Implemented & Verified`  
**Feature ID**: `FEAT-TV-PAIRING-EXTERNAL-BROWSER`  
**Target Modules**:
- Android TV App: `apps/tv-android/app/src/main/java/com/minikast/tv/MainActivity.kt`
- Web Player / PWA: `apps/web/app/tv/page.tsx`
**Created**: 2026-09-09  

---

## 1. Executive Summary & Problem Statement

### 1.1 Problem Statement
When a user launches the miniKast TV application (Android TV / Fire TV APK or Standalone Web/PWA Player at `/tv`) and clicks or selects the pairing URL displayed on screen:
1. **In-App In-Place Navigation**: The WebView or PWA container navigates in-place from `/tv` to `/pair?code=<CODE>`.
2. **Cascading Redirects**: Because the TV player instance does not have a user authentication cookie, `/pair` detects `status === "unauthenticated"` and immediately redirects the TV display to `/login?callbackUrl=...` (and subsequently to `/dashboard`).
3. **Broken TV Display State**: The TV screen ceases to act as a digital signage display/pairing beacon and gets permanently stuck on a web dashboard/login form inside the TV player window.

### 1.2 Objective
- **Zero In-App Navigation**: Ensure the TV display never navigates away from `/tv` or redirects to `/login`/`/dashboard` inside the TV app instance.
- **External Browser Delegation**:
  - In the Android TV / Fire TV app: Intercept all outgoing links (`/pair`, etc.) in `WebViewClient.shouldOverrideUrlLoading` and launch them via `Intent.ACTION_VIEW` in an external system browser (Chrome, Silk, Firefox, etc.) outside the app.
  - In Web / PWA / Desktop: Launch the pairing URL in a dedicated external browser tab/window (`window.open(url, '_blank', 'noopener,noreferrer')`), keeping the TV player tab intact and live on `/tv`.

---

## 2. User Personas & Scenarios

| Persona | Environment | Expected Experience |
|---|---|---|
| **Carlos (Restaurant Owner / GM)** | Android TV / Fire TV Stick | Clicks the pairing link using a remote or air mouse. The TV display stays on the `/tv` pairing screen, while Android launches the system browser (or Silk/Chrome) in a separate task. When paired, the TV immediately transitions to the paired state. |
| **Maya (Designer) / Developer** | Desktop / Laptop Browser | Clicks the manual pairing link on `/tv`. A new browser tab opens at `/pair?code=...` where Maya logs in and pairs the display. The original `/tv` tab remains open and automatically detects the pairing event. |

---

## 3. Functional Requirements (FR)

### FR-1: Android TV WebView Interception (`apps/tv-android`)
- **FR-1.1**: `MainActivity.kt` must implement `shouldOverrideUrlLoading` in `webViewClient` (supporting both modern `WebResourceRequest` and legacy URL signatures).
- **FR-1.2**: Any URL destination that is **not** the internal `/tv` player host/route must be intercepted.
- **FR-1.3**: When intercepted, construct an `Intent(Intent.ACTION_VIEW, Uri.parse(url))` with `FLAG_ACTIVITY_NEW_TASK` to open the URL in the device's default web browser outside the miniKast app.
- **FR-1.4**: If no browser is installed or the intent fails, gracefully catch the exception, log the error, and prevent the WebView from navigating to `/login` or `/dashboard`.

### FR-2: Web / PWA / Desktop Player Handling (`apps/web/app/tv/page.tsx`)
- **FR-2.1**: The pairing link must have `target="_blank"` and `rel="noopener noreferrer"`.
- **FR-2.2**: The click handler must call `window.open(pairUrl, '_blank', 'noopener,noreferrer')` and call `e.stopPropagation()` / prevent in-app frame redirects.
- **FR-2.3**: Under no circumstance should the current window/tab navigate away from the `/tv` state.

---

## 4. Technical Implementation Details

### 4.1 Android TV (`MainActivity.kt`)
```kotlin
override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
    val uri = request?.url ?: return false
    return handleExternalUrl(view, uri)
}

@Deprecated("Deprecated in Java")
override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
    val uri = if (url != null) Uri.parse(url) else return false
    return handleExternalUrl(view, uri)
}

private fun handleExternalUrl(view: WebView?, uri: Uri): Boolean {
    val urlString = uri.toString()
    // Allow internal navigation within /tv player only (excluding /pair or other app routes)
    if (urlString.contains("/tv") && !urlString.contains("/pair")) {
        return false
    }

    return try {
        val intent = Intent(Intent.ACTION_VIEW, uri).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        view?.context?.startActivity(intent)
        true
    } catch (e: Exception) {
        Log.e(TAG, "Failed to launch external browser for $uri", e)
        // Consume event so WebView does NOT navigate in-place
        true
    }
}
```

### 4.2 Web App (`apps/web/app/tv/page.tsx`)
```tsx
<a
  href={pairUrl}
  target="_blank"
  rel="noopener noreferrer"
  onClick={(e) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.open(pairUrl, "_blank", "noopener,noreferrer");
    }
  }}
  className="text-[var(--foreground)] hover:text-[var(--accent)] underline transition-colors break-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded cursor-pointer inline-flex items-center gap-1 font-semibold"
  title="Open pairing URL in new tab"
>
  <span>{appUrl}/pair?code={pairingCode}</span>
  <svg className="size-3 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
</a>
```

---

## 5. Acceptance Criteria (Given / When / Then)

### Scenario 1: User clicks pairing URL on Android TV App
- **Given** the miniKast Android TV app is running on `/tv` showing the pairing screen,
- **When** the user clicks the manual pairing link,
- **Then** Android launches the system browser with the pairing URL in a separate app window,
- **And** the miniKast TV app remains in the foreground on `/tv`, never redirecting to `/login` or `/dashboard`.

### Scenario 2: User clicks pairing URL in browser / PWA
- **Given** the user is viewing `/tv` in a browser or PWA window,
- **When** the user clicks the manual pairing link,
- **Then** a new browser tab opens at `${appUrl}/pair?code=<CODE>`,
- **And** the original `/tv` tab remains untouched and active.

---

## 6. Verification Plan

1. **Android TV Build & Static Verification**:
   - Verify `MainActivity.kt` compiles with `shouldOverrideUrlLoading` properly handling `Intent.ACTION_VIEW`.
2. **Web Build**:
   - Run `pnpm --filter web build` to ensure type-safety and bundle integrity.
3. **Behavioral Test**:
   - Verify that clicking the link never changes `window.location` in the current tab/view.
