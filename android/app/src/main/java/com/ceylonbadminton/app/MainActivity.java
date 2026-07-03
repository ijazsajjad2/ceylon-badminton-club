package com.ceylonbadminton.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

/**
 * Standalone shell for the Ceylon Badminton Club app.
 *
 * The production build of the website (vite's dist/) is bundled into this
 * APK's assets at build time and served to an embedded WebView over the
 * virtual https origin below via WebViewAssetLoader. An https origin (rather
 * than file://) matters: it's a secure context, which the site's login needs
 * (crypto.subtle) and which keeps localStorage scoped sanely. The app
 * therefore works with no server and no DNS — fully offline — while
 * network-dependent extras (analytics, optional Supabase sync, YouTube
 * thumbnails) light up when a connection exists.
 */
public class MainActivity extends Activity {

    private static final String APP_HOST = "appassets.androidapp.com";
    private static final String START_URL = "https://" + APP_HOST + "/index.html";

    private WebView webView;
    private SwipeRefreshLayout swipe;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);

        // Pull-to-refresh, the way members expect from native apps. Only
        // triggers when the page itself is scrolled to the very top.
        swipe = new SwipeRefreshLayout(this);
        swipe.addView(webView);
        swipe.setColorSchemeColors(Color.parseColor("#E23B3B"), Color.parseColor("#2F7BF0"));
        swipe.setProgressBackgroundColorSchemeColor(Color.parseColor("#101527"));
        swipe.setOnRefreshListener(() -> webView.reload());
        swipe.setOnChildScrollUpCallback((parent, child) -> webView.getScrollY() > 0);
        setContentView(swipe);

        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .setDomain(APP_HOST)
                .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);

        // Matches the site's --bg color so there's no white flash before load.
        webView.setBackgroundColor(Color.parseColor("#0A1020"));

        webView.setWebViewClient(new WebViewClientCompat() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                // Bundled-site requests are answered from assets; anything else
                // (fonts, analytics, Supabase, video thumbs) returns null and
                // goes to the network as normal.
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(@NonNull WebView view, @NonNull WebResourceRequest request) {
                Uri url = request.getUrl();
                if (APP_HOST.equals(url.getHost())) {
                    return false; // in-app navigation stays in the WebView
                }
                // External links (WhatsApp, YouTube, maps, mailto…) open in the
                // matching app / browser instead of hijacking the club app.
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, url));
                } catch (ActivityNotFoundException ignored) {
                    // No handler for this scheme — swallow rather than crash.
                }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (swipe != null) swipe.setRefreshing(false);
            }
        });

        if (savedInstanceState == null) {
            webView.loadUrl(START_URL);
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
