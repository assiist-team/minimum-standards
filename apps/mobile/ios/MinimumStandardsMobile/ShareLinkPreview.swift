import Foundation
import LinkPresentation
import React
import UIKit

private final class SnapshotShareItemSource: NSObject, UIActivityItemSource {
  private let url: URL
  private let title: String
  private let message: String?
  private let previewImage: UIImage?

  init(url: URL, title: String, message: String?, previewImage: UIImage?) {
    self.url = url
    self.title = title
    self.message = message
    self.previewImage = previewImage
    super.init()
  }

  func activityViewControllerPlaceholderItem(_ activityViewController: UIActivityViewController) -> Any {
    return url
  }

  func activityViewController(
    _ activityViewController: UIActivityViewController,
    itemForActivityType activityType: UIActivity.ActivityType?
  ) -> Any? {
    // Most share targets will accept the URL; we pass message separately as a plain string item.
    return url
  }

  func activityViewControllerLinkMetadata(_ activityViewController: UIActivityViewController) -> LPLinkMetadata? {
    let metadata = LPLinkMetadata()
    metadata.originalURL = url
    metadata.url = url
    metadata.title = title

    if let image = previewImage {
      let provider = NSItemProvider(object: image)
      metadata.iconProvider = provider
      metadata.imageProvider = provider
    }

    return metadata
  }
}

@objc(ShareLinkPreview)
final class ShareLinkPreview: NSObject, RCTBridgeModule {
  static func moduleName() -> String! {
    return "ShareLinkPreview"
  }

  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  @objc(share:resolver:rejecter:)
  func share(
    _ options: NSDictionary,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      guard let urlString = options["url"] as? String, let url = URL(string: urlString) else {
        reject("invalid_url", "Missing or invalid url", nil)
        return
      }

      let title = (options["title"] as? String) ?? "Minimum Standards"
      let message = options["message"] as? String

      // We reuse the existing LaunchImage asset which already contains the app logo.
      let previewImage = UIImage(named: "LaunchImage")
      let itemSource = SnapshotShareItemSource(url: url, title: title, message: message, previewImage: previewImage)

      var activityItems: [Any] = []
      if let message {
        activityItems.append(message)
      }
      activityItems.append(itemSource)

      let controller = UIActivityViewController(activityItems: activityItems, applicationActivities: nil)

      if let popover = controller.popoverPresentationController {
        if let presented = Self.topViewController() {
          popover.sourceView = presented.view
          popover.sourceRect = CGRect(
            x: presented.view.bounds.midX,
            y: presented.view.bounds.midY,
            width: 1,
            height: 1
          )
          popover.permittedArrowDirections = []
        }
      }

      controller.completionWithItemsHandler = { _, completed, _, error in
        if let error {
          reject("share_failed", error.localizedDescription, error)
          return
        }
        resolve(["completed": completed])
      }

      guard let presented = Self.topViewController() else {
        reject("no_presenting_view_controller", "Unable to find a view controller to present share sheet", nil)
        return
      }
      presented.present(controller, animated: true)
    }
  }

  private static func topViewController() -> UIViewController? {
    guard let scene = UIApplication.shared.connectedScenes
      .compactMap({ $0 as? UIWindowScene })
      .first(where: { $0.activationState == .foregroundActive || $0.activationState == .foregroundInactive })
    else {
      return nil
    }
    guard let window = scene.windows.first(where: { $0.isKeyWindow }) ?? scene.windows.first else {
      return nil
    }
    return topViewController(from: window.rootViewController)
  }

  private static func topViewController(from root: UIViewController?) -> UIViewController? {
    if let nav = root as? UINavigationController {
      return topViewController(from: nav.visibleViewController)
    }
    if let tab = root as? UITabBarController {
      return topViewController(from: tab.selectedViewController)
    }
    if let presented = root?.presentedViewController {
      return topViewController(from: presented)
    }
    return root
  }
}

