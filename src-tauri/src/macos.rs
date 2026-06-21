//! macOS traffic-light (window control button) repositioning.
//!
//! Tauri/tao apply `trafficLightPosition` inside the title bar's `draw_rect`,
//! re-running on every redraw. In release builds, an unfocused window's redraws
//! are aggressively skipped, so the buttons never get repositioned to the custom
//! inset and effectively vanish on blur. We fix that by re-applying the position
//! ourselves on focus/resize/scale-change events (see `lib.rs`).

#![cfg(target_os = "macos")]

use objc2::MainThreadMarker;
use objc2_app_kit::{NSView, NSWindow, NSWindowButton};
use objc2_foundation::NSPoint;
use tauri::{Manager, Runtime, Window};

/// Custom traffic-light origin — kept in sync with `tauri.conf.json`
/// `trafficLightPosition` (the conf value seeds the initial layout; this value
/// re-applies it on events). If you change one, change the other.
pub const TRAFFIC_LIGHT_X: f64 = 12.0;
pub const TRAFFIC_LIGHT_Y: f64 = 16.5;

const BUTTONS: [NSWindowButton; 3] = [
    NSWindowButton::CloseButton,
    NSWindowButton::MiniaturizeButton,
    NSWindowButton::ZoomButton,
];

/// Re-apply the custom traffic-light position. Safe to call from any thread —
/// it hops to the main thread (AppKit requires it) and no-ops if the NSWindow
/// or its buttons aren't realized yet.
pub fn reposition_traffic_lights<R: Runtime>(window: &Window<R>, x: f64, y: f64) {
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
        apply(ns_window, x, y);
    });
}

/// `x` is the inset from the left (AppKit x and conf x share orientation).
/// `fallback_y` is only used if the live close-button frame can't be read —
/// AppKit's y axis is flipped relative to the conf's top-inset, so we reuse the button's
/// current (tao-set) y rather than the raw conf value to avoid a space mismatch.
fn apply(ns_window: &NSWindow, x: f64, fallback_y: f64) {
    // Measure horizontal spacing and the baseline y from the live button frames
    // so the repositioned cluster keeps macOS's exact gaps and vertical offset.
    let mut origins: Vec<NSPoint> = Vec::with_capacity(3);
    for button in BUTTONS {
        if let Some(b) = ns_window.standardWindowButton(button) {
            origins.push(b.frame().origin);
        }
    }
    let y = origins.first().map(|p| p.y).unwrap_or(fallback_y);
    let mut spacing = 20.0_f64; // empirical macOS default gap; overridden below
    if origins.len() >= 2 {
        let measured = (origins[1].x - origins[0].x).abs();
        if measured >= 1.0 {
            spacing = measured;
        }
    }

    // Reposition to the custom inset, unhide, and force a redraw of each button
    // and its title-bar container (the redraw is what the release build skipped).
    for (i, button) in BUTTONS.into_iter().enumerate() {
        let Some(b) = ns_window.standardWindowButton(button) else {
            continue;
        };
        let bx = x + (i as f64) * spacing;
        b.setFrameOrigin(NSPoint::new(bx, y));
        b.setHidden(false);
        // Disambiguate from NSControl's 0-arg setNeedsDisplay.
        NSView::setNeedsDisplay(&b, true);
        if let Some(sv) = unsafe { b.superview() } {
            NSView::setNeedsDisplay(&sv, true);
        }
    }
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
