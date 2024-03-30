import * as vscode from 'vscode'

import {
  BlockDesc,
  dimeDecorationType,
} from './base'

import {
  DocumentParserOptions,
  DocumentParser,
} from './parser'

// 对文档解析出来的条件块列表进行缓存
const CacheEngine = {
  cache: {} as {
    [key: string]: {
      version: number,
      blocks: BlockDesc[],
    }
  },

  get(document: vscode.TextDocument) {
    let value = this.cache[document.fileName]
    if (value && value.version === document.version) return value.blocks
    return
  },

  set(document: vscode.TextDocument, blocks: BlockDesc[]) {
    this.cache[document.fileName] = {
      version: document.version,
      blocks,
    }
  },

  remove(document: vscode.TextDocument) {
    delete this.cache[document.fileName]
  },
}

// 解析文档的条件块，并缓存解析结果
function parseDocument(document: vscode.TextDocument) {
  // console.log(`parseDocument [${document.version}] ${document.fileName}`)
  // 先在缓存中查找
  let blocks = CacheEngine.get(document)
  if (blocks) return blocks

  // 只处理相关的文件类型
  let options: DocumentParserOptions = {}
  if (document.fileName.endsWith('.vue')) {
    options.hasTemplate = true
    options.hasScript = true
    options.hasCss = true
  }
  if (document.fileName.endsWith('.js') || document.fileName.endsWith('.ts')) {
    options.hasScript = true
  }
  if (document.fileName.endsWith('.css')) {
    options.hasCss = true
  }
  if (!options.hasTemplate && !options.hasScript && !options.hasCss) return

  // 解析文档找出所有条件块
  blocks = new DocumentParser(options).parse(document)
  if (!blocks) return

  // 缓存解析结果
  CacheEngine.set(document, blocks)

  return blocks
}

// 更新编辑器里面的条件块显示状态
function updateDecorations(editor?: vscode.TextEditor) {
  if (!editor) return
  let blocks = parseDocument(editor.document)
  if (!blocks) return

  // 获取输入光标所在的位置
  const selection = editor.selection
  let caretPos = selection.end

  // 找到光标所在的条件块
  let curBlock
  for (let block of blocks) {
    let range = new vscode.Range(block.head.start, block.foot.end)
    if (range.contains(caretPos)) {
      curBlock = block
    }
  }

  // 用每个条件块的 mask 去匹配当前块，决定其显示状态，分三种情况：
  // 1. 跟当前块互斥：全灰（有我一定没你）
  // 2. 跟当前块相容，相同或更宽：head/foot 灰（有我一定有你）
  // 3. 跟当前块相容，且更窄：全不变（有我不一定有你没你）
  let dimes = []
  if (curBlock) {
    for (let block of blocks) {
      let x = block.compareTo(curBlock)
      if (x < 0) {
        // 互斥
        let range = new vscode.Range(block.head.start, block.foot.end)
        dimes.push(range)
      } else if (x == 0) {
        // 目标块更宽
        let range = new vscode.Range(block.head.start, block.head.end)
        dimes.push(range)
        range = new vscode.Range(block.foot.start, block.foot.end)
        dimes.push(range)
      }
    }
  }

  editor.setDecorations(dimeDecorationType, dimes)
}

let timers = {} as {
  [key: string]: NodeJS.Timeout
}

function debouncedUpdateDecorations(editor?: vscode.TextEditor, tryImmediate: boolean = false) {
  if (!editor) return
  let key = editor.document.fileName
  let timerId = timers[key]
  if (timerId) {
    clearTimeout(timerId)
  } else {
    if (tryImmediate) {
      // 如果尚未触发防抖且希望立即执行，则立即执行
      updateDecorations(editor)
      return
    }
  }
  // 用定时器设置防抖
  timers[key] = setTimeout(() => {
    delete timers[key]
    updateDecorations(editor)
  }, 500)
}

export function activate(context: vscode.ExtensionContext) {
  // console.log('activate:')

  // 对当前打开的文档，更新其条件块显示状态
  debouncedUpdateDecorations(vscode.window.activeTextEditor)

  // 当文档中的输入光标发生了变化
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection(event => {
      // 请求更新文档的条件块显示状态，如果不是已经有防抖，则不触发防抖而是立即处理
      debouncedUpdateDecorations(event.textEditor, true)
    })
  )

  // 当文档内容被修改
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      // 请求更新文档的条件块显示状态，有防抖
      debouncedUpdateDecorations(vscode.window.activeTextEditor)
    })
  )

  // 当关闭了文档
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument(document => {
      // 清除缓存
      CacheEngine.remove(document)
    })
  )
}

export function deactivate() {
  // console.log('deactivate')
}
