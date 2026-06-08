// ============================================================
// PixelCraft 历史记录管理器（撤销 / 重做）
// 策略：基于 Canvas ImageData快照，最多保留 20 步
// ============================================================

export interface HistoryEntry {
  label: string;          // 操作描述
  snapshot: ImageData;   // 像素化结果快照
  params: string;         // 参数快照（JSON，用于去重）
}

const MAX_HISTORY = 20;

export class HistoryManager {
  private stack: HistoryEntry[] = [];
  private pointer: number = -1; // -1 = 无历史

  /** 推入新快照（重做栈清除） */
  push(snapshot: ImageData, params: object, label = '像素化') {
    // 去重：参数相同则跳过
    const paramsKey = JSON.stringify(params);
    const current = this.currentParams();
    if (current === paramsKey) return;

    // 截断重做栈
    this.stack = this.stack.slice(0, this.pointer + 1);
    this.stack.push({ label, snapshot, params: paramsKey });

    // 限制容量
    if (this.stack.length > MAX_HISTORY) {
      this.stack.shift();
    } else {
      this.pointer++;
    }
  }

  /** 撤销一步 */
  undo(): ImageData | null {
    if (!this.canUndo()) return null;
    this.pointer--;
    return this.stack[this.pointer]?.snapshot ?? null;
  }

  /** 重做一步 */
  redo(): ImageData | null {
    if (!this.canRedo()) return null;
    this.pointer++;
    return this.stack[this.pointer]?.snapshot ?? null;
  }

  canUndo(): boolean { return this.pointer > 0; }
  canRedo(): boolean { return this.pointer < this.stack.length - 1; }

  currentParams(): string | null {
    return this.stack[this.pointer]?.params ?? null;
  }

  /** 获取当前步骤描述（用于显示） */
  currentLabel(): string | null {
    return this.stack[this.pointer]?.label ?? null;
  }

  get pointerIndex() { return this.pointer; }
  get totalSteps() { return this.stack.length; }

  clear() {
    this.stack = [];
    this.pointer = -1;
  }
}
