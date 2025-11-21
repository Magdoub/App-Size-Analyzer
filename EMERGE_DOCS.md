# Emerge Tools - Size Insights Guide

## Overview
Emerge gives you actionable insights that will easily reduce the size of your app. For each insight, you'll see an estimated size reduction if you implement the change.

---

## 1. Remove Duplicates

If the same file appears twice, Emerge flags it as a duplicate. In most cases you can delete the duplicate copies of the file to save size. In addition to duplicate files, resources in asset catalogs can also be flagged as duplicates.

### iOS: Duplicates in frameworks

In some cases you may need to use a resource from your main app and an embedded plugin, such as a Siri extension. If you have one copy of your files in the main app bundle and a second copy in a framework (used by the Siri extension), you can delete the copy in the main app and only reference the framework.

Here's an example of a typical file structure that will be flagged as duplicates:

```
- MyAwesomeApp.app
  - Assets.car
    - myImage.jpg
  - MyFramework.framework
    - Assets.car
      - myImage.jpg
```

In this case, you can delete the myImage.jpg from the root level Assets.car.

⚠️ **Update references to new bundles:** If you remove a resource from the main bundle, make sure you update any code referencing this resource to load it from the framework's bundle.

You can update code to load an image from a new bundle like this:

```swift
// Before: Loading from the main bundle:
let image = UIImage(named: "myImage")

// After: Loading from the framework bundle:
let image = UIImage(
  named: "myImage",
  in: Bundle(for: TypeInFramework.self),
  compatibleWith: nil)
```

### Duplicate localizations

If you see localized strings files being marked as duplicates you may be able to delete one. For example if you have:

```
- fr.lproj
  - Localizable.strings
  - InfoPlist.strings
- fr-CA.lproj
  - Localizable.strings
  - InfoPlist.strings
- en.lproj
  - Localizable.strings
  - InfoPlist.strings
```

And Localizable.strings in fr-CA is identical to the file in fr, you can delete the fr-CA variant and iOS will fallback to the closest matching version, in this case fr.

### Android

Emerge suggests duplicate resource and asset candidates if the potential savings of removing one duplicate is over **0.5 kb**. Emerge detects if a file is a duplicate by checking a hash of the file contents. The file savings shown on each insight is the potential savings of removing all of the duplicated resource/asset files, keeping one remaining.

Emerge also shows duplicate files directly in the size treemap by coloring the respective file red, with the path and filename of the duplicate present in the tooltip when hovering over the file's node.

---

## 2. Optimize Images

Emerge finds all large images in your app, including ones in asset catalogs (iOS), and determines if their size could be reduced or updated to more optimized image formats.

### iOS: Image formats and compression

On iOS, Emerge will show an optimized image insight for any image whose size can be reduced by more than **4kb** through lossy compression or converted to HEIC format. Emerge starts by setting the compression level of each image to **85**, and flags any with significant size reductions as optimizable. If the image is not already in HEIC format, and your app targets iOS 12 or later, Emerge will run the same analysis but with the image conversion to HEIC. The larger of these savings will be used to compute your total estimated size reduction, but both are displayed in the details row for an image.

For brevity in the UI we will only list the image with the highest scale of an image set that needs to be optimized. For example, our insight might flag a 3x image as needing to be optimized, but it's possible the 2x and 1x variants also need to be optimized.

#### Optimize your images

Once you decide to optimize an image, you can use command-line tools such as Imagemin or a GUI like ImageOptim to export a compressed image. To convert an image to HEIC on Mac open it in Preview and choose File -> Export then select HEIC from the format dropdown.

### Android: Lossless WebP format

Emerge finds all instances of a PNG or JPEG file in your resources or assets directory in your APK(s) (split APKs if you uploaded an AAB). Emerge then runs a comparison of the original PNG/JPEG image to the lossless WebP converted version of the image, and if there is a reduction in app size between the two, Emerge will suggest using the lossless WebP and include the potential size savings of using the WebP image.

**Note:** Based on your minSdkVersion, Emerge will recommend lossless WebP conversion if the minSdkVersion is >= 18. If < 18, Emerge will skip any assets with Alpha, as those are not supported below 18.

#### Converting an image to WebP

Emerge allows you to automatically download the lossless WebP image directly from our insights. Download from the link in the insight and replace your file locally with the optimized image!

