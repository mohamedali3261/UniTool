/**
 * Keep blob URLs alive long enough for mobile browsers to hand off a download.
 * Delegates to the shared Safari-safe helper (detached anchors and eager
 * revokes cancelled downloads in WebKit).
 */
export { downloadBlob as downloadFile } from '../../../src/utils/download';
