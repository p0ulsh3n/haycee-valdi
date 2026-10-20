# Environment audit

Generated: 2026-10-19T23:52:42.7978443Z

## Detected environment

| Tool/system | Observed value |
|---|---|
| System | Windows 11 Professional, build 26200, 64 bits | | PowerShell | 7.6.5 | | Node.js |  | | npm | npm <command>  Usage:  npm install        install all the dependencies in your project npm install <foo>  add the <foo> dependency to your project npm test           run this project's tests npm run <foo>      run the script named <foo> npm <command> -h   quick help on <command> npm -l             display usage info for all commands npm help <term>    search for help on <term> (in a browser) npm help npm       more involved overview (in a browser)  All commands:      access, adduser, approve-scripts, audit, bugs, cache, ci,     completion, config, dedupe, deny-scripts, deprecate, diff,     dist-tag, docs, doctor, edit, exec, explain, explore,     find-dupes, fund, get, help, help-search, init, install,     install-ci-test, install-test, link, ll, login, logout, ls,     org, outdated, owner, pack, ping, pkg, prefix, profile,     prune, publish, query, rebuild, repo, restart, root, run,     sbom, search, set, shrinkwrap, stage, star, stars, start,     stop, team, test, token, trust, undeprecate, uninstall,     unpublish, unstar, update, version, view, whoami  Specify configs in the ini-formatted file:     C:\Users\darkk\.npmrc or on the command line via: npm <command> --key=value  More configuration info: npm help config Configuration fields: npm help 7 config  npm@11.17.0 C:\Program Files\nodejs\node_modules\npm | | Git | git: '' is not a git command. See 'git --help'.  The most similar commands are 	add 	backfill 	bisect 	branch 	clone 	commit 	diff 	fetch 	grep 	init 	log 	merge 	mv 	pull 	push 	rebase 	reset 	restore 	rm 	show 	status 	switch 	tag 	am 	gc 	p4 | | Git LFS | git-lfs/3.7.1 (GitHub; windows amd64; go 1.25.1; git b84b3384) git lfs <command> [<args>]  Git LFS is a system for managing and versioning large files in association with a Git repository. Instead of storing the large files within the Git repository as blobs, Git LFS stores special "pointer files" in the repository, while storing the actual file contents on a Git LFS server. The contents of the large file are downloaded automatically when needed, for example when a Git branch containing the large file is checked out.  Git LFS works by using a "smudge" filter to look up the large file contents based on the pointer file, and a "clean" filter to create a new version of the pointer file when the large file's contents change. It also uses a pre-push hook to upload the large file contents to the Git LFS server whenever a commit containing a new large file version is about to be pushed to the corresponding Git server.  Commands --------  Like Git, Git LFS commands are separated into high level ("porcelain") commands and low level ("plumbing") commands.  High level porcelain commands ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  git lfs checkout:   Populate working copy with real content from Git LFS files. git lfs completion:   Generate shell scripts for command-line tab-completion of Git LFS commands. git lfs dedup:   De-duplicate Git LFS files. git lfs env:   Display the Git LFS environment. git lfs ext:   Display Git LFS extension details. git lfs fetch:   Download Git LFS files from a remote. git lfs fsck:   Check Git LFS files for consistency. git lfs install:   Install Git LFS configuration. git lfs lock:   Set a file as "locked" on the Git LFS server. git lfs locks:   List currently "locked" files from the Git LFS server. git lfs logs:   Show errors from the Git LFS command. git lfs ls-files:   Show information about Git LFS files in the index   and working tree. git lfs migrate:   Migrate history to or from Git LFS git lfs prune:   Delete old Git LFS files from local storage git lfs pull:   Fetch Git LFS changes from the remote & checkout any required working tree   files. git lfs push:   Push queued large files to the Git LFS endpoint. git lfs status:   Show the status of Git LFS files in the working   tree. git lfs track:   View or add Git LFS paths to Git attributes. git lfs uninstall:   Uninstall Git LFS by removing hooks and smudge/clean filter configuration. git lfs unlock:   Remove "locked" setting for a file on the Git LFS server. git lfs untrack:   Remove Git LFS paths from Git Attributes. git lfs update:   Update Git hooks for the current Git repository. git lfs version:   Report the version number.  Low level plumbing commands ~~~~~~~~~~~~~~~~~~~~~~~~~~~  git lfs clean:   Git clean filter that converts large files to pointers. git lfs filter-process:   Git process filter that converts between large files and pointers. git lfs merge-driver:   Merge text-based LFS files git lfs pointer:   Build and compare pointers. git lfs post-checkout:   Git post-checkout hook implementation. git lfs post-commit:   Git post-commit hook implementation. git lfs post-merge:   Git post-merge hook implementation. git lfs pre-push:   Git pre-push hook implementation. git lfs smudge:   Git smudge filter that converts pointer in blobs to the actual content. git lfs standalone-file:   Git LFS standalone transfer adapter for file URLs (local paths).  Examples --------  To get started with Git LFS, the following commands can be used.  . Setup Git LFS on your system. You only have to do this once per user account: +  git lfs install  . Choose the type of files you want to track, for examples all ISO images, with git lfs track: +  git lfs track "*.iso"  . The above stores this information in gitattributes(5) files, so that file needs to be added to the repository: +  git add .gitattributes  . Commit, push and work with the files normally: +  git add file.iso git commit -m "Add disk image" git push | | Java | Error: Could not find or load main class  Caused by: java.lang.ClassNotFoundException: | | Bazel/Bazelisk | not found | | Android SDK | C:\Users\darkk\AppData\Local\Android\Sdk | | ADB | adb.exe: unknown command | | Xcode | not available on Windows host | | Valdi CLI | valdi <command>  Commands:   valdi completion                                               generate completion script   valdi bootstrap                                                Prepares and initializes a project to build and run in Valdi   valdi build <platform>                                         Build the application   valdi dev_setup                                                Sets up the development environment for Valdi   valdi doctor                                                   Check your Valdi development environment for common issues   valdi export <platform>                                        Build and export a Valdi library   valdi hotreload [--module module_name] [--target target_name]  Starts the hotreloader for the application   valdi inspect <command>                                        Inspect a running Valdi app — component trees, contexts, screenshots, heap   valdi install <platform>                                       Build and install the application to the connected device   valdi lint <command>                                           Checks and formats the code   valdi log                                                      Streams Valdi logs from the connected device to console   valdi new_module [module-name]                                                                  ******************************************                                                                          Valdi Module Creation Guide                                                                  ******************************************                                                                   Requirements for Valdi module names:                                                                  - May contain: A-Z, a-z, 0-9, '-', '_', '.'                                                                  - Must start with a letter.                                                                   Recommended Directory Structure:                                                                  my_application/          # Root directory of your application                                                                  ├── WORKSPACE            # Bazel Workspace                                                                  ├── BUILD.bazel          # Bazel build                                                                  └── modules/                                                                      ├── module_a/                                                                      │   ├── BUILD.bazel                                                                      │   ├── android/     # Native Android sources (Kotlin)                                                                      │   ├── ios/         # Native iOS sources (Objective-C)                                                                      │   ├── macos/       # Native macOS sources (Objective-C)                                                                      │   ├── web/         # Web sources (TypeScript, compiled by tsc)                                                                      │   └── src/         # Valdi sources                                                                      │       └── ModuleAComponent.tsx                                                                      ├── module_b/                                                                          ├── BUILD.bazel                                                                      │   ├── res/         # Image and font resources                                                                      │   ├── strings/     # Localizable strings                                                                          └── src/                                                                              └── ModuleBComponent.tsx                                                                   For more comprehensive details, refer to the core-module documentation:                                                                  https://github.com/Snapchat/Valdi/blob/main/docs/docs/core-module.md                                                                   ******************************************    valdi package <platform>                                       Build and package a Valdi application   valdi profile <command>                                        Capture a CPU profile from the Hermes JS runtime   valdi projectsync [--target target]                            Synchronize VSCode project for the given targets   valdi skills <command>                                         Manage AI assistant skills for Valdi development   valdi test [--module module_name] [--target target_name]       Runs tests for given module(s) or target(s). Runs all tests if no module or target is specified.  Options:   --debug    Run with debug logging  [boolean] [default: false]   --version  Show version number  [boolean]   --help     Show help  [boolean]  Unknown argument: "" |