Alternatively, you can use Android Studio to convert a JPEG/PNG/BMP/static GIF to WebP, or cwebp, a command-line tool, to convert your images manually to WebP. With these tools, you can specify additional lossy compression parameters to obtain further size savings, but at the tradeoff of image quality.

---

## 3. Strip Binary Symbols (iOS)

⚠️ **Stripping symbols may cause issues with crash symbolication:** Binary symbols are used to symbolicate crash reports. Stripping symbols is only recommended if you are uploading DSYMs to a crash reporter.

Swift binaries include large amounts of symbols in a segment of the binary used by the dynamic linker. These are generally not needed in production builds. If you build your app with bitcode these symbols will automatically be stripped out. However, Xcode 14 deprecated bitcode by default and Apple will remove the ability to build with bitcode in a future Xcode release.

Here's the command to strip symbols for a particular binary:

```bash
strip -rSTx AppBinary -o AppBinaryStripped
```

The `T` flag tells strip to remove Swift symbols, the other flags remove debugging and local symbols.

### Script to automatically strip symbols

Symbol stripping can be done automatically by adding a custom "Run Script" build phase at the very end of building. Here is a sample script that may require adjustments for your particular project. This script will strip your main app binary along with any binaries it finds in the /Frameworks directory.

```bash
#!/bin/bash
set -e

echo "Starting the symbol stripping process..."

if [ "Release" = "${CONFIGURATION}" ]; then
    echo "Configuration is Release."

    # Path to the app directory
    APP_DIR_PATH="${BUILT_PRODUCTS_DIR}/${EXECUTABLE_FOLDER_PATH}"
    echo "App directory path: ${APP_DIR_PATH}"

    # Strip main binary
    echo "Stripping main binary: ${APP_DIR_PATH}/${EXECUTABLE_NAME}"
    strip -rSTx "${APP_DIR_PATH}/${EXECUTABLE_NAME}"
    if [ $? -eq 0 ]; then
        echo "Successfully stripped main binary."
    else
        echo "Failed to strip main binary." >&2
    fi

    # Path to the Frameworks directory
    APP_FRAMEWORKS_DIR="${APP_DIR_PATH}/Frameworks"
    echo "Frameworks directory path: ${APP_FRAMEWORKS_DIR}"

    # Strip symbols from frameworks, if Frameworks/ exists at all
    # ... as long as the framework is NOT signed by Apple
    if [ -d "${APP_FRAMEWORKS_DIR}" ]; then
        echo "Frameworks directory exists. Proceeding to strip symbols from frameworks."
        find "${APP_FRAMEWORKS_DIR}" -type f -perm +111 -maxdepth 2 -mindepth 2 -exec bash -c '
            codesign -v -R="anchor apple" "{}" &> /dev/null || (
                echo "Stripping {}"
                if [ -w "{}" ]; then
                    strip -rSTx "{}"
                    if [ $? -eq 0 ]; then
                        echo "Successfully stripped {}"
                    else
                        echo "Failed to strip {}" >&2
                    fi
                else
                    echo "Warning: No write permission for {}"
                fi
            )
        ' \;
        if [ $? -eq 0 ]; then
            echo "Successfully stripped symbols from frameworks."
        else
            echo "Failed to strip symbols from some frameworks." >&2
        fi
    else
        echo "Frameworks directory does not exist. Skipping framework stripping."
    fi
else
    echo "Configuration is not Release. Skipping symbol stripping."
fi

echo "Symbol stripping process completed."
```

#### Script Input Files

Xcode may execute build steps in parallel if they have no dependencies on each other. Make sure to configure the Input File for the script as described below. Since we are stripping symbols from the binaries themselves, as mentioned earlier you must instead upload dSYM files to your crash reporting service. However, since Xcode generates dSYM files from your binaries, the resulting dSYM file will be empty if the binary has already been stripped. This means we need to tell Xcode to wait and run our script only once dSYM files have been generated.

To do so, add `${DWARF_DSYM_FOLDER_PATH}/${DWARF_DSYM_FILE_NAME}/Contents/Resources/DWARF/${EXECUTABLE_NAME}` as an Input File.

---

## 4. Minify Localized Strings (iOS)

There are two major ways to reduce localized strings size.

### Less size reduction, but less effort required

