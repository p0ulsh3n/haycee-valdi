/**
 * @ExportModule
 */

/** JSON payloads keep the native bridge stable while the demo API evolves. */
export function loadGallery(): Promise<string>;
export function loadGalleryPage(albumId: string, offset: number, limit: number): Promise<string>;
export function loadMediaThumbnail(contentUri: string, kind: string): Promise<string>;
export function copyMediaToCache(contentUri: string): Promise<string>;
export function hideKeyboard(): Promise<boolean>;
export function requestVoicePermission(): Promise<boolean>;
export function startVoiceRecording(): Promise<boolean>;
export function finishVoiceRecording(): Promise<string>;
export function cancelVoiceRecording(): void;
export function playVoice(fileUri: string): Promise<boolean>;
export function stopVoice(): void;