## Interpretation

- The host is Windows x64. Official Valdi setup documentation describes macOS and Linux prerequisites; Windows target/build support is not assumed.
- iOS/macOS validation is blocked because Xcode and macOS are unavailable.
- Bazel/Bazelisk and the Java runtime configuration required by the current CLI were not recognized during the audit.
- Android SDK and platform-tools are present, but a complete Valdi Android build was not claimed.

## Raw doctor result

```json
{
  "timestamp": "2026-10-19T23:52:42.746Z",
  "summary": {
    "passed": 9,
    "warnings": 4,
    "failed": 5,
    "total": 18
  },
  "results": [
    {
      "name": "Node.js version",
      "status": "pass",
      "message": "Node.js v24.19.0 is installed",
      "category": "Node.js installation"
    },
    {
      "name": "Bazel installation",
      "status": "fail",
      "message": "Bazel is not installed or not in PATH",
      "fixable": true,
      "fixCommand": "Install Bazel from https://bazel.build/install",
      "category": "Bazel installation"
    },
    {
      "name": "Valdi workspace",
      "status": "pass",
      "message": "Valid Valdi workspace detected",
      "category": "Workspace configuration"
    },
    {
      "name": "Bazel configuration",
      "status": "pass",
      "message": ".bazelrc file found",
      "category": "Workspace configuration"
    },
    {
      "name": "Android SDK",
      "status": "pass",
      "message": "Android SDK found at C:\\Users\\darkk\\AppData\\Local\\Android\\Sdk",
      "category": "Android installation"
    },
    {
      "name": "Java Runtime",
      "status": "fail",
      "message": "Java not found in PATH",
      "details": "dev_setup installs Java JDK for Android development",
      "fixable": true,
      "fixCommand": "Install Java 17 JDK for your distribution",
      "category": "Java installation"
    },
    {
      "name": "JAVA_HOME",
      "status": "warn",
      "message": "JAVA_HOME not set or invalid",
      "details": "dev_setup configures JAVA_HOME for Android development",
      "fixable": true,
      "fixCommand": "Set JAVA_HOME environment variable",
      "category": "Java installation"
    },
    {
      "name": "Android Platform",
      "status": "pass",
      "message": "Android Platform installed (4 versions)",
      "category": "Android installation"
    },
    {
      "name": "Android Build Tools",
      "status": "pass",
      "message": "Android Build Tools installed (5 versions)",
      "category": "Android installation"
    },
    {
      "name": "git installation",
      "status": "fail",
      "message": "git is not installed or not in PATH",
      "fixable": true,
      "fixCommand": "Install git using your system's package manager",
      "category": "Development tools"
    },
    {
      "name": "npm installation",
      "status": "fail",
      "message": "npm is not installed or not in PATH",
      "fixable": true,
      "fixCommand": "Install Node.js from https://nodejs.org (includes npm)",
      "category": "Development tools"
    },
    {
      "name": "watchman installation",
      "status": "fail",
      "message": "watchman is not installed or not in PATH",
      "fixable": true,
      "fixCommand": "Install watchman using your system's package manager",
      "category": "Development tools"
    },
    {
      "name": "Git LFS",
      "status": "warn",
      "message": "git-lfs not installed",
      "details": "Required for working with large files in the repository",
      "fixable": true,
      "fixCommand": "Install git-lfs using your system's package manager",
      "category": "Development tools"
    },
    {
      "name": "Android Platform android-36",
      "status": "pass",
      "message": "Android Platform android-36 installed",
      "category": "Android installation"
    },
    {
      "name": "Android NDK",
      "status": "warn",
      "message": "Android NDK 25.2.9519653 not found",
      "details": "Required for native development in framework",
      "fixable": true,
      "fixCommand": "sdkmanager --install 'ndk;25.2.9519653'",
      "category": "Android installation"
    },
    {
      "name": "ANDROID_HOME",
      "status": "pass",
      "message": "ANDROID_HOME set to C:\\Users\\darkk\\AppData\\Local\\Android\\Sdk",
      "category": "Android installation"
    },
    {
      "name": "ANDROID_NDK_HOME",
      "status": "warn",
      "message": "ANDROID_NDK_HOME not set or invalid",
      "details": "dev_setup configures ANDROID_NDK_HOME for native development",
      "fixable": true,
      "fixCommand": "valdi dev_setup",
      "category": "Android installation"
    },
    {
      "name": "Android platform-tools PATH",
      "status": "pass",
      "message": "Android platform-tools in PATH",
      "category": "Android installation"
    }
  ]
}
Error: valdi doctor failed
    at valdiDoctor (C:\Users\darkk\AppData\Roaming\npm\node_modules\@snap\valdi\dist\commands\doctor.js:1160:15)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async command (C:\Users\darkk\AppData\Roaming\npm\node_modules\@snap\valdi\dist\utils\errorUtils.js:35:13)
[31mvaldi doctor failed[0m
```