Make sure that localized strings are encoded as **text files** (`"key" = "value";`) and not binary plists. Though it may seem odd that the human-readable format would be more size-efficient than the binary format, this is indeed the case (assuming you also follow the other tips on this page as well).

You can fix this by setting **"Strings File Output Encoding"** (`STRINGS_FILE_OUTPUT_ENCODING`) to **"UTF-8"** in your Xcode build settings.

Once they're text plists, localized string files can contain comments by default like:

```
/* Title for a pop-up alert that tells the user the QR code they just scanned has expired. */
"code_expired" = "Code Expired";
```

These comments are used by translators to provide additional context about the phrase, but aren't useful in the production app. Emerge lets you know if any files in your app still have these comments. You can remove all of them from localized strings files. If you have many strings or very detailed descriptions removing them can offer significant savings.

### Script to automatically remove comments and empty lines from .strings files

1. Open your project in Xcode.
2. Go to you target Build Phases tab.
3. Add a new Run Script Phase.
4. Set the shell to your local path for python3 (if installed with homebrew on M1 machines: `/opt/homebrew/bin/python3`).
5. Add the Script content:

```python
import os
import json

def minify(file_path):
    os.system(f"plutil -convert json '{file_path}'")
    new_content = ''
    with open(file_path, 'r') as input_file:
        data = json.load(input_file)
    for key, value in data.items():
        new_content += f'"{key}" = "{value}";\n'
    with open(file_path, 'w') as output_file:
        output_file.write(new_content)

file_extension = '.strings'
for root, _, files in os.walk(os.environ['BUILT_PRODUCTS_DIR'], followlinks=True):
    for filename in files:
        if filename.endswith(file_extension):
            input_path = os.path.join(root, filename)
            print("Minimizing " + input_path)
            minify(input_path)
```

### More size reduction (90%+ size decrease) but more effort required

