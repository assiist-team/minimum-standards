import UIKit
import React
import React_RCTAppDelegate
import FirebaseCore

@main
class AppDelegate: UIResponder, UIApplicationDelegate, RCTBridgeDelegate {
  var window: UIWindow?
  private var bridge: RCTBridge?
  private let reactModuleName = "MinimumStandardsMobile"

  // Allows forcing the embedded JS bundle even for Debug builds to eliminate Metro from the equation.
  private var shouldForceEmbeddedBundle: Bool {
    guard let flag = ProcessInfo.processInfo.environment["FORCE_EMBEDDED_JS_BUNDLE"]?.lowercased() else {
      return false
    }
    return flag == "1" || flag == "true"
  }

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Configure Firebase BEFORE bootstrapping the React Native bridge.
    FirebaseApp.configure()

    bridge = RCTBridge(delegate: self, launchOptions: launchOptions)
    guard let bridge = bridge else {
      NSLog("[AppDelegate] ERROR: Failed to initialize RCTBridge")
      return false
    }

    let rootView = RCTRootView(bridge: bridge, moduleName: reactModuleName, initialProperties: nil)
    rootView.backgroundColor = UIColor.white

    let rootViewController = UIViewController()
    rootViewController.view = rootView

    window = UIWindow(frame: UIScreen.main.bounds)
    window?.rootViewController = rootViewController
    window?.makeKeyAndVisible()

    NSLog("[AppDelegate] didFinishLaunching completed, moduleName: \(reactModuleName) (Paper bridge)")
    return true
  }

  func sourceURL(for bridge: RCTBridge!) -> URL! {
#if DEBUG
    if shouldForceEmbeddedBundle {
      NSLog("[AppDelegate] FORCE_EMBEDDED_JS_BUNDLE enabled - loading embedded bundle")
      return embeddedBundleURL()
    }
    let metroURL = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    NSLog("[AppDelegate] Using Metro bundle at: \(metroURL?.absoluteString ?? "nil")")
    return metroURL
#else
    NSLog("[AppDelegate] Production build - loading embedded bundle")
    return embeddedBundleURL()
#endif
  }

  private func embeddedBundleURL() -> URL? {
    let url = Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    if let url = url {
      NSLog("[AppDelegate] Found embedded bundle at: \(url.path)")
    } else {
      NSLog("[AppDelegate] ERROR: main.jsbundle not found in app bundle")
    }
    return url
  }

  // Re-add URL handling (e.g., Google Sign-In) here if needed.
}
