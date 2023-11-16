// src/mocks/browser.js
import { setupWorker } from 'msw'
import { handlers } from './handlers'
// ハンドラに書かれた定義をService Workerに設定する
export const worker = setupWorker(...handlers)