- Integrate [SmallStrings library](https://github.com/EmergeTools/SmallStrings) into your app following the steps in the repo
- Replace all calls to `NSLocalizedString` with `SSTStringForKey`

---

## 5. Remove Unnecessary Files (iOS)

Common files like README and provisioning profiles are accidentally included in apps, we scan for these and flag them for removal. Usually you can remove these from your app by unchecking the target membership in Xcode.

### Kinds of files Emerge finds

- Common informational files such as README, AUTHORS, CHANGELOG
- Shell scripts, these are often included in a mobile apps repo for automated tooling, but rarely are needed in the app bundle
- Provisioning profiles used when code signing the app, but once it's signed the `.mobileprovision` file does not need to be in your app bundle.
- Build configuration settings (xcconfig/bazel). These are used to determine how the app is built, but don't need to be in the app bundle.
- `.swiftmodule` files which describe the interface to a Swift framework and are used when linking against pre-compiled swift libraries. They are not needed in the app bundle.
- `.bcsymbolmap` files which are needed for recompiling an app after uploading to Apple, but should not be included in the app bundle.
- Code header files such as a `.pch` file or the contents of a "Headers" directory.

---

## 6. Avoid Many Files (iOS)

Every file in your app has extra overhead that can bloat your app size. In the `_CodeSignature` folder of an app bundle you'll find a plist file named `CodeResources`. This contains a collection of every file in the bundle and a signature of the contents. The data is used by iOS to validate an app is not modified.

```xml
<dict>
  <key>files</key>
  <dict>
    <key>AppIcon60x60@2x.png</key>
    <data>
      /1UymLY9lYt+mYZPDnqAyaodgeE=
    </data>
    <key>AppIcon76x76@2x~ipad.png</key>
    <data>
      0fo27RIQex7xfxfz11SWPqh1Yts=
    </data>
    <key>Assets.car</key>
```

As you can see, the file will increase in size as more files are included in your app. For apps with **10k+ files** this overhead becomes **>5mb**. The problem only gets worse if files are included in a framework since frameworks have their own copy of the CodeResources.

There is an easy fix, be aware of what files your app uses and move loose files to compiled asset catalogs when possible. Emerge will warn you if many files are found in the app.

### Small Files

Files under **4kb** have the same code signature overhead as any other file, but they are even more inefficient in terms of install size. Each file has a minimum allocation size at the file system level. This means a **4kb minimum allocation size** causes one thousand 1kb files to take up 4 MB. The macOS inspector shows the difference in size between a file's contents and disk space used.

This seemingly tiny issue can add up very fast and bloat install size, giving users less space their device. We recommend merging small files such as localized strings into a single file, and moving other into asset catalogs.

---

## 7. Use Asset Catalogs (iOS)

Asset catalogs help organize resources in your app and provide access to them at runtime. They also optimize storage of data in your app including images, colors, fonts, and JSON to provide the smallest possible app size.

### Image scales

If you're not using asset catalogs, you may have loose images in your app such as:

```
my_icon@1x.png
my_icon@2x.png
my_icon@3x.png
my_icon~ipad.png
```

With this structure duplicate images are included for all users, everyone gets the images for every screen density. You can optimize this by placing images in asset catalogs so app thinning only delivers the required images.

Emerge calculates the size of extra image scales in your app to demonstrate the savings you can get from moving images to asset catalogs.

### Loose files

Asset catalogs help manage all kinds of data in your app, even JSON files commonly used for configuration or Lottie animations. If you keep these files loose there are hidden costs associated with them. Since compiled asset catalogs are a single .car file in the file system, resources in asset catalogs will not incur this overhead. You can use `NSDataAssets` to load any resource from an asset catalog instead of the file system.

---

## 8. Firebase API Exposed (Android)

By default, the Android API Key created by Firebase can expose sensitive remote config data for your app. Emerge scans your app and warns you if this security issue is detected.

### The issue

When you create a Firebase account, some API Keys are automatically generated on the Google Cloud Console. You can see them on https://console.cloud.google.com/apis/credentials. If you click on `Android key (auto created by Firebase)`, you will see that by default it has **no Application restrictions**.

This means that anyone could invoke some read-only Google Cloud/Firebase APIs if they have the proper keys. When you integrate Firebase on your android app, you are required to copy the `google-services.json` file on your project. This file contains your project id and the API key, and it will be part of your APK/AAB. So, anyone could get your app keys from your app and invoke a read-only Firebase API.

The steps to do that are pretty simple:

1. Open the Android APK/AAB with Android Studio APK Analyzer (`Build -> Analyze APK`)
2. Open the strings resources and find the Google API Key (`google_api_key`), Firebase Project ID (`project_id`), and the Google App ID (`google_app_id`)
3. Execute the following request, replacing the PROJECT_ID, API_KEY, and APP_ID values with the ones you found in step 2:

```bash
curl -v -X POST "https://firebaseremoteconfig.googleapis.com/v1/projects/{PROJECT_ID}/namespaces/firebase:fetch?key={API_KEY}" -H "Content-Type: application/json" --data '{"appId": "{APP_ID}", "appInstanceId": "PROD"}'
```

If the vulnerability is present, you will get a JSON with all your Remote Config Parameters and their values on the response:

```json
{
  "entries": {
    "key1": "value1"
  },
  "state": "UPDATE",
  "templateVersion": "1"
}
```

### Why is this important?

Exposing the remote config information associated with your app can allow users to uncover sensitive secrets, experimentation information, feature flags, and any information you might store in Firebase Remote Config. While Firebase recommends against storing any sensitive data in Remote Config, exposing any remote config is a poor security practice and is an easy vulnerability to expose at scale.

### The fix

You can't avoid having those keys exposed on the APK/AAB, because Firebase SDK needs them. But you can restrict access to the API. Go to https://console.cloud.google.com/apis/credentials and select the `Android key (auto created by Firebase)`, then you will see an **Application Restrictions** section. You need to pick the **Android Apps** option and add an entry for each application id / Keystore SHA1 of your app.

Remember to take into account the SHA1 for the following Keystores:

- Your debug Keystore (the Keystore you use during development)
- Your upload Keystore (the Keystore you use to upload the APK/AAB to Google Play)
- Your Google Play Keystore (the Keystore generated by Google Play if you have Play App Signing enabled)
- Your Firebase App Distribution Keystore

After doing that, only the application with the proper signature will be able to access the Firebase APIs. You will get the following error if you try to request the API without the correct signature:

```json
{
  "error": {
    "code": 403,
    "message": "Requests from this Android client application <empty> are blocked.",
    "status": "PERMISSION_DENIED",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "API_KEY_ANDROID_APP_BLOCKED",
        "domain": "googleapis.com",
        "metadata": {
          "service": "firebaseremoteconfig.googleapis.com",
          "consumer": "projects/123456789"
        }
      }
    ]
  }
}
```

---

## 9. Multiple native library architectures (Android)

If multiple native library architectures are included in the APK(s) users download, Emerge will suggest you remove native libraries from architectures that are unsupported on our baseline device (arm64-v8a - Google Pixel 3, Android 12). Users only need the native libraries specific to their device's application binary interface (ABI). Including ABIs that aren't supported by a device introduces a significant amount of unnecessary bloat, and can easily and safely be removed.

### How to resolve

There are a few scenarios in which end-users would receive multiple native library architectures on their device:

- If receiving a Universal APK from the Play Store
- If ABI splits are disabled for generated AABs
- If manual splits are configured and the ABI split is disabled

#### Universal APKs

It's not actually possible to remove additional ABIs from Universal APKs, as by the name, Universal APKs are intended to support any device. If shipping to the Play Store, Emerge recommends shipping AABs rather than single, Universal APKs. AABs offer significant app size advantages over Universal APKs, and Google Play requires new apps to publish AABs.

For more reading about the app size advantages of AABs, read Emerge's additional documentation on Split APKs.

#### ABI split AAB opt-out

AABs can be configured in the Android Gradle Plugin's `android {}` block with the `bundle {}` block. By default, all splits are enabled, but any split (density, ABI, language) can be disabled manually. To ensure users are receiving only the APKs split from the AAB that include only the native libraries necessary for their device, ensure the `splitEnabled` field inside the `abi {}` block is set to `true`, or not present, as the default value is `true`.

```gradle
// build.gradle.kt
android {
  bundle {
    ..
    abi {
      splitEnabled.set(true) // Or can be removed, as default is true
    }
  }
}

// build.gradle
android {
  bundle {
    ..
    abi {
      splitEnabled = true // Or can be removed, as default is true
    }
  }
}
```

More documentation on the `bundle {}` configuration block can be found [here](https://developer.android.com/studio/build/configure-app-bundle).

#### Manual splits

Similar to the ABI split AAB opt-out with the `bundle {}` block, the `split {}` block can be used to output split APKs manually. If configured to skip ABI splits, Android will package all native library architectures into the main split. Ensure your split Gradle dls config has the `isEnabled = true` field set for the `abi {}` block.

```gradle
// build.gradle.kt
android {
  splits {
    ..
    abi {
      isEnabled.set(true)
    }
  }
}

// build.gradle
android {
  splits {
    ..
    abi {
      isEnabled = true
    }
  }
}
```

More information about the ABI configuration for manual APK splits can be found [here](https://developer.android.com/studio/build/configure-apk-splits#configure-abi-split).

---

## 10. Unused Protocols (iOS)

The unused protocol insight finds any protocols in your app binary that no type conforms to. This indicates a protocol that can be removed. However, it may not be entirely unused because you still could have code like:

```swift
if let protocolType = input as? MyProtocol { ... }
```

If `MyProtocol` was unused, this cast would never succeed and could be removed. You also might see the unused protocol insight even when you see types in your code that does conform to the protocol. This would mean the type that conforms to the protocol isn't included in the binary uploaded to Emerge. The type could be getting stripped, or could be compiled out with something like an `#if DEBUG` check. You can move the protocol behind a check like this as well to fix the insight.

---

## 11. Optimize Icons (iOS)

By default, when an app includes only a 1024x1024 pixel image for its icons, Apple ships this full-resolution image with the app to users. While the primary icon requires this high resolution for display in the App Store, alternate icons do not need to be as large. The largest resolution required for alternate icons is 180x180 pixels, which is the maximum size displayed on iPhone Plus devices ([see apple guide](https://developer.apple.com/design/human-interface-guidelines/app-icons)).

For the primary icon, it is essential to use a 1024x1024 pixel resolution. This ensures the icon appears sharp in the App Store page. On the other hand for alternate icons, a resolution of 180x180 pixels is sufficient, as this is the maximum size at which they will be displayed, even on the largest iPhone Plus devices.

To optimize space, we suggest creating alternate icons at 180x180 pixels and then upscaling them to 1024x1024 pixels for submission. This approach helps reduce the app's storage footprint without compromising the quality of the icons. Our automatic insight will first downscale the full resolution image to 180x180 pixels to remove detail and then upscale it again for 1024px so it can be used in Xcode.

---

**End of Documentation**
