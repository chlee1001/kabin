//! macOS traffic-light (window control button) visibility.
//!
//! Tauri/tao position `trafficLightPosition` inside the title bar's `draw_rect`,
//! re-running on every redraw. In release builds an unfocused window's redraws
//! are aggressively skipped, so the buttons effectively vanish on blur. We force
//! them visible and request a redraw on focus/resize events (see `lib.rs`).
//! Positioning stays entirely with tao via the conf value, so this never fights
//! the layout — it only restores visibility.

#![cfg(target_os = "macos")]

use objc2::MainThreadMarker;
use objc2_app_kit::{NSView, NSWindow, NSWindowButton};
use tauri::{Manager, Runtime, Window};

const BUTTONS: [NSWindowButton; 3] = [
    NSWindowButton::CloseButton,
    NSWindowButton::MiniaturizeButton,
    NSWindowButton::ZoomButton,
];

/// Force the traffic lights visible and request a redraw. Safe to call from any
/// thread — it hops to the main thread (AppKit requires it) and no-ops if the
/// NSWindow or its buttons aren't realized yet. Positioning is left to tao.
pub fn ensure_traffic_lights_visible<R: Runtime>(window: &Window<R>) {
    let Ok(ns_window_ptr) = window.ns_window() else {
        return;
    };
    if ns_window_ptr.is_null() {
        return;
    }
    // `ns_window()` hands back an *autoreleased* pointer (+0). It stays valid only
    // until the current autorelease pool drains — NOT for the window's lifetime.
    // This is sound only because `run_on_main_thread`, when already on the main
    // thread (where `on_window_event` fires), runs the closure *synchronously*
    // within this call stack, before the pool drains. Do NOT refactor to deferred
    // dispatch without retaining the window first.
    let addr = ns_window_ptr as usize;
    let _ = window.app_handle().run_on_main_thread(move || {
        // Guaranteed main thread inside this closure.
        let Some(_mtm) = MainThreadMarker::new() else {
            return;
        };
        let ns_window: &NSWindow = unsafe { &*(addr as *const NSWindow) };
        for button in BUTTONS {
            let Some(b) = ns_window.standardWindowButton(button) else {
                continue;
            };
            b.setHidden(false);
            // Disambiguate from NSControl's 0-arg setNeedsDisplay.
            NSView::setNeedsDisplay(&b, true);
            if let Some(sv) = unsafe { b.superview() } {
                NSView::setNeedsDisplay(&sv, true);
            }
        }
    });
}

/// One-line stderr dump of each traffic-light button's state. Run the release
/// `.app` from a terminal to capture this — it confirms whether the buttons are
/// hidden / off-screen / detached on blur, distinguishing the redraw hypothesis
/// from a contrast/visibility one without guessing.
pub fn dump_traffic_lights<R: Runtime>(window: &Window<R>, tag: &str) {
    // Opt-in only: set KABIN_TL_DEBUG=1 when running the release .app from a
    // terminal to capture button state. Off by default so users see no noise.
    if std::env::var_os("KABIN_TL_DEBUG").is_none() {
        return;
    }
    let Ok(ns_window_ptr) = window.ns_window() else {
        return;
    };
    if ns_window_ptr.is_null() {
        return;
    }
    let addr = ns_window_ptr as usize;
    let tag = tag.to_string();
    let _ = window.app_handle().run_on_main_thread(move || {
        if MainThreadMarker::new().is_none() {
            return;
        }
        let ns_window: &NSWindow = unsafe { &*(addr as *const NSWindow) };
        for (name, button) in [
            ("close", NSWindowButton::CloseButton),
            ("min", NSWindowButton::MiniaturizeButton),
            ("zoom", NSWindowButton::ZoomButton),
        ] {
            match ns_window.standardWindowButton(button) {
                Some(b) => {
                    let f = b.frame();
                    let hidden = b.isHidden();
                    let alpha = b.alphaValue();
                    let has_sv = unsafe { b.superview() }.is_some();
                    eprintln!(
                        "[traffic-light:{tag}] {name}: hidden={hidden} alpha={alpha:.2} origin=({:.1},{:.1}) size=({:.1}x{:.1}) superview={has_sv}",
                        f.origin.x, f.origin.y, f.size.width, f.size.height
                    );
                }
                None => eprintln!("[traffic-light:{tag}] {name}: <none>"),
            }
        }
    });
}
