package de.infinitymade.luminofit;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.provider.MediaStore;
import android.text.TextUtils;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.MimeTypeMap;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;

import androidx.core.content.FileProvider;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class MainActivity extends Activity {

    interface PermissionResult {
        void onResult(boolean granted);
    }

    private static final int REQ_FILE = 1;
    private static final int REQ_CAMERA = 2;
    private static final int REQ_PERMISSIONS = 100;

    private Uri appUri;
    private WebView webView;
    private ProgressBar progress;
    private View offline;
    private NativeBridge bridge;
    private String bridgeJs;
    private boolean mainFrameFailed;

    private ValueCallback<Uri[]> fileCallback;
    private Uri cameraOutput;

    private int nextPermissionRequest = REQ_PERMISSIONS;
    private final android.util.SparseArray<PermissionResult> permissionCallbacks = new android.util.SparseArray<>();

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        appUri = Uri.parse(BuildConfig.APP_URL);
        webView = findViewById(R.id.webview);
        progress = findViewById(R.id.progress);
        offline = findViewById(R.id.offline);
        findViewById(R.id.retry).setOnClickListener(v -> reload());

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setSupportMultipleWindows(true);
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        s.setAllowFileAccess(false);
        s.setUserAgentString(s.getUserAgentString() + " LuminoFitAndroid/" + BuildConfig.VERSION_NAME);

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        bridge = new NativeBridge(this, webView);
        webView.addJavascriptInterface(bridge, "LuminoNative");
        bridgeJs = readAsset("bridge.js");
        boolean documentStartScript = WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT);
        if (documentStartScript) {
            Set<String> origins = Collections.singleton(appUri.getScheme() + "://" + appUri.getHost());
            WebViewCompat.addDocumentStartJavaScript(webView, bridgeJs, origins);
        }

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleExternal(request.getUrl());
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                mainFrameFailed = false;
                // Older WebViews without document-start scripts: inject as early as possible.
                if (!documentStartScript && isAppUrl(Uri.parse(url))) view.evaluateJavascript(bridgeJs, null);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (!documentStartScript && isAppUrl(Uri.parse(url))) view.evaluateJavascript(bridgeJs, null);
                CookieManager.getInstance().flush();
                if (!mainFrameFailed) offline.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    mainFrameFailed = true;
                    offline.setVisibility(View.VISIBLE);
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progress.setProgress(newProgress);
                progress.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> handleWebPermission(request));
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                return openFileChooser(callback, params);
            }

            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                // target="_blank" / window.open: catch the URL in a throwaway WebView, then route it.
                WebView popup = new WebView(MainActivity.this);
                popup.setWebViewClient(new WebViewClient() {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest request) {
                        Uri uri = request.getUrl();
                        if (!handleExternal(uri)) webView.loadUrl(uri.toString());
                        v.destroy();
                        return true;
                    }
                });
                WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                transport.setWebView(popup);
                resultMsg.sendToTarget();
                return true;
            }
        });

        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) ->
                openExternal(Uri.parse(url)));

        if (savedInstanceState != null) webView.restoreState(savedInstanceState);
        else webView.loadUrl(appUri.toString());
    }

    private void reload() {
        offline.setVisibility(View.GONE);
        String current = webView.getUrl();
        if (TextUtils.isEmpty(current) || "about:blank".equals(current)) webView.loadUrl(appUri.toString());
        else webView.reload();
    }

    // ── Navigation ────────────────────────────────────────────────────

    private boolean isAppUrl(Uri uri) {
        String host = uri.getHost();
        return host != null && host.equalsIgnoreCase(appUri.getHost());
    }

    /** Returns true when the URL was handed to another app instead of loading in the WebView. */
    private boolean handleExternal(Uri uri) {
        String scheme = uri.getScheme();
        if (("https".equals(scheme) || "http".equals(scheme)) && isAppUrl(uri)) return false;
        if ("about".equals(scheme) || "blob".equals(scheme) || "data".equals(scheme)) return false;
        openExternal(uri);
        return true;
    }

    private void openExternal(Uri uri) {
        try {
            Intent intent;
            if ("intent".equals(uri.getScheme())) {
                intent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME);
                intent.addCategory(Intent.CATEGORY_BROWSABLE);
                intent.setComponent(null);
                intent.setSelector(null);
            } else {
                intent = new Intent(Intent.ACTION_VIEW, uri);
            }
            startActivity(intent);
        } catch (ActivityNotFoundException | java.net.URISyntaxException ignored) {
            // No app can open this link.
        }
    }

    @Override
    public void onBackPressed() {
        // Close an open sheet/modal first (the web app closes them on Escape),
        // otherwise go back in history, otherwise leave the app running in the background.
        String js = "(function(){var n=document.querySelectorAll('[role=dialog]').length;"
                + "if(n){document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));}return n;})()";
        webView.evaluateJavascript(js, before -> {
            int open = parseInt(before);
            if (open == 0) {
                navigateBack();
                return;
            }
            webView.postDelayed(() -> webView.evaluateJavascript(
                    "document.querySelectorAll('[role=dialog]').length",
                    after -> {
                        // The modal ignored Escape: fall back to normal back navigation.
                        if (parseInt(after) >= open) navigateBack();
                    }), 250);
        });
    }

    private void navigateBack() {
        if (webView.canGoBack()) webView.goBack();
        else moveTaskToBack(true);
    }

    private static int parseInt(String s) {
        try {
            return (int) Double.parseDouble(s);
        } catch (Exception e) {
            return 0;
        }
    }

    // ── Camera / microphone for getUserMedia ──────────────────────────

    private void handleWebPermission(PermissionRequest request) {
        if (!isAppUrl(request.getOrigin())) {
            request.deny();
            return;
        }
        List<String> needed = new ArrayList<>();
        List<String> granted = new ArrayList<>();
        for (String r : request.getResources()) {
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) {
                needed.add(Manifest.permission.CAMERA);
                granted.add(r);
            } else if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r)) {
                needed.add(Manifest.permission.RECORD_AUDIO);
                granted.add(r);
            }
        }
        if (granted.isEmpty()) {
            request.deny();
            return;
        }
        requestPermissions(needed.toArray(new String[0]), ok -> {
            if (ok) request.grant(granted.toArray(new String[0]));
            else request.deny();
        });
    }

    boolean hasPermission(String permission) {
        return checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED;
    }

    void requestPermissions(String[] permissions, PermissionResult result) {
        List<String> missing = new ArrayList<>();
        for (String p : permissions) if (!hasPermission(p)) missing.add(p);
        if (missing.isEmpty()) {
            result.onResult(true);
            return;
        }
        int code = nextPermissionRequest++;
        permissionCallbacks.put(code, result);
        requestPermissions(missing.toArray(new String[0]), code);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        PermissionResult cb = permissionCallbacks.get(requestCode);
        if (cb == null) return;
        permissionCallbacks.remove(requestCode);
        boolean ok = grantResults.length > 0;
        for (int g : grantResults) ok &= g == PackageManager.PERMISSION_GRANTED;
        cb.onResult(ok);
    }

    // ── <input type="file"> ───────────────────────────────────────────

    private boolean openFileChooser(ValueCallback<Uri[]> callback, WebChromeClient.FileChooserParams params) {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        fileCallback = callback;

        String[] mimeTypes = mimeTypes(params.getAcceptTypes());
        boolean images = mimeTypes.length == 0;
        for (String m : mimeTypes) images |= m.startsWith("image/") || m.equals("*/*");

        if (params.isCaptureEnabled() && images) {
            requestPermissions(new String[]{Manifest.permission.CAMERA}, ok -> {
                Intent camera = ok ? cameraIntent() : null;
                if (camera != null) startForFile(camera, REQ_CAMERA);
                else finishFileChooser(null);
            });
            return true;
        }

        Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
        pick.addCategory(Intent.CATEGORY_OPENABLE);
        pick.setType(mimeTypes.length == 1 ? mimeTypes[0] : "*/*");
        if (mimeTypes.length > 1) pick.putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes);
        if (params.getMode() == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE) {
            pick.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        }
        Intent chooser = Intent.createChooser(pick, getString(R.string.choose_file));
        if (images && hasPermission(Manifest.permission.CAMERA)) {
            Intent camera = cameraIntent();
            if (camera != null) chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{camera});
        }
        startForFile(chooser, REQ_FILE);
        return true;
    }

    private void startForFile(Intent intent, int requestCode) {
        try {
            startActivityForResult(intent, requestCode);
        } catch (ActivityNotFoundException e) {
            finishFileChooser(null);
        }
    }

    private Intent cameraIntent() {
        try {
            File dir = new File(getCacheDir(), "camera");
            if (!dir.exists() && !dir.mkdirs()) return null;
            File photo = File.createTempFile("photo_", ".jpg", dir);
            cameraOutput = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", photo);
            Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            intent.putExtra(MediaStore.EXTRA_OUTPUT, cameraOutput);
            intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.setClipData(ClipData.newRawUri("", cameraOutput));
            return intent;
        } catch (IOException | IllegalArgumentException e) {
            return null;
        }
    }

    private static String[] mimeTypes(String[] accept) {
        Set<String> out = new LinkedHashSet<>();
        if (accept != null) {
            for (String raw : accept) {
                for (String part : raw.split(",")) {
                    String t = part.trim().toLowerCase();
                    if (t.isEmpty()) continue;
                    if (t.startsWith(".")) {
                        String m = MimeTypeMap.getSingleton().getMimeTypeFromExtension(t.substring(1));
                        if (m != null) out.add(m);
                    } else {
                        out.add(t);
                    }
                }
            }
        }
        return out.toArray(new String[0]);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode != REQ_FILE && requestCode != REQ_CAMERA) {
            super.onActivityResult(requestCode, resultCode, data);
            return;
        }
        if (resultCode != RESULT_OK) {
            finishFileChooser(null);
            return;
        }
        List<Uri> uris = new ArrayList<>();
        if (data != null && data.getClipData() != null && requestCode == REQ_FILE) {
            ClipData clip = data.getClipData();
            for (int i = 0; i < clip.getItemCount(); i++) {
                Uri u = clip.getItemAt(i).getUri();
                if (u != null) uris.add(u);
            }
        } else if (data != null && data.getData() != null) {
            uris.add(data.getData());
        }
        // Camera apps (directly or via the chooser's extra intent) write to cameraOutput and return no data.
        if (uris.isEmpty() && cameraOutput != null) uris.add(cameraOutput);
        finishFileChooser(uris.isEmpty() ? null : uris.toArray(new Uri[0]));
    }

    private void finishFileChooser(Uri[] result) {
        if (fileCallback != null) fileCallback.onReceiveValue(result);
        fileCallback = null;
        cameraOutput = null;
    }

    // ── Lifecycle ─────────────────────────────────────────────────────

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }

    @Override
    protected void onPause() {
        webView.onPause();
        CookieManager.getInstance().flush();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        bridge.destroy();
        webView.destroy();
        super.onDestroy();
    }

    private String readAsset(String name) {
        try (InputStream in = getAssets().open(name)) {
            byte[] buf = new byte[in.available()];
            int read = 0;
            while (read < buf.length) {
                int n = in.read(buf, read, buf.length - read);
                if (n < 0) break;
                read += n;
            }
            return new String(buf, 0, read, StandardCharsets.UTF_8);
        } catch (IOException e) {
            return "";
        }
    }
}
